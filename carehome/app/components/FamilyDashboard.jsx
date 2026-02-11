"use client";
import { createClient } from "../lib/supabase/client";
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
  FileText,
  X,
  ClipboardList,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";

export default function FamilyDashboard() {
  const supabase = createClient();
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

  useEffect(() => {
    if (demoUser?.id) fetchData(demoUser.id);
  }, [demoUser]);

  const fetchData = async (familyId) => {
    try {
      setLoading(true);

      const { data: linkData, error: linkError } = await supabase
        .from("patient_family")
        .select("patient_id, relationship")
        .eq("family_id", familyId);

      if (linkError || !linkData || linkData.length === 0) {
        setLoading(false);
        return;
      }

      const firstLink = linkData[0];
      setRelationship(firstLink.relationship);
      const patientId = firstLink.patient_id;

      // Patient
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      setPatient(patientData);

      // Visit logs (last 5)
      const { data: logsData } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(5);
      const logs = logsData || [];
      setVisitLogs(logs);

      // Carer names
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

      // Reports (last 5)
      const { data: reportsData } = await supabase
        .from("reports")
        .select(
          "id, title, content, type, created_at, created_by_profile:created_by (id, full_name)",
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(5);
      setReports(reportsData || []);

      // Upcoming schedules
      const now = new Date().toISOString();
      const { data: schedulesData } = await supabase
        .from("schedules")
        .select("*")
        .eq("patient_id", patientId)
        .gte("start_at", now)
        .order("start_at", { ascending: true })
        .limit(3);
      setUpcomingSchedules(schedulesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Merge visit logs + reports into one feed sorted by date
  const feedItems = [
    ...visitLogs.map((l) => ({ ...l, _kind: "log" })),
    ...reports.map((r) => ({ ...r, _kind: "report" })),
  ]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

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
          color: "bg-green-100 text-green-700 border-green-200",
          dot: "bg-green-500",
        };
      case "attention":
        return {
          color: "bg-amber-100 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        };
      case "critical":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          dot: "bg-red-500",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };
    }
  };

  const reportTypeConfig = {
    falls: {
      color: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
    medication: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    },
  };

  const isLoading = userLoading || loading;
  const statusCfg = patient ? getStatusConfig(patient.status) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">
            No linked resident found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Contact the care home to be linked to a resident.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10 max-w-5xl">
          {/* ── Welcome Banner ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 mb-7 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  Welcome back, {demoUser?.full_name?.split(" ")[0] || "there"}
                </h1>
                <p className="text-gray-500">
                  Here is the latest update for your{" "}
                  <span className="text-gray-700 font-medium">
                    {relationship ? relationship.toLowerCase() : "loved one"}
                  </span>
                  ,{" "}
                  <span className="text-blue-600 font-semibold">
                    {patient.full_name}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg bg-gradient-to-br from-blue-400 to-blue-600">
                  {patient.full_name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => router.push("/family/mylovedones")}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Full Profile
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Quick info strip */}
            <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} className="text-blue-500" />
                <span>Room {patient.room || "N/A"}</span>
              </div>
              {patient.wing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User size={14} className="text-blue-500" />
                  <span>{patient.wing} Wing</span>
                </div>
              )}
              {patient.key_health_indicator && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Heart size={14} className="text-blue-500" />
                  <span>{patient.key_health_indicator}</span>
                </div>
              )}
              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {patient.status}
                </span>
              )}
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Recent Updates feed ── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500" />
                    Recent Updates
                  </h2>
                  <span className="text-sm text-gray-400">
                    {feedItems.length} items
                  </span>
                </div>

                {feedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                    <Activity size={40} className="mb-3" />
                    <p className="text-sm font-medium text-gray-400">
                      No updates yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {feedItems.map((item) => {
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
                          <button
                            key={`log-${item.id}`}
                            onClick={() => setSelectedLog(item)}
                            className="w-full px-6 py-5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-800">
                                      {carerName || "Care Team"}
                                    </p>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-violet-100 text-violet-600 border border-violet-200 rounded-full">
                                      Visit Log
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                                    {formatLogDate(item.created_at)}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-gray-600 leading-relaxed mb-2 line-clamp-2">
                                    {item.notes}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {moodCfg && (
                                    <span
                                      className={`text-xs font-semibold ${moodCfg.color}`}
                                    >
                                      {moodCfg.emoji} Mood: {moodCfg.label}
                                    </span>
                                  )}
                                  {item.appetite && (
                                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                                      <Utensils size={11} />
                                      Appetite:{" "}
                                      {item.appetite.charAt(0).toUpperCase() +
                                        item.appetite.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight
                                size={18}
                                className="text-gray-300 flex-shrink-0 mt-1"
                              />
                            </div>
                          </button>
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
                        <button
                          key={`report-${item.id}`}
                          onClick={() => setSelectedReport(item)}
                          className="w-full px-6 py-5 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-gray-800">
                                    {authorName || "Care Team"}
                                  </p>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-600 border border-blue-200 rounded-full">
                                    Report
                                  </span>
                                  {item.type && (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeCfg.color}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`}
                                      />
                                      {item.type.charAt(0).toUpperCase() +
                                        item.type.slice(1)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                                  {formatLogDate(item.created_at)}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                {item.title}
                              </p>
                              {item.content && (
                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                  {item.content}
                                </p>
                              )}
                            </div>
                            <ChevronRight
                              size={18}
                              className="text-gray-300 flex-shrink-0 mt-1"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-5">
              {/* Upcoming Visits */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    Upcoming Visits
                  </h2>
                </div>

                {upcomingSchedules.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Calendar
                      size={28}
                      className="text-gray-200 mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-400">No upcoming visits</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcomingSchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => setSelectedSchedule(schedule)}
                        className="w-full px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                          {formatDate(schedule.start_at)},{" "}
                          {formatTime(schedule.start_at)}
                        </p>
                        <p className="text-sm font-bold text-gray-800 mb-0.5">
                          {schedule.title || "Care Visit"}
                        </p>
                        {schedule.end_at && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            Until {formatTime(schedule.end_at)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send a Message */}
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 shadow-lg">
                <h3 className="text-base font-bold text-white mb-1.5">
                  Send a Message
                </h3>
                <p className="text-sm text-blue-200 mb-4 leading-relaxed">
                  Leave a note for the care team or send a digital card to{" "}
                  {patient.full_name?.split(" ")[0]}.
                </p>
                <button
                  className="w-full py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95"
                  onClick={() => router.push("/family/messages")}
                >
                  New Message
                </button>
              </div>

              {/* Health summary */}
              {patient.health_summary && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Heart size={15} className="text-red-400" />
                    Health Summary
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {patient.health_summary}
                  </p>
                  {(patient.pulse || patient.bp) && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                      {patient.pulse && (
                        <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-red-600">
                            {patient.pulse}
                          </p>
                          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                            BPM
                          </p>
                        </div>
                      )}
                      {patient.bp && (
                        <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-blue-600">
                            {patient.bp}
                          </p>
                          <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">
                            BP
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
    </>
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
          color: "bg-green-100 text-green-700 border-green-200",
        };
      case "calm":
        return {
          emoji: "😌",
          label: "Calm",
          color: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "anxious":
        return {
          emoji: "😰",
          label: "Anxious",
          color: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "irritable":
        return {
          emoji: "😤",
          label: "Irritable",
          color: "bg-red-100 text-red-700 border-red-200",
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
          dot: "bg-green-500",
          color: "bg-green-100 text-green-700 border-green-200",
        };
      case "normal":
        return {
          label: "Normal",
          dot: "bg-amber-500",
          color: "bg-amber-100 text-amber-700 border-amber-200",
        };
      case "poor":
        return {
          label: "Poor",
          dot: "bg-red-500",
          color: "bg-red-100 text-red-700 border-red-200",
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Visit Log</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {fmt(log.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Carer info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Visited by</p>
            <p className="text-base font-semibold text-gray-800">
              {carerName || "Care Team"}
            </p>
          </div>

          {/* Mood + Appetite */}
          {(moodConfig || appetiteConfig) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Assessment
              </p>
              <div className="flex flex-wrap gap-2">
                {moodConfig && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border ${moodConfig.color}`}
                  >
                    {moodConfig.emoji} Mood: {moodConfig.label}
                  </span>
                )}
                {appetiteConfig && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border ${appetiteConfig.color}`}
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Observations
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {log.notes}
                </p>
              </div>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Tasks Completed
              </p>
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="w-5 h-5 rounded bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="#16a34a"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
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
      color: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
    medication: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    nutrition: {
      color: "bg-blue-100 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    other: {
      color: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    },
  };
  const typeCfg = typeConfig[report.type] || typeConfig.other;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">
                {report.title}
              </h2>
              {report.type && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeCfg.color}`}
                >
                  <span className={`w-2 h-2 rounded-full ${typeCfg.dot}`} />
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {report.created_by_profile && (
                <span className="flex items-center gap-1">
                  <User size={11} className="text-blue-400" />
                  {report.created_by_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-blue-400" />
                {fmt(report.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {report.content || "No content available."}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─── Schedule Modal ─────────────────────────────────────────────── */
function ScheduleModal({ schedule, onClose }) {
  const supabase = createClient();
  const [carerInfo, setCarerInfo] = useState(null);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        if (schedule.carer_id) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .eq("id", schedule.carer_id)
            .single();
          setCarerInfo(data);
        }
        if (schedule.created_by) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", schedule.created_by)
            .single();
          setCreatorInfo(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [schedule]);

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
      completed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      "in progress": "bg-blue-100 text-blue-700 border-blue-200",
    })[s?.toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200";

  const upcoming = new Date(schedule.start_at) > new Date();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg ${upcoming ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-gray-400 to-gray-600"}`}
            >
              <CalendarDays size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {schedule.title || "Care Visit"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(schedule.status)}`}
                >
                  {schedule.status || "Unknown"}
                </span>
                {upcoming && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Upcoming
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Time details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-blue-400" />
                Start Time
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {fmt(schedule.start_at)}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-blue-400" />
                End Time
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {fmt(schedule.end_at)}
              </p>
            </div>
          </div>

          {/* Carer and creator info */}
          {!loading && (carerInfo || creatorInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {carerInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <UserCheck size={12} className="text-blue-400" />
                    Assigned Carer
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {carerInfo.full_name}
                  </p>
                  {carerInfo.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span>📞</span> {carerInfo.phone}
                    </p>
                  )}
                </div>
              )}
              {creatorInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <User size={12} className="text-blue-400" />
                    Created By
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {creatorInfo.full_name}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
