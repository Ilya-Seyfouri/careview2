"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useDemoUser } from "./DemoContext";
import { Send, Phone, Video, Info, ChevronLeft } from "lucide-react";

const CARER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const FAMILY_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateDivider(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  for (const msg of messages) {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      groups.push({
        type: "divider",
        label: formatDateDivider(msg.created_at),
        id: `divider-${msg.id}`,
      });
      lastDate = date;
    }
    groups.push({ type: "message", ...msg });
  }
  return groups;
}

export default function Messages() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [patient, setPatient] = useState(null); // the resident linking carer ↔ family
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const channelRef = useRef(null);

  // Determine which side the current user is on
  const isCurrentUserCarer = demoUser?.id === CARER_ID;
  const otherPersonId = isCurrentUserCarer ? FAMILY_ID : CARER_ID;

  useEffect(() => {
    if (!demoUser?.id) return;
    fetchAll();
    subscribeToMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [demoUser]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fetch profiles for both participants
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("id", [CARER_ID, FAMILY_ID]);

      const profMap = {};
      (profs || []).forEach((p) => (profMap[p.id] = p));
      setProfiles(profMap);

      // Resolve the patient linking carer ↔ family
      // Step 1: get patient IDs assigned to the carer
      const { data: carerAssignments } = await supabase
        .from("patient_carers")
        .select("patient_id")
        .eq("carer_id", CARER_ID);

      const carerPatientIds = (carerAssignments || []).map((a) => a.patient_id);

      // Step 2: get patient IDs linked to the family member
      const { data: familyLinks } = await supabase
        .from("patient_family")
        .select("patient_id")
        .eq("family_id", FAMILY_ID);

      const familyPatientIds = (familyLinks || []).map((a) => a.patient_id);

      // Step 3: find the shared patient (intersection)
      const sharedPatientId = carerPatientIds.find((id) =>
        familyPatientIds.includes(id),
      );

      if (sharedPatientId) {
        const { data: pat } = await supabase
          .from("patients")
          .select("id, full_name, room, wing")
          .eq("id", sharedPatientId)
          .single();
        setPatient(pat || null);
      }

      // Fetch messages for this conversation
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("*")
        .eq("carer_id", CARER_ID)
        .eq("family_id", FAMILY_ID)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(msgs || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `carer_id=eq.${CARER_ID}`,
        },
        (payload) => {
          // Only add if it belongs to this conversation
          const msg = payload.new;
          if (msg.family_id === FAMILY_ID) {
            setMessages((prev) => {
              // Avoid duplicates if we already optimistically added it
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !demoUser?.id) return;

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      content: text,
      sender_id: demoUser.id,
      carer_id: CARER_ID,
      family_id: FAMILY_ID,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    inputRef.current?.focus();

    try {
      setSending(true);
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            content: text,
            sender_id: demoUser.id,
            carer_id: CARER_ID,
            family_id: FAMILY_ID,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? data : m)),
      );
    } catch (err) {
      console.error("Send failed:", err);
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherPerson = profiles[otherPersonId];
  const grouped = groupByDate(messages);
  const isLoading = userLoading || loading;

  // Contextual subtitle depending on who is viewing
  const familyPerson = profiles[FAMILY_ID];
  const headerSubtitle = isCurrentUserCarer
    ? patient
      ? `Relative of ${patient.full_name}`
      : "Family member of assigned resident"
    : patient
      ? `Messaging carer assigned to your relative`
      : "Messaging assigned care staff";

  return (
    <section className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* ── Page header ── */}
    
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat window wrapper */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* ── iMessage-style header ── */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-500/20">
                {otherPerson?.full_name?.charAt(0) || "?"}
              </div>
              {/* Online dot */}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-50" />
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">
                {otherPerson?.full_name || "Loading..."}
              </p>
              <p className="text-sm text-gray-400 truncate">{headerSubtitle}</p>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-cyan-500">
                <Phone size={20} />
              </button>
              <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-cyan-500">
                <Video size={20} />
              </button>
              <button className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-cyan-500">
                <Info size={20} />
              </button>
            </div>
          </div>

          {/* ── Message list ── */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 animate-pulse" />
                  <p className="text-sm text-gray-400">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-cyan-500/20">
                  {otherPerson?.full_name?.charAt(0) || "?"}
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-700">
                    {otherPerson?.full_name || ""}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{headerSubtitle}</p>
                </div>
                <p className="text-sm text-gray-400 text-center max-w-md leading-relaxed">
                  This is the beginning of your conversation. Send a message to
                  get started.
                </p>
              </div>
            ) : (
              grouped.map((item) => {
                if (item.type === "divider") {
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-center py-4"
                    >
                      <span className="text-xs text-gray-400 font-medium bg-gray-100 px-4 py-1.5 rounded-full">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                const isMe = item.sender_id === demoUser?.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Other person avatar — only show on their messages */}
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
                        {otherPerson?.full_name?.charAt(0) || "?"}
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[65%] ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed transition-opacity ${
                          item._optimistic ? "opacity-70" : "opacity-100"
                        } ${
                          isMe
                            ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white rounded-br-md shadow-md shadow-cyan-500/20"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {item.content}
                      </div>
                      <span className="text-[11px] text-gray-400 px-1">
                        {formatTime(item.created_at)}
                        {item._optimistic && " · Sending..."}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input bar ── */}
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 bg-gray-100 rounded-3xl px-5 py-3 min-h-[48px] flex items-center">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-grow
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="iMessage"
                  className="w-full bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none leading-relaxed"
                  style={{ height: "24px", maxHeight: "120px" }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                  input.trim()
                    ? "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/30 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Send
                  size={16}
                  className={input.trim() ? "translate-x-px" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
