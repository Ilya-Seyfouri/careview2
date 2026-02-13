"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useDemoUser } from "./DemoContext";
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Plus,
  X,
  ChevronRight,
  FileText,
  Activity,
  User,
  Calendar,
} from "lucide-react";

const SHIFT_TYPES = [
  { value: "AM->PM", label: "AM to PM Transition" },
  { value: "PM->AM", label: "PM to AM Transition" },
];

export default function ShiftHandover() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [patients, setPatients] = useState([]);
  const [pastHandovers, setPastHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [handoverDetails, setHandoverDetails] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);

  // Form state
  const [shiftType, setShiftType] = useState("AM->PM");
  const [generalNotes, setGeneralNotes] = useState("");
  const [redFlags, setRedFlags] = useState([]); // [{ patient_id, patient_notes }]
  const [newFlag, setNewFlag] = useState({ patient_id: "", patient_notes: "" });
  const [addingFlag, setAddingFlag] = useState(false);

  useEffect(() => {
    if (demoUser?.id) fetchData(demoUser);
  }, [demoUser]);

  const fetchData = async (user) => {
    try {
      setLoading(true);

      let patientIds = null;
      if (user.role === "carer") {
        const { data: assignments } = await supabase
          .from("patient_carers")
          .select("patient_id")
          .eq("carer_id", user.id);
        patientIds = (assignments || []).map((a) => a.patient_id);
      }

      let patQuery = supabase
        .from("patients")
        .select("id, full_name, room, wing");
      if (patientIds !== null) patQuery = patQuery.in("id", patientIds);
      const { data: pats } = await patQuery;
      setPatients(pats || []);

      const { data: past } = await supabase
        .from("shift_handovers")
        .select("id, shift_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setPastHandovers(past || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHandoverDetails = async (handoverId, createdAt) => {
    try {
      setHandoverLoading(true);

      // Get all handovers from the same timestamp (grouped by created_at)
      const { data: handoverGroup, error: handoverError } = await supabase
        .from("shift_handovers")
        .select(
          `
          id,
          shift_type,
          notes,
          patient_notes,
          created_at,
          created_by,
          patient:patient_id (id, full_name, room, wing)
        `,
        )
        .eq("created_at", createdAt)
        .order("patient_id", { ascending: true });

      if (handoverError) throw handoverError;

      // Get creator info
      const createdBy = handoverGroup?.[0]?.created_by;
      let creatorInfo = null;
      if (createdBy) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", createdBy)
          .single();
        creatorInfo = creator;
      }

      setHandoverDetails({
        items: handoverGroup || [],
        creator: creatorInfo,
        shiftType: handoverGroup?.[0]?.shift_type,
        generalNotes: handoverGroup?.[0]?.notes,
        createdAt: handoverGroup?.[0]?.created_at,
      });
    } catch (err) {
      console.error("Error fetching handover details:", err);
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleOpenHandover = (handover) => {
    setSelectedHandover(handover);
    fetchHandoverDetails(handover.id, handover.created_at);
  };

  const handleAddFlag = () => {
    if (!newFlag.patient_id) return;
    setRedFlags((prev) => [...prev, { ...newFlag }]);
    setNewFlag({ patient_id: "", patient_notes: "" });
    setAddingFlag(false);
  };

  const handleRemoveFlag = (idx) => {
    setRedFlags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);

    if (redFlags.length === 0) {
      setError("Please add at least one resident red flag before saving.");
      return;
    }

    try {
      setSaving(true);

      const rows = redFlags.map((flag) => ({
        patient_id: flag.patient_id,
        shift_type: shiftType,
        notes: generalNotes || null,
        patient_notes: flag.patient_notes || null,
        created_by: demoUser.id,
      }));

      const { data: insertedHandovers, error: insertError } = await supabase
        .from("shift_handovers")
        .insert(rows)
        .select();

      if (insertError) throw insertError;

      // Audit log: shift handover created
      const actorId =
        demoUser.role === "carer"
          ? "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

      const auditLogs = insertedHandovers.map((handover) => ({
        action_type: "shift_handover_created",
        actor_id: actorId,
        related_to: handover.patient_id,
        created_at: new Date().toISOString(),
      }));

      await supabase.from("audit_logs").insert(auditLogs);

      setSaved(true);
      setTimeout(() => {
        setGeneralNotes("");
        setRedFlags([]);
        setSaved(false);
        fetchData(demoUser);
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save handover");
    } finally {
      setSaving(false);
    }
  };

  const sortedPatients = [...patients].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );
  const flaggedPatientIds = redFlags.map((f) => f.patient_id);
  const availablePatients = sortedPatients.filter(
    (p) => !flaggedPatientIds.includes(p.id),
  );
  const getPatient = (id) => patients.find((p) => p.id === id);

  const completionSteps = [
    { label: "Shift direction set", done: !!shiftType },
    { label: "General observations", done: generalNotes.trim().length > 0 },
    { label: "Resident flags added", done: redFlags.length > 0 },
  ];
  const completionPct = Math.round(
    (completionSteps.filter((s) => s.done).length / completionSteps.length) *
      100,
  );

  const isLoading = userLoading || loading;

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-16">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 ring-1 ring-blue-100">
              <FileText size={10} />
              Care Transition
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Shift Handover
                </h2>
                <p className="text-slate-500 text-base font-medium mt-1">
                  Communication between AM and PM shifts
                </p>
              </div>
              <button
                onClick={() => handleSubmit("published")}
                disabled={saving || saved || isLoading}
                className="bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send size={16} />
                {saving
                  ? "Publishing..."
                  : saved
                    ? "Published!"
                    : "Publish Handover"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
              <p className="font-black text-xl text-slate-900 tracking-tight">
                Loading...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── LEFT COLUMN ── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shift Direction */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <ArrowRight size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Shift Direction
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Required
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SHIFT_TYPES.map((shift) => (
                      <button
                        key={shift.value}
                        onClick={() => setShiftType(shift.value)}
                        className={`py-3 px-4 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                          shiftType === shift.value
                            ? "bg-blue-50 border-blue-400 text-blue-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-black">
                          {shift.value === "AM->PM" ? "AM" : "PM"}
                        </span>
                        <ArrowRight size={14} />
                        <span className="font-black">
                          {shift.value === "AM->PM" ? "PM" : "AM"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* General Observations */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        General Observations
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Mandatory Field
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm resize-none"
                    placeholder="Summarise general facility status, maintenance issues, or site-wide events..."
                  />
                </div>

                {/* Resident Red Flags */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Resident Red Flags
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Per-resident concerns
                      </p>
                    </div>
                  </div>

                  {/* Existing flags */}
                  <div className="space-y-3 mb-4">
                    {redFlags.map((flag, idx) => {
                      const patient = getPatient(flag.patient_id);
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 bg-red-50/50 border border-red-100/50 rounded-xl group"
                        >
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-xs font-black text-red-600 flex-shrink-0">
                            {patient?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-red-900">
                              {patient?.full_name} — Room {patient?.room}
                            </p>
                            <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
                              {flag.patient_notes || (
                                <span className="italic text-red-400">
                                  No notes added
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFlag(idx)}
                            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          >
                            <X size={14} className="text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline add form */}
                  {addingFlag ? (
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Select Resident
                        </label>
                        <select
                          value={newFlag.patient_id}
                          onChange={(e) =>
                            setNewFlag({
                              ...newFlag,
                              patient_id: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        >
                          <option value="">Choose a resident...</option>
                          {availablePatients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.full_name} — Room {p.room} ({p.wing})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Patient Notes
                        </label>
                        <textarea
                          rows={2}
                          value={newFlag.patient_notes}
                          onChange={(e) =>
                            setNewFlag({
                              ...newFlag,
                              patient_notes: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                          placeholder="e.g. Refused morning meds, breathing slightly laboured..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFlag(false);
                            setNewFlag({ patient_id: "", patient_notes: "" });
                          }}
                          className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFlag}
                          disabled={!newFlag.patient_id}
                          className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-40 uppercase tracking-widest"
                        >
                          Add Flag
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingFlag(true)}
                      disabled={availablePatients.length === 0}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-black hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <Plus size={14} />
                      Add New Flag
                    </button>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle
                      size={16}
                      className="text-rose-500 flex-shrink-0"
                    />
                    <p className="text-sm text-rose-600 font-bold">{error}</p>
                  </div>
                )}
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="space-y-5">
                {/* Handover Details — dark card */}
                <div className="bg-slate-900 rounded-[28px] p-6 shadow-2xl shadow-slate-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={16} className="text-blue-400" />
                    <h3 className="text-base font-black text-white">
                      Handover Details
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Date
                      </span>
                      <span className="text-sm font-black text-white">
                        {new Date().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Shift
                      </span>
                      <span className="text-sm font-black text-blue-400">
                        {SHIFT_TYPES.find((s) => s.value === shiftType)?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Author
                      </span>
                      <span className="text-sm font-black text-white">
                        {demoUser?.full_name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Flags
                      </span>
                      <span className="text-sm font-black text-white">
                        {redFlags.length} resident
                        {redFlags.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Completion status */}
                  <div className="mt-6 pt-5 border-t border-slate-700/60">
                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-3">
                      Completion Status
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-white w-8 text-right">
                        {completionPct}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {completionSteps.map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                              done ? "bg-blue-400" : "bg-slate-600"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium transition-colors ${
                              done ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Past Handovers */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <h3 className="text-sm font-black text-slate-900 mb-5">
                    Past Handovers
                  </h3>
                  {pastHandovers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3 font-medium">
                      No past handovers found
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {pastHandovers.map((h) => (
                        <div
                          key={h.id}
                          onClick={() => handleOpenHandover(h)}
                          className="flex items-center justify-between py-3 group cursor-pointer"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {new Date(h.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                              {h.shift_type === "AM->PM"
                                ? "AM Shift"
                                : "PM Shift"}
                            </p>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 group-hover:text-slate-600 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Handover Modal */}
      {selectedHandover && (
        <HandoverModal
          handover={selectedHandover}
          details={handoverDetails}
          loading={handoverLoading}
          onClose={() => {
            setSelectedHandover(null);
            setHandoverDetails(null);
          }}
        />
      )}
    </>
  );
}

/* ─── Handover Modal ─────────────────────────────────────────────── */
function HandoverModal({ handover, details, loading, onClose }) {
  const fmt = (d) =>
    new Date(d).toLocaleString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const shiftLabel =
    details?.shiftType === "AM->PM"
      ? "AM to PM Transition"
      : "PM to AM Transition";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Shift Handover
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {handover?.created_at && fmt(handover.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-5 animate-pulse h-24"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Handover Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ArrowRight size={12} className="text-blue-400" />
                    Shift Type
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {shiftLabel}
                  </p>
                </div>

                {details?.creator && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <User size={12} className="text-blue-400" />
                      Created By
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {details.creator.full_name}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-red-400" />
                    Red Flags
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {details?.items?.length || 0} Resident
                    {details?.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* General Observations */}
              {details?.generalNotes && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    General Observations
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {details.generalNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Resident Red Flags */}
              {details?.items && details.items.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Resident Red Flags
                  </p>
                  <div className="space-y-3">
                    {details.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-5 bg-red-50/50 border border-red-100/50 rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-sm font-black text-red-600 flex-shrink-0">
                          {item.patient?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-base font-black text-red-900">
                              {item.patient?.full_name}
                            </p>
                            <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-black uppercase tracking-widest">
                              Room {item.patient?.room}
                            </span>
                          </div>
                          {item.patient_notes ? (
                            <p className="text-sm text-red-700 font-medium leading-relaxed">
                              {item.patient_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-red-400 italic">
                              No specific notes recorded
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!details?.items?.length && !details?.generalNotes && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText size={48} className="mb-3 opacity-20" />
                  <p className="font-bold text-sm">No details available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
