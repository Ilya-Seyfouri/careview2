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
} from "lucide-react";
import { useDemoUser } from "../components/DemoContext";

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

  // ── Fix: upcoming = pending OR in progress OR anything not completed/cancelled
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
          dot: "bg-green-400",
          badge: "bg-green-500/15 text-green-400 border-green-500/25",
          label: "Completed",
        };
      case "in progress":
        return {
          dot: "bg-blue-400 animate-pulse",
          badge: "bg-blue-500/15 text-blue-400 border-blue-500/25",
          label: "In Progress",
        };
      case "cancelled":
        return {
          dot: "bg-red-400",
          badge: "bg-red-500/15 text-red-400 border-red-500/25",
          label: "Cancelled",
        };
      default:
        return {
          dot: "bg-yellow-400",
          badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
          label: "Pending",
        };
    }
  };

  return (
    <>
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* ── Hero Banner ── */}
          <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-800 p-8 shadow-2xl shadow-cyan-500/25">
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
            <div className="absolute top-4 right-32 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative mb-6">
              <p className="text-cyan-100/80 text-sm font-medium mb-1">
                {formatDate()}
              </p>
              <h1 className="text-3xl font-bold text-white">
                {isLoading
                  ? "Welcome!"
                  : `Hello, ${demoUser?.full_name?.split(" ")[0]}!`}
              </h1>
              <p className="text-cyan-100/90 mt-1 text-sm">
                {isLoading
                  ? "Loading your schedule..."
                  : schedules.length === 0
                    ? "No visits scheduled for today."
                    : `You have ${schedules.length} visit${schedules.length !== 1 ? "s" : ""} scheduled for today.`}
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                <p className="text-cyan-100/70 text-xs font-semibold uppercase tracking-wider mb-1">
                  Remaining
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? "—" : upcomingCount}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                <p className="text-cyan-100/70 text-xs font-semibold uppercase tracking-wider mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-white">
                  {isLoading ? "—" : completedCount}
                </p>
              </div>
              {/* History button replacing My Clients */}
              <button
                onClick={handleOpenHistory}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                <History size={16} className="text-white" />
                <span className="text-white font-semibold text-sm">
                  History
                </span>
              </button>
            </div>
          </div>

          {/* ── Today's Schedule ── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CalendarDays size={20} className="text-cyan-500" />
                My Schedule Today
              </h2>
              <span className="text-sm text-muted-foreground">
                {!isLoading && `${schedules.length} total`}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border-2 border-white/10 rounded-2xl p-5 animate-pulse h-24"
                  />
                ))}
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl">
                <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center mb-4">
                  <CalendarDays className="text-muted-foreground" size={28} />
                </div>
                <p className="text-foreground font-medium mb-1">
                  No visits today
                </p>
                <p className="text-sm text-muted-foreground">
                  Enjoy your day off!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                      className={`group bg-white/5 border-2 rounded-2xl backdrop-blur-xl p-5 transition-all duration-200 ${
                        isInProgress
                          ? "border-blue-500/40 shadow-lg shadow-blue-500/10"
                          : !isCompleted && !isCancelled
                            ? "border-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
                            : "border-white/10 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="flex-shrink-0 w-16 text-center">
                          <p className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                            {formatTime(schedule.start_at)}
                          </p>
                          {schedule.end_at && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              — {formatTime(schedule.end_at)}
                            </p>
                          )}
                        </div>

                        {/* Timeline dot */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1 self-stretch">
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`}
                          />
                          {index < schedules.length - 1 && (
                            <div className="w-px flex-1 bg-white/10" />
                          )}
                        </div>

                        {/* Patient info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex-shrink-0">
                              {schedule.patient?.full_name
                                ?.charAt(0)
                                .toUpperCase() || "?"}
                            </div>
                            <p
                              className={`font-bold text-foreground truncate ${isCompleted ? "line-through opacity-60" : ""}`}
                            >
                              {schedule.patient?.full_name || "Unknown Patient"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 pl-10">
                            {schedule.patient?.room && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={11} className="text-cyan-500" />
                                Room {schedule.patient.room}
                              </span>
                            )}
                            {schedule.title && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Stethoscope
                                  size={11}
                                  className="text-cyan-500"
                                />
                                {schedule.title}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: badge + action */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span
                            className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>

                          {isCompleted ? (
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                              <CheckCircle2
                                size={18}
                                className="text-green-400"
                              />
                            </div>
                          ) : isCancelled ? (
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                              <Circle size={18} className="text-red-400" />
                            </div>
                          ) : isInProgress ? (
                            <button
                              onClick={() => {
                                setActiveVisit(schedule);
                                setVisitStep("active");
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-700 transition-all active:scale-95"
                            >
                              <Square size={12} fill="white" />
                              End Visit
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartVisit(schedule)}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                            >
                              <Play size={13} fill="white" />
                              Start Visit
                            </button>
                          )}
                        </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <History size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Past Visits</h2>
              <p className="text-xs text-muted-foreground">
                Your completed shift history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse h-20"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <History size={40} className="mb-3 opacity-20" />
              <p className="font-medium">No past visits yet</p>
              <p className="text-sm mt-1">Completed visits will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((s) => {
                const duration = getDuration(s.start_at, s.end_at);
                return (
                  <div
                    key={s.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: avatar + name */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-cyan-500/20">
                          {s.patient?.full_name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {s.patient?.full_name || "Unknown Patient"}
                          </p>
                          {s.title && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Stethoscope
                                size={10}
                                className="text-cyan-500 flex-shrink-0"
                              />
                              {s.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: duration badge */}
                      {duration && (
                        <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-2.5 py-1 flex-shrink-0">
                          <Timer size={11} className="text-cyan-400" />
                          <span className="text-xs font-bold text-cyan-400">
                            {duration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom row: date + room */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} className="text-cyan-500" />
                        {formatDate(s.start_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-cyan-500" />
                        {formatTime(s.start_at)}
                        {s.end_at && ` — ${formatTime(s.end_at)}`}
                      </span>
                      {s.patient?.room && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-cyan-500" />
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
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 border border-white/10 text-foreground rounded-xl hover:bg-white/10 transition-all font-semibold text-sm active:scale-95"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-blue-500/30 rounded-2xl backdrop-blur-xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Visit In Progress
              </p>
              <h2 className="text-xl font-bold text-foreground">
                Active Visit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-cyan-500/20 flex-shrink-0">
              {patient?.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">
                {patient?.full_name || "Unknown"}
              </p>
              {patient?.room && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-cyan-500" />
                  Room {patient.room}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Visit Started
            </p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock size={13} className="text-blue-400" />
              {formatTime(schedule.start_at)}
              <span className="text-muted-foreground mx-1">·</span>
              <span className="text-blue-400 font-bold tabular-nums">
                {formatElapsed(elapsed)}
              </span>
            </p>
          </div>

          {schedule.title && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Visit Type
              </p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Stethoscope size={13} className="text-cyan-500" />
                {schedule.title}
              </p>
            </div>
          )}
        </div>

        {parsedTasks.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Required Tasks
              </p>
              <span className="text-xs font-semibold text-muted-foreground">
                {checkedCount}/{parsedTasks.length}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${parsedTasks.length > 0 ? (checkedCount / parsedTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="space-y-2.5">
              {parsedTasks.map((task, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleTask(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    checkedTasks[index]
                      ? "bg-green-500/10 border-green-500/25 text-green-400"
                      : "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${checkedTasks[index] ? "bg-green-500 border-green-500" : "border-white/30"}`}
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
              <div className="mt-3 flex items-center gap-2 text-green-400 text-xs font-semibold">
                <CheckCircle2 size={14} />
                All tasks completed!
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-5 px-1">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-xs text-muted-foreground">
            {parsedTasks.length > 0
              ? `${checkedCount} of ${parsedTasks.length} tasks done — click End Visit when finished`
              : "Visit in progress — click End Visit when finished"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl hover:bg-white/10 transition-all font-semibold active:scale-95 text-sm"
          >
            Minimise
          </button>
          <button
            onClick={handleEndVisit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-700 transition-all active:scale-95 text-sm"
          >
            <Square size={13} fill="white" />
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
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground focus:outline-none focus:border-cyan-500 transition-colors text-sm appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <ClipboardList size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                Visit Complete
              </p>
              <h2 className="text-xl font-bold text-foreground">Visit Notes</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {patient?.full_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground text-sm truncate">
              {patient?.full_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {[patient?.room ? `Room ${patient.room}` : null, schedule.title]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25 flex-shrink-0">
            ✓ Done
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {parsedTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">
                  Required Tasks
                </label>
                <span className="text-xs text-muted-foreground">
                  {checkedCount}/{parsedTasks.length} completed
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-violet-500 rounded-full transition-all duration-500"
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
                        ? "bg-green-500/10 border-green-500/25 text-green-400"
                        : "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${checkedTasks[index] ? "bg-green-500 border-green-500" : "border-white/30"}`}
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
            <label className="block text-sm font-semibold text-foreground mb-2">
              Observations <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How is the client today? Any mood changes or physical concerns?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm leading-relaxed"
              autoFocus
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${appetite === "great" ? "bg-green-400" : appetite === "poor" ? "bg-red-400" : "bg-amber-400"}`}
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-base">
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
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl hover:bg-white/10 transition-all font-semibold active:scale-95 disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !notes.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-400 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-violet-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <ClipboardList size={14} />
              {saving ? "Saving..." : "Complete Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
