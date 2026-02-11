"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Heart,
  Clock,
  AlertCircle,
  ClipboardList,
  FileText,
  ChevronRight,
  History,
  MessageSquare,
  X,
} from "lucide-react";
import { useDemoUser } from "../components/DemoContext";

export default function CarerResidentSpecific() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser } = useDemoUser();

  const params = useParams();
  const clientId = params?.id;

  const [client, setClient] = useState(null);
  const [visitLogs, setVisitLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [showAddLog, setShowAddLog] = useState(false);
  const [showViewReport, setShowViewReport] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    fetchAll();
  }, [clientId]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const { data: clientData, error: clientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) {
        setError("Client not found");
        return;
      }
      setClient(clientData);

      const { data: logsData } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("patient_id", clientId)
        .order("created_at", { ascending: false });
      setVisitLogs(logsData || []);

      const { data: reportsData } = await supabase
        .from("reports")
        .select(
          `id, title, content, created_at, created_by_profile:created_by (id, full_name, role)`,
        )
        .eq("patient_id", clientId)
        .order("created_at", { ascending: false });
      setReports(reportsData || []);

      // ── Correct: use patient_family → profiles ──
      const { data: familyLinks } = await supabase
        .from("patient_family")
        .select(
          `relationship, profiles:family_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", clientId);

      const family = (familyLinks || []).map((f) => ({
        ...f.profiles,
        relationship: f.relationship,
      }));
      setFamilyMembers(family);
    } catch (err) {
      console.error(err);
      setError("Failed to load client");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Client not found"}
          </h1>
          <button
            onClick={() => router.push("/carer/myclients")}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
          >
            Back to My Clients
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    Stable: { badge: "bg-green-500/20 text-green-400 border-green-500/30" },
    Attention: {
      badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    Critical: { badge: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const config = statusConfig[client.status] || statusConfig["Stable"];
  const tabs = ["Overview", "Visit Logs", "Reports"];

  return (
    <>
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <button
            onClick={() => router.push("/carer/myclients")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to My Clients</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Left Sidebar ── */}
            <div className="lg:w-80 space-y-5">
              {/* Profile card */}
              <div className="bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-cyan-500/30 mx-auto mb-4">
                  {client.full_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {client.full_name || "N/A"}
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>Room {client.room || "N/A"}</span>
                  {client.wing && (
                    <>
                      <span>·</span>
                      <span>{client.wing}</span>
                    </>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.badge}`}
                >
                  {client.status || "Unknown"}
                </span>
              </div>

              {/* Demographics card */}
              <div className="bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
                  Demographics
                </h3>
                <DemoRow
                  label="Age / Sex"
                  value={`${calculateAge(client.dob)}y${client.gender ? ` / ${client.gender}` : ""}`}
                />
                <DemoRow
                  label="Admission"
                  value={
                    client.created_at
                      ? new Date(client.created_at).toLocaleDateString(
                          "en-GB",
                          { year: "numeric", month: "2-digit", day: "2-digit" },
                        )
                      : "N/A"
                  }
                />
                <DemoRow
                  label="Primary Language"
                  value={client.language || "Not recorded"}
                />
                <DemoRow
                  label="Blood Type"
                  value={client.blood || "Not recorded"}
                  red
                  last
                />
              </div>

              {/* Emergency contacts */}
              <div className="bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Emergency Contacts
                </h3>
                {familyMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No contacts on record
                  </p>
                ) : (
                  <div className="space-y-4">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold">
                            {member.full_name?.charAt(0) || "F"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {member.full_name}
                            </p>
                            {member.relationship && (
                              <p className="text-xs text-muted-foreground">
                                {member.relationship}
                              </p>
                            )}
                          </div>
                        </div>
                        {member.phone && (
                          <a
                            href={`tel:${member.phone}`}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan-400 transition-colors pl-9"
                          >
                            <Phone size={11} />
                            {member.phone}
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan-400 transition-colors pl-9"
                          >
                            <Mail size={11} />
                            {member.email}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1">
              <div className="bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                {/* Tab nav */}
                <div className="flex border-b border-white/10 px-6 overflow-x-auto">
                  {tabs.map((tab) => {
                    const key = tab.toLowerCase().replace(" ", "-");
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === key
                            ? "border-cyan-500 text-cyan-500"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="p-8">
                  {activeTab === "overview" && <OverviewTab client={client} />}
                  {activeTab === "visit-logs" && (
                    <VisitLogsTab
                      visitLogs={visitLogs}
                      onAddLog={() => setShowAddLog(true)}
                    />
                  )}
                  {activeTab === "reports" && (
                    <ReportsTab
                      reports={reports}
                      onViewReport={(r) => setShowViewReport(r)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAddLog && (
        <AddVisitLogModal
          clientId={clientId}
          carerId={demoUser?.id}
          onClose={() => setShowAddLog(false)}
          onSuccess={() => {
            setShowAddLog(false);
            fetchAll();
          }}
        />
      )}
      {showViewReport && (
        <ViewReportModal
          report={showViewReport}
          onClose={() => setShowViewReport(null)}
        />
      )}
    </>
  );
}

/* ─── Overview Tab — matches manager view exactly ───────────────── */
function OverviewTab({ client }) {
  const hasVitals = client.pulse || client.bp;

  return (
    <div className="space-y-8">
      {/* Status banner + Critical Note */}
      <div className="space-y-3">
        <div
          className={`w-full py-3 px-5 rounded-xl text-center text-xs font-bold uppercase tracking-widest border ${
            client.status === "Stable"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : client.status === "Attention"
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {client.status || "Unknown"} Status
        </div>

        {client.key_health_indicator && (
          <div className="w-full py-3.5 px-5 rounded-xl border bg-red-500/5 border-red-500/20">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">
              Critical Note
            </p>
            <p className="text-sm font-bold text-red-300">
              {client.key_health_indicator}
            </p>
          </div>
        )}
      </div>

      {/* Executive Clinical Summary */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-blue-400" />
          </div>
          <h4 className="font-bold text-foreground text-base">
            Executive Clinical Summary
          </h4>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-5">
          {client.health_summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{client.health_summary}"
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No health summary on record.
            </p>
          )}
        </div>
      </section>

      {/* Current Vitals */}
      {hasVitals && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Current Vitals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {client.pulse && (
              <VitalCard
                label="Pulse"
                value={String(client.pulse)}
                unit="bpm"
                color="cyan"
              />
            )}
            {client.bp && (
              <VitalCard
                label="Blood Pressure"
                value={String(client.bp)}
                unit="mmHg"
                color="blue"
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function VitalCard({ label, value, unit, color }) {
  const colors = {
    cyan: "from-cyan-400/10 to-cyan-500/5 border-cyan-500/20",
    blue: "from-blue-400/10 to-blue-500/5 border-blue-500/20",
    green: "from-green-400/10 to-green-500/5 border-green-500/20",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}

/* ─── Demographics Row ───────────────────────────────────────────── */
function DemoRow({ label, value, red, last }) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${!last ? "border-b border-white/5" : ""}`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${red ? "text-red-400" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${red ? "text-red-400" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Visit Logs Tab ─────────────────────────────────────────────── */
function VisitLogsTab({ visitLogs, onAddLog }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getMoodConfig = (mood) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return {
          emoji: "😊",
          label: "Happy",
          color: "bg-green-500/15 text-green-400 border-green-500/25",
        };
      case "calm":
        return {
          emoji: "😌",
          label: "Calm",
          color: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        };
      case "anxious":
        return {
          emoji: "😰",
          label: "Anxious",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        };
      case "irritable":
        return {
          emoji: "😤",
          label: "Irritable",
          color: "bg-red-500/15 text-red-400 border-red-500/25",
        };
      default:
        return null;
    }
  };

  const getAppetiteConfig = (appetite) => {
    switch (appetite?.toLowerCase()) {
      case "great":
        return {
          label: "Great",
          dot: "bg-green-400",
          color: "bg-green-500/15 text-green-400 border-green-500/25",
        };
      case "normal":
        return {
          label: "Normal",
          dot: "bg-amber-400",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        };
      case "poor":
        return {
          label: "Poor",
          dot: "bg-red-400",
          color: "bg-red-500/15 text-red-400 border-red-500/25",
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground">Visit History</h4>
        <span className="text-sm text-muted-foreground">
          {visitLogs.length} total
        </span>
      </div>

      {visitLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList size={48} className="mb-4 opacity-20" />
          <p className="font-medium">No visit logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitLogs.map((log) => {
            const moodConfig = getMoodConfig(log.mood);
            const appetiteConfig = getAppetiteConfig(log.appetite);
            const tasks = (() => {
              try {
                return log.required_tasks ? JSON.parse(log.required_tasks) : [];
              } catch {
                return [];
              }
            })();

            return (
              <div
                key={log.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-violet-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                    <ClipboardList size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">
                        Visit Log
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={11} />
                        {fmt(log.created_at)}
                        <Clock size={11} />
                        {fmtTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {(moodConfig || appetiteConfig) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {moodConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${moodConfig.color}`}
                      >
                        {moodConfig.emoji} {moodConfig.label}
                      </span>
                    )}
                    {appetiteConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${appetiteConfig.color}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${appetiteConfig.dot}`}
                        />
                        Appetite: {appetiteConfig.label}
                      </span>
                    )}
                  </div>
                )}

                {log.notes && (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Observations
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {log.notes}
                    </p>
                  </div>
                )}

                {tasks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Required Tasks
                    </p>
                    <div className="space-y-1.5">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                            <svg
                              width="8"
                              height="7"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="#4ade80"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Reports Tab ────────────────────────────────────────────────── */
function ReportsTab({ reports, onViewReport }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground">Reports</h4>
        <span className="text-sm text-muted-foreground">
          {reports.length} total
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText size={48} className="mb-4 opacity-20" />
          <p className="font-medium">No reports yet</p>
          <p className="text-sm mt-1">
            Reports created by managers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onViewReport(report)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {report.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {report.content || "No content"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {report.created_by_profile && (
                        <span className="flex items-center gap-1">
                          <User size={10} className="text-cyan-500" />
                          {report.created_by_profile.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={10} className="text-cyan-500" />
                        {fmt(report.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-cyan-500 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add Visit Log Modal ────────────────────────────────────────── */
function AddVisitLogModal({ clientId, carerId, onClose, onSuccess }) {
  const supabase = createClient();
  const [notes, setNotes] = useState("");
  const [appetite, setAppetite] = useState("normal");
  const [mood, setMood] = useState("happy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please enter visit notes");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from("visit_logs").insert({
        patient_id: clientId,
        carer_id: carerId,
        notes: notes.trim(),
        appetite,
        mood,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to save visit log");
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500 transition-colors text-sm appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-lg w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Add Visit Log
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Record notes from this visit
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={22} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Observations <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How is the client today? Any mood changes or physical concerns?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors resize-none text-sm"
              required
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {notes.length} characters
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Appetite
              </label>
              <div className="relative">
                <select
                  value={appetite}
                  onChange={(e) => setAppetite(e.target.value)}
                  className={selectClass}
                >
                  <option value="normal">Normal</option>
                  <option value="poor">Poor</option>
                  <option value="great">Great</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div
                    className={`w-2 h-2 rounded-full ${appetite === "great" ? "bg-green-400" : appetite === "poor" ? "bg-red-400" : "bg-amber-400"}`}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Mood
              </label>
              <div className="relative">
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className={selectClass}
                >
                  <option value="happy">Happy</option>
                  <option value="calm">Calm</option>
                  <option value="anxious">Anxious</option>
                  <option value="irritable">Irritable</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                  {mood === "happy"
                    ? "😊"
                    : mood === "calm"
                      ? "😌"
                      : mood === "anxious"
                        ? "😰"
                        : "😤"}
                </div>
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl hover:bg-white/10 transition-all font-semibold active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !notes.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── View Report Modal ──────────────────────────────────────────── */
function ViewReportModal({ report, onClose }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {report.title}
            </h2>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
              {report.created_by_profile && (
                <span className="flex items-center gap-1">
                  <User size={11} className="text-cyan-500" />
                  {report.created_by_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-cyan-500" />
                {fmt(report.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={22} className="text-muted-foreground" />
          </button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {report.content || "No content available."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
