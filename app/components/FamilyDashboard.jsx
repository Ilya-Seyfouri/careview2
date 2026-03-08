"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  Clock,
  Heart,
  MapPin,
  ChevronRight,
  Utensils,
  User,
  AlertCircle,
  X,
  CalendarDays,
  UserCheck,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  History,
  FileText,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";
import { motion } from "framer-motion";

export default function FamilyDashboard() {
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [patient, setPatient] = useState(null);
  const [relationship, setRelationship] = useState(null);
  const [visitLogs, setVisitLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [carerNames, setCarerNames] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveData, setArchiveData] = useState({ logs: [], reports: [] });
  const [archiveLoading, setArchiveLoading] = useState(false);

  useEffect(() => {
    if (demoUser?.id) fetchData(demoUser.id);
  }, [demoUser]);

  const fetchData = async (familyId) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/family/dashboard/${familyId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const {
        relationship,
        patient,
        visitLogs,
        carerNames,
        reports,
        upcomingSchedules,
      } = await res.json();

      setRelationship(relationship);
      setPatient(patient);
      setVisitLogs(visitLogs);
      setCarerNames(carerNames);
      setReports(reports);
      setUpcomingSchedules(upcomingSchedules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchiveData = async () => {
    if (!patient?.id) return;
    try {
      setArchiveLoading(true);

      const res = await fetch(`/api/family/dashboard/${demoUser.id}/archive`);
      if (!res.ok) throw new Error("Failed to fetch archive");

      const { logs, reports, carerNames: newCarerNames } = await res.json();

      setCarerNames((prev) => ({ ...prev, ...newCarerNames }));
      setArchiveData({ logs, reports });
    } catch (err) {
      console.error("Error fetching archive:", err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleOpenArchive = () => {
    setShowArchive(true);
    fetchArchiveData();
  };

  // Merge visit logs + reports into one feed sorted by date - only show 3 most recent
  const feedItems = [
    ...visitLogs.map((l) => ({ ...l, _kind: "log" })),
    ...reports.map((r) => ({ ...r, _kind: "report" })),
  ]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatLogDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString())
      return new Date(d).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getMoodEmoji = (mood) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return { emoji: "😊", label: "Happy", color: "text-green-600" };
      case "calm":
        return { emoji: "😌", label: "Calm", color: "text-blue-600" };
      case "anxious":
        return { emoji: "😰", label: "Anxious", color: "text-amber-600" };
      case "irritable":
        return { emoji: "😤", label: "Irritable", color: "text-red-600" };
      default:
        return null;
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "stable":
        return {
          color: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
          dot: "bg-emerald-500",
        };
      case "attention":
        return {
          color: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
          dot: "bg-amber-500",
        };
      case "critical":
        return {
          color: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
          dot: "bg-rose-500",
        };
      default:
        return {
          color: "bg-slate-50 text-slate-600 ring-1 ring-slate-100",
          dot: "bg-slate-400",
        };
    }
  };

  const reportTypeConfig = {
    falls: {
      color: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
      dot: "bg-rose-500",
    },
    medication: {
      color: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-slate-50 text-slate-600 ring-1 ring-slate-100",
      dot: "bg-slate-400",
    },
  };

  const isLoading = userLoading || loading;
  const statusCfg = patient ? getStatusConfig(patient.status) : null;

  // Get primary carer from most recent visit log
  const primaryCarerId = visitLogs[0]?.carer_id;
  const primaryCarerName = primaryCarerId ? carerNames[primaryCarerId] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-bold">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-900 font-black tracking-tight">
            No linked resident found
          </p>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Contact the care home to be linked to a resident.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-slate-50"
      >
        {" "}
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10 max-w-5xl">
          {/* ── Welcome Banner ── */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-10 rounded-[40px] border border-slate-100 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group mb-10">
            {/* SaaS Glow Accent */}
            <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ring-1 ring-blue-100">
                <Sparkles size={12} className="animate-pulse" />
                Live Care Feed
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                Welcome, {demoUser?.full_name?.split(" ")[0] || "there"}.
              </h2>
              <p className="text-slate-500 font-bold text-lg">
                Here's the latest update for{" "}
                <span className="text-slate-900">{patient.full_name}</span>.
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                {patient.full_name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => router.push("/family/mylovedones")}
                className="text-[10px] font-black cursor-pointer text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </header>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* ── Recent Updates feed ── */}
            <div className="md:col-span-2 space-y-8">
              <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden relative group">
                {/* Subtle Background Accent */}
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>

                <div className="flex justify-between items-center mb-10 relative z-10">
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <Activity size={20} />
                    </div>
                    Recent News
                  </h3>
                  <button
                    onClick={handleOpenArchive}
                    className="text-[10px] font-black text-blue-600  cursor-pointer uppercase tracking-widest hover:underline"
                  >
                    Full Archive
                  </button>
                </div>

                {feedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 relative z-10">
                    <Activity size={40} className="mb-3 opacity-20" />
                    <p className="text-sm font-bold text-slate-400">
                      No updates yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 relative z-10">
                    {feedItems.map((item, index) => {
                      /* ── Visit Log entry ── */
                      if (item._kind === "log") {
                        const moodCfg = getMoodEmoji(item.mood);
                        const carerName = carerNames[item.carer_id];
                        const initials = carerName
                          ? carerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "CT";

                        return (
                          <div
                            key={`log-${item.id}`}
                            onClick={() => setSelectedLog(item)}
                            className="flex gap-6 relative group/item cursor-pointer hover:translate-x-1 transition-transform"
                          >
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-16 h-16 rounded-[24px] border-4 border-white bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-sm font-bold shadow-md group-hover/item:scale-105 transition-transform">
                                {initials}
                              </div>
                              {index === 0 && (
                                <div className="w-1 h-full bg-slate-100 my-2 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex-1 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <p className="font-black text-lg text-slate-900 tracking-tight">
                                    {carerName || "Care Team"}
                                  </p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    Assigned Senior Carer
                                  </p>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100">
                                  {formatLogDate(item.created_at)}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-slate-600 font-medium leading-relaxed mb-6 italic">
                                  "{item.notes}"
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Client Mood:
                                </span>
                                {moodCfg && (
                                  <span className="text-[10px] px-3 py-1 bg-white border border-slate-200 text-slate-900 rounded-full font-black uppercase tracking-widest shadow-sm">
                                    {moodCfg.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      /* ── Report entry ── */
                      const typeCfg =
                        reportTypeConfig[item.type] || reportTypeConfig.other;
                      const authorName = item.created_by_profile?.full_name;
                      const initials = authorName
                        ? authorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "MG";

                      return (
                        <div
                          key={`report-${item.id}`}
                          onClick={() => setSelectedReport(item)}
                          className="flex gap-6 relative group/item cursor-pointer hover:translate-x-1 transition-transform"
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-16 h-16 rounded-[24px] border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md group-hover/item:scale-105 transition-transform">
                              {initials}
                            </div>
                            {index === 0 && (
                              <div className="w-1 h-full bg-slate-100 my-2 rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-black text-lg text-slate-900 tracking-tight">
                                  {authorName || "Care Team"}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                  {item.type
                                    ? `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Report`
                                    : "Report"}
                                </p>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100">
                                {formatLogDate(item.created_at)}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 mb-2">
                              {item.title}
                            </p>
                            {item.content && (
                              <p className="text-slate-600 font-medium leading-relaxed line-clamp-2">
                                {item.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-8">
              {/* Upcoming Visits */}
              <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Schedules
                  </h3>
                </div>

                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar
                      size={28}
                      className="text-slate-200 mx-auto mb-2"
                    />
                    <p className="text-sm text-slate-400 font-medium">
                      No upcoming visits
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => setSelectedSchedule(schedule)}
                        className="p-5 border-2 border-slate-50 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-100 transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                          {formatDate(schedule.start_at)},{" "}
                          {formatTime(schedule.start_at)}
                        </p>
                        <p className="font-black text-slate-900 text-base tracking-tight">
                          {schedule.title || "Care Visit"}
                        </p>
                        {schedule.end_at && (
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            Until {formatTime(schedule.end_at)}
                          </p>
                        )}
                      </div>
                    ))}

                    <button
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group/btn"
                      onClick={() => router.push("/family/messages")}
                    >
                      Request New Visit
                      <ArrowUpRight
                        size={14}
                        strokeWidth={3}
                        className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                      />
                    </button>
                  </div>
                )}
              </section>

              {/* Send a Message */}
              <section className="bg-slate-900 rounded-[32px] p-8 text-white overflow-hidden relative shadow-2xl shadow-slate-200 group">
                {/* Subtle Neon Glow */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6">
                    <MessageSquare size={24} strokeWidth={3} />
                  </div>
                  <h3 className="font-black text-2xl tracking-tight mb-3">
                    Worried?
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mb-8 leading-relaxed">
                    {primaryCarerName
                      ? `Send a message to ${primaryCarerName}, the carer looking after ${patient.full_name?.split(" ")[0]}.`
                      : `Leave a secure message for the care team or send a digital memory to ${patient.full_name?.split(" ")[0]}.`}
                  </p>
                  <button
                    onClick={() => router.push("/family/messages")}
                    className="w-full py-4 bg-white text-slate-900 cursor-pointer rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-50 transition-all"
                  >
                    Send Message
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Modals */}
      {selectedLog && (
        <VisitLogModal
          log={selectedLog}
          carerName={carerNames[selectedLog.carer_id]}
          onClose={() => setSelectedLog(null)}
        />
      )}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
      {selectedSchedule && (
        <ScheduleModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
      {showArchive && (
        <ArchiveModal
          archiveData={archiveData}
          loading={archiveLoading}
          carerNames={carerNames}
          formatLogDate={formatLogDate}
          getMoodEmoji={getMoodEmoji}
          reportTypeConfig={reportTypeConfig}
          onSelectLog={setSelectedLog}
          onSelectReport={setSelectedReport}
          onClose={() => setShowArchive(false)}
        />
      )}
    </>
  );
}

/* ─── Archive Modal ──────────────────────────────────────────────── */
function ArchiveModal({
  archiveData,
  loading,
  carerNames,
  formatLogDate,
  getMoodEmoji,
  reportTypeConfig,
  onSelectLog,
  onSelectReport,
  onClose,
}) {
  // Merge all logs and reports into one feed
  const allItems = [
    ...archiveData.logs.map((l) => ({ ...l, _kind: "log" })),
    ...archiveData.reports.map((r) => ({ ...r, _kind: "report" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <History size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Complete Care Archive
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Full History • {allItems.length} Records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg  cursor-pointer transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-6 animate-pulse h-32"
                />
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-900">No records yet</p>
              <p className="text-sm mt-1">
                Visit logs and reports will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => {
                /* ── Visit Log entry ── */
                if (item._kind === "log") {
                  const moodCfg = getMoodEmoji(item.mood);
                  const carerName = carerNames[item.carer_id];
                  const initials = carerName
                    ? carerName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "CT";

                  return (
                    <div
                      key={`log-${item.id}`}
                      onClick={() => {
                        onClose();
                        onSelectLog(item);
                      }}
                      className="flex gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl border-2 border-white bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-black text-sm text-slate-900 tracking-tight">
                              {carerName || "Care Team"}
                            </p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Visit Log
                            </p>
                          </div>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100">
                            {formatLogDate(item.created_at)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 mb-3 italic">
                            "{item.notes}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {moodCfg && (
                            <span className="text-[9px] px-2 py-1 bg-white border border-slate-200 text-slate-900 rounded-full font-black uppercase tracking-widest">
                              Mood: {moodCfg.label}
                            </span>
                          )}
                          {item.appetite && (
                            <span className="text-[9px] px-2 py-1 bg-white border border-slate-200 text-slate-900 rounded-full font-black uppercase tracking-widest">
                              Appetite: {item.appetite}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                /* ── Report entry ── */
                const typeCfg =
                  reportTypeConfig[item.type] || reportTypeConfig.other;
                const authorName = item.created_by_profile?.full_name;
                const initials = authorName
                  ? authorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "MG";

                return (
                  <div
                    key={`report-${item.id}`}
                    onClick={() => {
                      onClose();
                      onSelectReport(item);
                    }}
                    className="flex gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-slate-900 tracking-tight">
                            {authorName || "Care Team"}
                          </p>
                          {item.type && (
                            <span
                              className={`text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${typeCfg.color}`}
                            >
                              {item.type}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100">
                          {formatLogDate(item.created_at)}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 text-xs mb-1">
                        {item.title}
                      </p>

                      {item.content && (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 cursor-pointer text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Visit Log Modal ────────────────────────────────────────────── */
function VisitLogModal({ log, carerName, onClose }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getMoodConfig = (mood) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return {
          emoji: "😊",
          label: "Happy",
          color: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        };
      case "calm":
        return {
          emoji: "😌",
          label: "Calm",
          color: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
        };
      case "anxious":
        return {
          emoji: "😰",
          label: "Anxious",
          color: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
        };
      case "irritable":
        return {
          emoji: "😤",
          label: "Irritable",
          color: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
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
          color: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        };
      case "normal":
        return {
          label: "Normal",
          dot: "bg-amber-500",
          color: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
        };
      case "poor":
        return {
          label: "Poor",
          dot: "bg-rose-500",
          color: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
        };
      default:
        return null;
    }
  };

  const moodConfig = getMoodConfig(log.mood);
  const appetiteConfig = getAppetiteConfig(log.appetite);
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-600 rounded-[20px] flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {initials}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Visit Log
              </h2>
              <p className="text-sm text-slate-400 mt-1 font-bold">
                {fmt(log.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors flex-shrink-0"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Carer info */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Visited by
            </p>
            <p className="text-lg font-black text-slate-900 tracking-tight">
              {carerName || "Care Team"}
            </p>
          </div>

          {/* Mood + Appetite */}
          {(moodConfig || appetiteConfig) && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Assessment
              </p>
              <div className="flex flex-wrap gap-3">
                {moodConfig && (
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black ${moodConfig.color}`}
                  >
                    {moodConfig.emoji} Mood: {moodConfig.label}
                  </span>
                )}
                {appetiteConfig && (
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black ${appetiteConfig.color}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${appetiteConfig.dot}`}
                    />
                    Appetite: {appetiteConfig.label}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Observations */}
          {log.notes && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Observations
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {log.notes}
                </p>
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Tasks Completed
              </p>
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-700 font-bold">
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-4 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─── Report Modal ───────────────────────────────────────────────── */
function ReportModal({ report, onClose }) {
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
      color: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
      dot: "bg-rose-500",
    },
    medication: {
      color: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-slate-50 text-slate-600 ring-1 ring-slate-100",
      dot: "bg-slate-400",
    },
  };
  const typeCfg = typeConfig[report.type] || typeConfig.other;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {report.title}
              </h2>
              {report.type && (
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${typeCfg.color}`}
                >
                  <span className={`w-2 h-2 rounded-full ${typeCfg.dot}`} />
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
              {report.created_by_profile && (
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-blue-400" />
                  {report.created_by_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-blue-400" />
                {fmt(report.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors flex-shrink-0"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {report.content || "No content available."}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-4 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─── Schedule Modal ─────────────────────────────────────────────── */
function ScheduleModal({ schedule, onClose }) {
  const carerInfo = schedule.carer ?? null;
  const creatorInfo = schedule.creator ?? null;

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const statusColor = (s) =>
    ({
      completed: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
      pending: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      cancelled: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
      in_progress: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
    })[s?.toLowerCase()] || "bg-slate-50 text-slate-600 ring-1 ring-slate-100";

  const upcoming = new Date(schedule.start_at) > new Date();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg ${upcoming ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-slate-400 to-slate-600"}`}
            >
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {schedule.title || "Care Visit"}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${statusColor(schedule.status)}`}
                >
                  {schedule.status || "Unknown"}
                </span>
                {upcoming && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    Upcoming
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100  cursor-pointer rounded-xl transition-colors flex-shrink-0"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Time details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" />
                Start Time
              </p>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {fmt(schedule.start_at)}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" />
                End Time
              </p>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                {fmt(schedule.end_at)}
              </p>
            </div>
          </div>

          {/* Carer and creator info */}
          { (carerInfo || creatorInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              {carerInfo && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <UserCheck size={12} className="text-blue-400" />
                    Assigned Carer
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight mb-2">
                    {carerInfo.full_name}
                  </p>
                  {carerInfo.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-bold">
                      <span>📞</span> {carerInfo.phone}
                    </p>
                  )}
                </div>
              )}
              {creatorInfo && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <User size={12} className="text-blue-400" />
                    Created By
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {creatorInfo.full_name}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-4 bg-slate-900 cursor-pointer hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
