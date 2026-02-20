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
  Activity,
  MapPin,
  X,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { useDemoUser } from "./DemoContext";

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            Loading client...
          </p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-rose-400 mx-auto mb-6 opacity-20" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {error || "Client not found"}
          </h1>
          <button
            onClick={() => router.push("/carer/myclients")}
            className="mt-6 px-8 py-4 cursor-pointer bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to My Clients
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    stable: {
      badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      dot: "bg-emerald-500",
    },
    attention: {
      badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    critical: {
      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      dot: "bg-rose-500 animate-pulse",
    },
  };
  const config = statusConfig[client.status] || statusConfig["Stable"];
  const tabs = ["Overview", "Visit Logs", "Reports"];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-slate-50"
      >
        {" "}
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <button
            onClick={() => router.push("/carer/myclients")}
            className="flex items-center cursor-pointer gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            <span>Back to My Clients</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* ── Left Sidebar ── */}
            <div className="lg:w-80 space-y-8">
              {/* Profile card */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden p-10 text-center relative">
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-900 to-slate-800 -z-0"></div>

                <div className="relative z-10 pt-4">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 rounded-[28px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl ring-[12px] ring-white mx-auto">
                      {client.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div
                      className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${config.dot}`}
                    ></div>
                  </div>

                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                    {client.full_name || "N/A"}
                  </h2>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600">
                      <MapPin size={14} className="text-blue-500" /> Room{" "}
                      {client.room || "N/A"}
                    </div>
                    {client.wing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600">
                        {client.wing}
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${config.badge}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${config.dot}`}
                    ></span>
                    {client.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Demographics card */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Key Demographics
                </h3>
                <div className="space-y-4">
                  <DemoRow
                    label="Age "
                    value={`${calculateAge(client.dob)}${client.gender ? ` / ${client.gender}` : ""}`}
                    icon={User}
                  />
                  <DemoRow
                    label="Admission"
                    value={
                      client.created_at
                        ? new Date(client.created_at).toLocaleDateString(
                            "en-GB",
                            { year: "numeric", month: "short", day: "numeric" },
                          )
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                  <DemoRow
                    label="Primary Language"
                    value={client.language || "English"}
                    icon={Activity}
                  />
                  <DemoRow
                    label="Blood Type"
                    value={client.blood || "Not recorded"}
                    icon={Heart}
                    color="text-rose-500"
                    last
                  />
                </div>
              </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1">
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden min-h-[600px] flex flex-col">
                {/* Tab nav */}
                <div className="flex border-b border-slate-50 px-8 bg-slate-50/20 pt-4">
                  {tabs.map((tab) => {
                    const key = tab.toLowerCase().replace(" ", "-");
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(key)}
                        className={`px-6 py-5  cursor-pointer text-xs font-black uppercase tracking-widest transition-all relative ${
                          activeTab === key
                            ? "text-blue-600"
                            : "text-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {tab}
                        {activeTab === key && (
                          <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-10 flex-1">
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
      </motion.section>

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
/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab({ client }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchFamily = async () => {
      const { data: familyLinks } = await supabase
        .from("patient_family")
        .select(
          `relationship, profiles:family_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", client.id);

      const family = (familyLinks || []).map((f) => ({
        ...f.profiles,
        relationship: f.relationship,
      }));
      setFamilyMembers(family);
    };

    if (client?.id) fetchFamily();
  }, [client?.id]);

  return (
    <div className="space-y-10">
      {/* Executive Clinical Summary */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className=""
      >
        {" "}
        <h4 className="font-semibold text-xl mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText size={20} />
          </div>
          Clinical Summary
        </h4>
        <div className="p-4 bg-slate-50/50 rounded-3xl border-2 border-slate-100 border-dashed">
          {client.health_summary ? (
            <p className="text-md text-slate-600 leading-relaxed italic font-medium">
              "{client.health_summary}"
            </p>
          ) : (
            <p className="text-lg text-slate-400 italic font-medium">
              No health summary on record.
            </p>
          )}
        </div>
      </motion.section>

      {/* Emergency Contacts */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className=""
      >
        {" "}
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">
          Emergency Contacts
        </h4>
        {familyMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <User size={60} className="mb-4 opacity-10" />
            <p className="font-black text-lg text-slate-900 tracking-tight">
              No contacts on record
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-lg transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-lg font-black shadow-sm">
                    {member.full_name?.charAt(0) || "F"}
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 tracking-tight">
                      {member.full_name}
                    </p>
                    {member.relationship && (
                      <p className="text-xs text-slate-500 font-medium">
                        {member.relationship}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3 text-sm pt-3 border-t border-slate-100">
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                    >
                      <Phone size={14} className="text-blue-500" />
                      {member.phone}
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                    >
                      <Mail size={14} className="text-blue-500" />
                      {member.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}

function VitalCard({ label, value, unit, color }) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      ring: "ring-blue-100",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      ring: "ring-rose-100",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
  };
  const cfg = colors[color] || colors.blue;

  return (
    <div
      className={`${cfg.bg} rounded-[24px] p-6 ring-1 ${cfg.ring} shadow-sm`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
        {label}
      </p>
      <p className={`text-3xl font-black ${cfg.text} tracking-tight`}>
        {value}
        <span className="text-sm font-bold text-slate-400 ml-2">{unit}</span>
      </p>
    </div>
  );
}

/* ─── Demographics Row ───────────────────────────────────────────── */
function DemoRow({ label, value, icon: Icon, color, last }) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors ${!last ? "" : ""}`}
    >
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Icon size={12} className={color || "text-slate-400"} />
        {label}
      </span>
      <span className={`font-black text-sm ${color || "text-slate-900"}`}>
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
          color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        };
      case "calm":
        return {
          emoji: "😌",
          label: "Calm",
          color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
        };
      case "anxious":
        return {
          emoji: "😰",
          label: "Anxious",
          color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        };
      case "irritable":
        return {
          emoji: "😤",
          label: "Irritable",
          color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
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
          dot: "bg-emerald-500",
          color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        };
      case "normal":
        return {
          label: "Normal",
          dot: "bg-amber-500",
          color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        };
      case "poor":
        return {
          label: "Poor",
          dot: "bg-rose-500",
          color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
        };
      default:
        return null;
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {" "}
      <div className="flex items-center justify-between">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          History
        </h4>
        <div className="flex items-center gap-4 mr-4">
          <span className="text-sm text-slate-500 font-bold">
            {visitLogs.length} total
          </span>
        </div>
      </div>
      {visitLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <ClipboardList size={80} className="mb-6 opacity-10" />
          <p className="font-black text-xl text-slate-900 tracking-tight mb-2">
            No visit logs yet
          </p>
          <button
            onClick={onAddLog}
            className="mt-4 px-6 py-3 bg-blue-50 text-blue-700 ring-1 ring-blue-100 rounded-xl hover:bg-blue-100 transition-colors font-black text-xs uppercase tracking-widest"
          >
            Add First Log
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
                className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <ClipboardList size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-black text-base text-slate-900 tracking-tight">
                        Visit Log
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {fmt(log.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {fmtTime(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(moodConfig || appetiteConfig) && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {moodConfig && (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${moodConfig.color}`}
                      >
                        {moodConfig.emoji} {moodConfig.label}
                      </span>
                    )}
                    {appetiteConfig && (
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${appetiteConfig.color}`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${appetiteConfig.dot}`}
                        />
                        Appetite: {appetiteConfig.label}
                      </span>
                    )}
                  </div>
                )}

                {log.notes && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Observations
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {log.notes}
                    </p>
                  </div>
                )}

                {tasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Required Tasks
                    </p>
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                        >
                          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-slate-900 font-medium">
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
    </motion.section>
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
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {" "}
      <div className="flex items-center justify-between">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          History
        </h4>
        <span className="text-sm text-slate-500 font-bold">
          {reports.length} total
        </span>
      </div>
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <FileText size={80} className="mb-6 opacity-10" />
          <p className="font-black text-xl text-slate-900 tracking-tight mb-2">
            No reports yet
          </p>
          <p className="text-sm text-slate-500 font-medium">
            Reports created by managers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onViewReport(report)}
              className="w-full bg-white border cursor-pointer border-slate-100 rounded-[24px] p-6 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={22} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-lg text-slate-900 truncate tracking-tight">
                      {report.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2 font-medium">
                      {report.content || "No content"}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                      {report.created_by_profile && (
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="text-blue-500" />
                          {report.created_by_profile.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-blue-500" />
                        {fmt(report.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={24}
                  className="text-blue-500 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1"
                  strokeWidth={2.5}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.section>
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-10 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Add Visit Log
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Record notes from this visit
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">
              Observations <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How is the client today? Any mood changes or physical concerns?"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              required
            />
            <p className="text-xs text-slate-400 mt-2 text-right font-bold">
              {notes.length} characters
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">
                Appetite
              </label>
              <div className="relative">
                <select
                  value={appetite}
                  onChange={(e) => setAppetite(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="normal">Normal</option>
                  <option value="poor">Poor</option>
                  <option value="great">Great</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div
                    className={`w-3 h-3 rounded-full ${appetite === "great" ? "bg-emerald-500" : appetite === "poor" ? "bg-rose-500" : "bg-amber-500"}`}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-widest">
                Mood
              </label>
              <div className="relative">
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="happy">Happy</option>
                  <option value="calm">Calm</option>
                  <option value="anxious">Anxious</option>
                  <option value="irritable">Irritable</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg">
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
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-sm text-rose-700 font-bold">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !notes.trim()}
              className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {report.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
              {report.created_by_profile && (
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-blue-500" />
                  {report.created_by_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-blue-500" />
                {fmt(report.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10  hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
          >
            <X size={20} className="text-slate-500 cursor-pointer" />
          </button>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-8">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-base">
            {report.content || "No content available."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-8 cursor-pointer px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
