"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Square,
  CheckCircle2,
  CalendarDays,
  MapPin,
  ChevronRight,
  Stethoscope,
  Circle,
  X,
  ClipboardList,
  Clock,
  AlertCircle,
  History,
  Timer,
  Activity,
  Sparkles,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";

export default function CarerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Visit flow: null | "active" | "log"
  const [activeVisit, setActiveVisit] = useState(null);
  const [visitStep, setVisitStep] = useState(null);

  useEffect(() => {
    if (demoUser?.id) fetchSchedules(demoUser.id);
  }, [demoUser]);

  const fetchSchedules = async (carerId) => {
    try {
      setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `id, start_at, end_at, status, title, required_tasks,
          patient:patient_id (id, full_name, room, status)`,
        )
        .eq("carer_id", carerId)
        .gte("start_at", todayStart.toISOString())
        .lte("start_at", todayEnd.toISOString())
        .order("start_at", { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  const JORDAN_REED_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

      const { data, error } = await supabase
        .from("schedules")
        .select(
          `id, start_at, end_at, status, title,
          patient:patient_id (id, full_name, room)`,
        )
        .eq("carer_id", JORDAN_REED_ID)
        .eq("status", "completed")
        .order("start_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  // ── Start Visit
  const handleStartVisit = async (schedule) => {
    try {
      await supabase
        .from("schedules")
        .update({ status: "in progress" })
        .eq("id", schedule.id);

      await supabase.from("audit_logs").insert({
        action_type: "schedule_started",
        actor_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        related_to: schedule.patient?.id,
        created_at: new Date().toISOString(),
      });

      setSchedules((prev) =>
        prev.map((s) =>
          s.id === schedule.id ? { ...s, status: "in progress" } : s,
        ),
      );
      setActiveVisit({ ...schedule, status: "in progress" });
      setVisitStep("active");
    } catch (err) {
      console.error("Failed to start visit:", err);
    }
  };

  const handleEndVisit = (checkedTasks) => {
    setActiveVisit((prev) => ({ ...prev, checkedTasks }));
    setVisitStep("log");
  };

  const handleSubmitLog = async ({ notes, appetite, mood, checkedTasks }) => {
    const now = new Date().toISOString();

    const { error: logError } = await supabase.from("visit_logs").insert({
      patient_id: activeVisit.patient?.id,
      carer_id: demoUser?.id,
      schedule_id: activeVisit.id,
      notes: notes.trim(),
      appetite,
      mood,
      created_at: now,
    });
    if (logError) throw logError;

    const { error: scheduleError } = await supabase
      .from("schedules")
      .update({ status: "completed" })
      .eq("id", activeVisit.id);
    if (scheduleError) throw scheduleError;

    await supabase.from("audit_logs").insert({
      action_type: "schedule_completed",
      actor_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      related_to: activeVisit.patient?.id,
      created_at: new Date().toISOString(),
    });

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === activeVisit.id ? { ...s, status: "completed" } : s,
      ),
    );
    setActiveVisit(null);
    setVisitStep(null);
  };

  const handleCloseModal = () => {
    setActiveVisit(null);
    setVisitStep(null);
  };

  const upcomingCount = schedules.filter((s) => {
    const st = s.status?.toLowerCase();
    return st !== "completed" && st !== "cancelled";
  }).length;

  const completedCount = schedules.filter(
    (s) => s.status?.toLowerCase() === "completed",
  ).length;

  const isLoading = userLoading || loading;

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = () =>
    new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          dot: "bg-emerald-400",
          badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
          label: "Completed",
        };
      case "in progress":
        return {
          dot: "bg-blue-400 animate-pulse",
          badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
          label: "In Progress",
        };
      case "cancelled":
        return {
          dot: "bg-rose-400",
          badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
          label: "Cancelled",
        };
      default:
        return {
          dot: "bg-amber-400",
          badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
          label: "Pending",
        };
    }
  };

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* ── Hero Banner ── */}
          <div className="relative overflow-hidden rounded-[32px] mb-8 bg-slate-900 p-8 shadow-2xl shadow-slate-200">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[80px] rounded-full"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ring-1 ring-white/10 backdrop-blur-md">
                  <Sparkles size={12} />
                  Shift Performance
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                  {isLoading
                    ? "Welcome!"
                    : `Hello, ${demoUser?.full_name?.split(" ")[0]}!`}
                </h1>
                <p className="text-slate-400 text-lg font-bold">
                  {isLoading
                    ? "Loading your schedule..."
                    : schedules.length === 0
                      ? "No visits scheduled for today."
                      : `You have ${schedules.length} visit${schedules.length !== 1 ? "s" : ""} scheduled for today.`}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-6 border border-white/10 w-32 text-center hover:bg-white/10 transition-all">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Remaining
                  </p>
                  <p className="text-3xl font-black text-white">
                    {isLoading ? "—" : upcomingCount}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-6 border border-white/10 w-32 text-center hover:bg-white/10 transition-all">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Completed
                  </p>
                  <p className="text-3xl font-black text-white">
                    {isLoading ? "—" : completedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Today's Schedule ── */}
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Your Schedules
                </h2>
               
              </div>
              <button
                onClick={handleOpenHistory}
                className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                View Historical Records
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Activity size={64} className="mb-5 opacity-10 animate-pulse" />
                <p className="font-black text-lg text-slate-900 tracking-tight">
                  Loading schedule...
                </p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <CalendarDays className="text-slate-300" size={24} />
                </div>
                <p className="font-black text-slate-900 mb-1 tracking-tight">
                  No visits today
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  Enjoy your day off!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {schedules.map((schedule, index) => {
                  const cfg = getStatusConfig(schedule.status);
                  const isCompleted =
                    schedule.status?.toLowerCase() === "completed";
                  const isCancelled =
                    schedule.status?.toLowerCase() === "cancelled";
                  const isInProgress =
                    schedule.status?.toLowerCase() === "in progress";

                  return (
                    <div
                      key={schedule.id}
                      className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all group cursor-default"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 rounded-[30px] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-lg ring-8 ring-slate-50 transition-transform group-hover:scale-105">
                          {schedule.patient?.full_name
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </div>
                        {isInProgress && (
                          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
                            <Activity size={14} strokeWidth={3} />
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-200">
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full ring-1 ring-blue-100 self-center md:self-start">
                            {formatTime(schedule.start_at)} Protocol
                          </span>
                          {schedule.patient?.room && (
                            <>
                              <span className="text-slate-300 hidden md:block">
                                •
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Room {schedule.patient.room}
                              </span>
                            </>
                          )}
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                          {schedule.patient?.full_name || "Unknown Patient"}
                        </h4>
                        {schedule.title && (
                          <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                            <ClipboardList
                              size={16}
                              className="text-slate-300"
                            />
                            {schedule.title}
                          </p>
                        )}
                      </div>

                      <div className="w-full md:w-auto">
                        {isCompleted ? (
                          <div className="w-full md:w-auto px-10 py-5 rounded-[20px] bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest shadow-sm ring-1 ring-emerald-100 flex items-center justify-center gap-3">
                            <CheckCircle2 size={18} strokeWidth={3} />
                            Completed
                          </div>
                        ) : isCancelled ? (
                          <div className="w-full md:w-auto px-10 py-5 rounded-[20px] bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-widest shadow-sm ring-1 ring-rose-100 flex items-center justify-center gap-3">
                            <Circle size={18} strokeWidth={3} />
                            Cancelled
                          </div>
                        ) : isInProgress ? (
                          <button
                            onClick={() => {
                              setActiveVisit(schedule);
                              setVisitStep("active");
                            }}
                            className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center gap-3 justify-center hover:bg-blue-700 transition-all active:scale-95"
                          >
                            <Square
                              size={18}
                              fill="currentColor"
                              strokeWidth={0}
                            />
                            End Visit
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartVisit(schedule)}
                            className="w-full md:w-auto bg-slate-900 text-white px-8 py-5 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center gap-3 justify-center hover:bg-slate-800 transition-all active:scale-95 group/btn"
                          >
                            <Play
                              size={18}
                              fill="currentColor"
                              strokeWidth={0}
                            />
                            Initiate Visit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── History Modal ── */}
      {showHistory && (
        <HistoryModal
          history={history}
          loading={historyLoading}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ── Visit Modals ── */}
      {activeVisit && visitStep === "active" && (
        <ActiveVisitModal
          schedule={activeVisit}
          formatTime={formatTime}
          onEndVisit={handleEndVisit}
          onClose={handleCloseModal}
        />
      )}
      {activeVisit && visitStep === "log" && (
        <VisitLogModal
          schedule={activeVisit}
          onSubmit={handleSubmitLog}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

/* ─── History Modal ─────────────────────────────────────────────── */
function HistoryModal({ history, loading, onClose }) {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getDuration = (start, end) => {
    if (!start || !end) return null;
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <History size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Past Visits
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Completed history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-4 animate-pulse h-16"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <History size={32} className="mb-3 opacity-20" />
              <p className="font-bold text-sm">No past visits yet</p>
              <p className="text-xs mt-1">Completed visits will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((s) => {
                const duration = getDuration(s.start_at, s.end_at);
                return (
                  <div
                    key={s.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {s.patient?.full_name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate">
                            {s.patient?.full_name || "Unknown Patient"}
                          </p>
                          {s.title && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-bold">
                              <Stethoscope
                                size={9}
                                className="text-slate-400 flex-shrink-0"
                              />
                              {s.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {duration && (
                        <div className="flex items-center gap-1 bg-slate-900 rounded-lg px-2 py-1 flex-shrink-0">
                          <Timer size={10} className="text-white" />
                          <span className="text-[10px] font-black text-white">
                            {duration}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={9} className="text-slate-400" />
                        {formatDate(s.start_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={9} className="text-slate-400" />
                        {formatTime(s.start_at)}
                      </span>
                      {s.patient?.room && (
                        <span className="flex items-center gap-1">
                          <MapPin size={9} className="text-slate-400" />
                          Room {s.patient.room}
                        </span>
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
            className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Active Visit Modal ─────────────────────────────────────────── */
function ActiveVisitModal({ schedule, formatTime, onEndVisit, onClose }) {
  const patient = schedule.patient;

  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  };

  const parsedTasks = (() => {
    try {
      if (!schedule.required_tasks) return [];
      return JSON.parse(schedule.required_tasks);
    } catch {
      return [];
    }
  })();

  const [checkedTasks, setCheckedTasks] = useState(() =>
    parsedTasks.map(() => false),
  );

  const toggleTask = (index) => {
    setCheckedTasks((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const allChecked = parsedTasks.length > 0 && checkedTasks.every(Boolean);
  const checkedCount = checkedTasks.filter(Boolean).length;

  const handleEndVisit = () => onEndVisit(checkedTasks);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-md w-full p-8 shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                Visit In Progress
              </p>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Active Visit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-base font-black shadow-md flex-shrink-0">
              {patient?.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-black text-slate-900 text-base">
                {patient?.full_name || "Unknown"}
              </p>
              {patient?.room && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-bold">
                  <MapPin size={11} className="text-slate-400" />
                  Room {patient.room}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Visit Started
            </p>
            <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Clock size={12} className="text-blue-600" />
              {formatTime(schedule.start_at)}
              <span className="text-slate-300 mx-1">·</span>
              <span className="text-blue-600 tabular-nums">
                {formatElapsed(elapsed)}
              </span>
            </p>
          </div>

          {schedule.title && (
            <div className="border-t border-slate-200 pt-3 mt-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Visit Type
              </p>
              <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Stethoscope size={12} className="text-slate-400" />
                {schedule.title}
              </p>
            </div>
          )}
        </div>

        {parsedTasks.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Required Tasks
              </p>
              <span className="text-xs font-black text-slate-500">
                {checkedCount}/{parsedTasks.length}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-500"
                style={{
                  width: `${parsedTasks.length > 0 ? (checkedCount / parsedTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="space-y-2">
              {parsedTasks.map((task, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleTask(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    checkedTasks[index]
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${checkedTasks[index] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
                  >
                    {checkedTasks[index] && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-all ${checkedTasks[index] ? "line-through opacity-70" : ""}`}
                  >
                    {task}
                  </span>
                </button>
              ))}
            </div>
            {allChecked && (
              <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs font-black">
                <CheckCircle2 size={12} />
                All tasks completed!
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-5 px-1">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <p className="text-xs text-slate-500 font-medium">
            {parsedTasks.length > 0
              ? `${checkedCount} of ${parsedTasks.length} tasks done`
              : "Click End Visit when finished"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black active:scale-95 text-xs uppercase tracking-widest"
          >
            Minimise
          </button>
          <button
            onClick={handleEndVisit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            <Square size={12} fill="white" />
            End Visit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Visit Log Modal ────────────────────────────────────────────── */
function VisitLogModal({ schedule, onSubmit, onClose }) {
  const [notes, setNotes] = useState("");
  const [appetite, setAppetite] = useState("normal");
  const [mood, setMood] = useState("happy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const patient = schedule.patient;

  const parsedTasks = (() => {
    try {
      if (!schedule.required_tasks) return [];
      return JSON.parse(schedule.required_tasks);
    } catch {
      return [];
    }
  })();

  const [checkedTasks, setCheckedTasks] = useState(
    () => schedule.checkedTasks || parsedTasks.map(() => false),
  );

  const toggleTask = (index) => {
    setCheckedTasks((prev) => prev.map((val, i) => (i === index ? !val : val)));
  };

  const checkedCount = checkedTasks.filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please add visit notes before submitting.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSubmit({ notes, appetite, mood, checkedTasks });
    } catch {
      setError("Failed to save visit log. Please try again.");
      setSaving(false);
    }
  };

  const selectClass =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all text-sm appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-lg w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                Visit Complete
              </p>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Visit Notes
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 mb-6">
          <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {patient?.full_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-slate-900 text-sm truncate">
              {patient?.full_name}
            </p>
            <p className="text-[10px] text-slate-500 font-bold">
              {[patient?.room ? `Room ${patient.room}` : null, schedule.title]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 flex-shrink-0">
            ✓ Done
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {parsedTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Required Tasks
                </label>
                <span className="text-[10px] text-slate-500 font-bold">
                  {checkedCount}/{parsedTasks.length} completed
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-500"
                  style={{
                    width: `${parsedTasks.length > 0 ? (checkedCount / parsedTasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="space-y-2">
                {parsedTasks.map((task, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleTask(index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                      checkedTasks[index]
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${checkedTasks[index] ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
                    >
                      {checkedTasks[index] && (
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
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-all ${checkedTasks[index] ? "line-through opacity-70" : ""}`}
                    >
                      {task}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Observations <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How is the client today? Any mood changes or physical concerns?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all resize-none text-sm leading-relaxed"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right font-medium">
              {notes.length} characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${appetite === "great" ? "bg-emerald-500" : appetite === "poor" ? "bg-rose-500" : "bg-amber-500"}`}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-sm">
                    {mood === "happy"
                      ? "😊"
                      : mood === "calm"
                        ? "😌"
                        : mood === "anxious"
                          ? "😰"
                          : "😤"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-600 font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !notes.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              <ClipboardList size={13} />
              {saving ? "Saving..." : "Complete Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
