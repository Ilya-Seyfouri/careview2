"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  X,
  MapPin,
  CalendarDays,
  UserCheck,
  Activity,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";

export default function MyLovedOnes() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [client, setClient] = useState(null);
  const [visitLogs, setVisitLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [assignedCarers, setAssignedCarers] = useState([]);
  const [carerNames, setCarerNames] = useState({});
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showViewReport, setShowViewReport] = useState(null);

  useEffect(() => {
    if (demoUser?.id) fetchAll(demoUser.id);
  }, [demoUser]);

  const fetchAll = async (familyId) => {
    try {
      setLoading(true);

      // Get linked patient via patient_family
      const { data: linkData, error: linkError } = await supabase
        .from("patient_family")
        .select("patient_id, relationship")
        .eq("family_id", familyId);

      if (linkError || !linkData || linkData.length === 0) {
        setLoading(false);
        return;
      }

      // Get the first patient if there are multiple
      const firstLink = linkData[0];
      setRelationship(firstLink.relationship);
      const patientId = firstLink.patient_id;

      // Fetch patient
      const { data: clientData, error: clientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (clientError) {
        setError("Resident not found");
        return;
      }
      setClient(clientData);

      // Fetch visit logs
      const { data: logsData } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      const logs = logsData || [];
      setVisitLogs(logs);

      // Resolve carer names for visit logs
      const carerIds = [
        ...new Set(logs.map((l) => l.carer_id).filter(Boolean)),
      ];
      if (carerIds.length > 0) {
        const { data: carersData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", carerIds);
        const map = {};
        (carersData || []).forEach((c) => (map[c.id] = c.full_name));
        setCarerNames(map);
      }

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select(
          "id, title, content, type, created_at, created_by_profile:created_by (id, full_name, role)",
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      setReports(reportsData || []);

      // Fetch assigned carers via patient_carers
      const { data: carerLinks } = await supabase
        .from("patient_carers")
        .select(
          `id, assigned_at, carer_id, profiles:carer_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", patientId);

      const carers = (carerLinks || []).map((link) => ({
        ...link.profiles,
        assigned_at: link.assigned_at,
      }));
      setAssignedCarers(carers);
    } catch (err) {
      console.error(err);
      setError("Failed to load resident details");
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

  const isLoading = userLoading || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            Loading...
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
            {error || "Resident not found"}
          </h1>
          <button
            onClick={() => router.push("/family")}
            className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to Dashboard
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
  const statusCfg =
    statusConfig[client.status?.toLowerCase()] || statusConfig.stable;
  const tabs = ["Overview", "Visit Logs", "Reports", "Schedules"];

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
          {/* Back */}
          <button
            onClick={() => router.push("/family")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            <span>Back to Dashboard</span>
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
                      className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${statusCfg.dot}`}
                    ></div>
                  </div>

                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {client.full_name}
                  </h2>
                  {relationship && (
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3 px-4 py-1.5 bg-blue-50 rounded-full inline-block">
                      Your {relationship}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600 mb-4 mt-3 mx-auto w-fit">
                    <MapPin size={14} className="text-blue-500" />
                    Room {client.room || "N/A"}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${statusCfg.badge}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                    {client.status || "Unknown"}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Quick Info
                </h3>
                <div className="space-y-4">
                  <StatRow label="Age" value={calculateAge(client.dob)} />
                  <StatRow
                    label="Date of Birth"
                    value={
                      client.dob
                        ? new Date(client.dob).toLocaleDateString("en-GB")
                        : "N/A"
                    }
                  />
                  <StatRow label="Wing" value={client.wing || "N/A"} />
                  <StatRow label="Blood Type" value={client.blood || "N/A"} />
                </div>
              </div>

              {/* Care Team */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Care Team
                </h3>
                {assignedCarers.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium text-center py-4">
                    No assigned carers
                  </p>
                ) : (
                  <div className="space-y-5">
                    {assignedCarers.map((carer) => (
                      <div
                        key={carer.id}
                        className="p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-black shadow-sm">
                            {carer.full_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 tracking-tight">
                              {carer.full_name}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              Carer
                            </p>
                          </div>
                        </div>
                        <div className="">
                          {carer.phone && (
                            <a
                              href={`tel:${carer.phone}`}
                              className="flex pt-2 items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors font-medium"
                            >
                              <Phone size={12} /> {carer.phone}
                            </a>
                          )}
                          {carer.email && (
                            <a
                              href={`mailto:${carer.email}`}
                              className="flex pt-2 items-center gap-2 text-xs text-slate-600 hover:text-blue-600 transition-colors font-medium"
                            >
                              <Mail size={12} /> {carer.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                        className={`px-6 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${
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
                  {activeTab === "overview" && (
                    <OverviewTab
                      client={client}
                      assignedCarers={assignedCarers}
                      calculateAge={calculateAge}
                    />
                  )}
                  {activeTab === "visit-logs" && (
                    <VisitLogsTab
                      visitLogs={visitLogs}
                      carerNames={carerNames}
                    />
                  )}
                  {activeTab === "reports" && (
                    <ReportsTab
                      reports={reports}
                      onViewReport={(r) => setShowViewReport(r)}
                    />
                  )}
                  {activeTab === "schedules" && (
                    <SchedulesTab patientId={client.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

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
function OverviewTab({ client, assignedCarers, calculateAge }) {
  const hasVitals = client.pulse || client.bp;

  return (
    <div className="space-y-10">
<motion.section
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className=""
>        <h4 className="font-black text-xl mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>
          Personal Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Full Name" value={client.full_name} />
          <InfoField label="Room Number" value={client.room} />
          <InfoField label="Age" value={calculateAge(client.dob)} />
          <InfoField
            label="Date of Birth"
            value={
              client.dob
                ? new Date(client.dob).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"
            }
          />
          <InfoField label="Wing" value={client.wing} />
          <InfoField label="Language" value={client.language} />
        </div>
      </motion.section>

      {client.health_summary && (
<motion.section
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className=""
>          <h4 className="font-black text-xl mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <History size={20} />
            </div>
            Health Summary
          </h4>
          <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 border-dashed">
            <p className="text-base text-slate-700 leading-relaxed font-medium">
              {client.health_summary}
            </p>
          </div>
        </motion.section>
      )}

      {/* Current Vitals */}
      {hasVitals && (
<motion.section
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className=""
>          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">
            Current Vitals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {client.pulse && (
              <VitalCard
                label="Pulse"
                value={String(client.pulse)}
                unit="bpm"
                color="blue"
              />
            )}
            {client.bp && (
              <VitalCard
                label="Blood Pressure"
                value={String(client.bp)}
                unit="mmHg"
                color="rose"
              />
            )}
          </div>
        </motion.section>
      )}
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
      className={`${cfg.bg} rounded-[24px] p-4 ring-1 ${cfg.ring} shadow-sm`}
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

/* ─── Visit Logs Tab ─────────────────────────────────────────────── */
function VisitLogsTab({ visitLogs, carerNames }) {
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
>      <div className="flex items-center justify-between">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          Visit History
        </h4>
        <span className="text-sm text-slate-500 font-bold">
          {visitLogs.length} total
        </span>
      </div>

      {visitLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <ClipboardList size={80} className="mb-6 opacity-10" />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            No visit logs yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visitLogs.map((log) => {
            const moodConfig = getMoodConfig(log.mood);
            const appetiteConfig = getAppetiteConfig(log.appetite);
            const carerName = carerNames[log.carer_id];
            const initials = carerName
              ? carerName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "CT";

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
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <p className="font-black text-base text-slate-900 tracking-tight">
                        {carerName || "Care Team"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} /> {fmt(log.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} /> {fmtTime(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mood + Appetite */}
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

                {/* Notes */}
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

                {/* Tasks */}
                {tasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Tasks Completed
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
    });

  const typeConfig = {
    falls: {
      color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      dot: "bg-rose-500",
    },
    medication: {
      color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
      dot: "bg-slate-400",
    },
  };

  return (
<motion.section
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className="space-y-6"
>      <div className="flex items-center justify-between">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          Reports
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
            Reports from the care team will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const typeCfg = typeConfig[report.type] || typeConfig.other;
            return (
              <button
                key={report.id}
                onClick={() => onViewReport(report)}
                className="w-full bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      <FileText size={22} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-black text-lg text-slate-900 truncate tracking-tight">
                          {report.title}
                        </p>
                       
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 font-medium">
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
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
const scheduleContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const scheduleItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 22,
      stiffness: 280,
    },
  },
};

function SchedulesTab({ patientId }) {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("schedules")
          .select(
            `id, start_at, end_at, status, created_at, title, carer:carer_id (id, full_name, email, phone), created_by_profile:created_by (id, full_name)`,
          )
          .eq("patient_id", patientId)
          .order("start_at", { ascending: false });
        if (err) throw err;
        setSchedules(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [patientId]);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

  const statusConfig = {
    completed: {
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    },
    pending: {
      label: "Pending",
      color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    },
    "in progress": {
      label: "In Progress",
      color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">
          Loading schedules...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
        <p className="text-sm text-rose-700 font-bold">{error}</p>
      </div>
    );

  if (schedules.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarDays size={64} className="text-slate-200 mb-4" />
        <p className="font-black text-lg text-slate-900 tracking-tight mb-1">
          No schedules found
        </p>
        <p className="text-sm text-slate-400 font-medium">
          Schedules will appear here once created
        </p>
      </div>
    );

  return (
    <motion.div
      variants={scheduleContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {schedules.map((s) => {
        const upcoming = new Date(s.start_at) > new Date();
        const cfg =
          statusConfig[s.status?.toLowerCase()] || statusConfig.pending;

        return (
          <motion.div
            key={s.id}
            variants={scheduleItemVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`bg-slate-100 border rounded-[24px] p-6 hover:shadow-lg transition-shadow duration-300 ${
              upcoming
                ? "border-blue-300 ring-2 ring-blue-50"
                : "border-slate-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                  upcoming
                    ? "bg-gradient-to-br from-blue-500 to-blue-600"
                    : "bg-gradient-to-br from-slate-400 to-slate-500"
                }`}
              >
                <CalendarDays size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg text-slate-900 tracking-tight truncate">
                  {s.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  {upcoming && (
                    <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-blue-200 text-blue-700 ring-1 ring-blue-100 uppercase tracking-widest">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" />
                  Start Time
                </p>
                <p className="text-sm font-black text-slate-900">
                  {fmt(s.start_at)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" />
                  End Time
                </p>
                <p className="text-sm font-black text-slate-900">
                  {fmt(s.end_at)}
                </p>
              </div>
            </div>

            {/* Carer */}
            {(s.carer || s.created_by_profile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-slate-200">
                {s.carer && (
                  <div className="px-4">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-blue-500" />
                      Assigned Carer
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {s.carer.full_name?.charAt(0) ?? "?"}
                      </div>
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        {s.carer.full_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
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

  const typeConfig = {
    falls: {
      color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      dot: "bg-rose-500",
    },
    medication: {
      color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
      dot: "bg-slate-400",
    },
  };
  const typeCfg = typeConfig[report.type] || typeConfig.other;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {report.title}
              </h2>
              {report.type && (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${typeCfg.color}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${typeCfg.dot}`} />
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
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
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-8">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium text-base">
            {report.content || "No content available."}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <span className="font-black text-sm text-slate-900">{value}</span>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:bg-white transition-colors">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="font-black text-slate-900 tracking-tight">
        {value || "Not provided"}
      </p>
    </div>
  );
}
