"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertCircle,
  Activity,
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  X,
  FileText,
  Sparkles,
  XCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const MANAGER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export default function ManagerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState(null);
  const [priorityList, setPriorityList] = useState([]);
  // Track which actions have been completed this session: Set of "patient_id::action_type"
  const [completedActions, setCompletedActions] = useState(new Set());
  // Active modal: { type, patient } or null
  const [activeModal, setActiveModal] = useState(null);
  // Toast notification
  const [toast, setToast] = useState(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState(0);
  const [staffStatus, setStaffStatus] = useState({
    active: 0,
    break: 0,
    scheduled: 0,
  });
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [emarTrendData, setEmarTrendData] = useState([]);
  const [chartMetric, setChartMetric] = useState("both");

  const [latestHandover, setLatestHandover] = useState(null);
  const [handoverEntries, setHandoverEntries] = useState([]);
  const [handoverPatients, setHandoverPatients] = useState({});
  const [handoverAuthor, setHandoverAuthor] = useState(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  useEffect(() => {
    fetchAll();
    loadLatestAnalysis(); // Rehydrate analysis from DB on mount
  }, []);

  // ── Load latest analysis session from DB ──────────────────────────
  const loadLatestAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("care_analysis_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return;

      const list = data.priority_list || [];

      // Fetch completed actions from DB to filter out already-done items
      const completedSet = await fetchCompletedActions();

      const filtered = filterCompletedFromList(list, completedSet);
      setPriorityList(filtered);
      setCompletedActions(completedSet);
    } catch (err) {
      console.error("Failed to load analysis session:", err);
    }
  };

  // ── Fetch all completed actions from DB, return as Set ────────────
  const fetchCompletedActions = async () => {
    const { data, error } = await supabase
      .from("completed_care_actions")
      .select("patient_id, action_type");

    if (error || !data) return new Set();

    return new Set(data.map((r) => `${r.patient_id}::${r.action_type}`));
  };

  // ── Filter priority list — remove completed actions, drop empty patients ──
  const filterCompletedFromList = (list, completedSet) => {
    return list
      .map((patient) => ({
        ...patient,
        actions: patient.actions.filter(
          (a) => !completedSet.has(`${patient.patient_id}::${a.type}`),
        ),
      }))
      .filter((patient) => patient.actions.length > 0);
  };

  // ── Mark an action as completed (called by child modals) ──────────
  const handleActionCompleted = async (patientId, actionType) => {
    await supabase.from("completed_care_actions").insert({
      patient_id: patientId,
      action_type: actionType,
      completed_by: MANAGER_ID,
      completed_at: new Date().toISOString(),
    });

    const key = `${patientId}::${actionType}`;
    const newCompleted = new Set(completedActions);
    newCompleted.add(key);
    setCompletedActions(newCompleted);

    setPriorityList((prev) =>
      prev
        .map((patient) => ({
          ...patient,
          actions: patient.actions.filter(
            (a) => a.type !== actionType || patient.patient_id !== patientId,
          ),
        }))
        .filter((patient) => patient.actions.length > 0),
    );

    showToast(`Completed ${actionType.replace(/_/g, " ")}`);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const now = new Date();

      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      setOccupancy(patientCount || 0);

      const [{ data: overdueData }, { data: missedEmarData }] =
        await Promise.all([
          supabase
            .from("schedules")
            .select("id")
            .in("status", ["scheduled", "pending"])
            .lt("end_at", now.toISOString()),
          supabase.from("emar").select("id").eq("status", "missed"),
        ]);
      setOverdueTasks(
        (overdueData || []).length + (missedEmarData || []).length,
      );

      const { data: carersData } = await supabase
        .from("profiles")
        .select("id, status, role")
        .eq("role", "carer");
      const carers = carersData || [];
      setStaffStatus({
        active: carers.filter((c) => c.status === "active").length,
        break: carers.filter((c) => c.status === "break").length,
        scheduled: carers.filter((c) => c.status === "scheduled").length,
      });

      const daysInMonth = now.getDate();

      setTrendData(
        [
          { day: 1, count: 4 },
          { day: 2, count: 2 },
          { day: 3, count: 2 },
          { day: 4, count: 8 },
          { day: 5, count: 8 },
          { day: 6, count: 0 },
          { day: 7, count: 0 },
          { day: 8, count: 6 },
          { day: 9, count: 6 },
          { day: 10, count: 2 },
          { day: 11, count: 2 },
          { day: 12, count: 5 },
          { day: 13, count: 5 },
          { day: 14, count: 7 },
          { day: 15, count: 7 },
          { day: 16, count: 1 },
          { day: 17, count: 1 },
          { day: 18, count: 3 },
          { day: 19, count: 3 },
          { day: 20, count: 8 },
          { day: 21, count: 8 },
          { day: 22, count: 4 },
          { day: 23, count: 6 },
          { day: 24, count: 4 },
          { day: 25, count: 5 },
          { day: 26, count: 3 },
          { day: 27, count: 4 },
          { day: 28, count: 3 },
          { day: 29, count: 4 },
          { day: 30, count: 3 },
        ].filter((d) => d.day <= daysInMonth),
      );

      setEmarTrendData(
        [
          { day: 1, count: 2 },
          { day: 2, count: 0 },
          { day: 3, count: 0 },
          { day: 4, count: 4 },
          { day: 5, count: 4 },
          { day: 6, count: 2 },
          { day: 7, count: 2 },
          { day: 8, count: 2 },
          { day: 9, count: 1 },
          { day: 10, count: 8 },
          { day: 11, count: 8 },
          { day: 12, count: 3 },
          { day: 13, count: 3 },
          { day: 14, count: 2 },
          { day: 15, count: 7 },
          { day: 16, count: 6 },
          { day: 17, count: 7 },
          { day: 18, count: 9 },
          { day: 19, count: 7 },
          { day: 20, count: 8 },
          { day: 21, count: 6 },
          { day: 22, count: 8 },
          { day: 23, count: 7 },
          { day: 24, count: 9 },
          { day: 25, count: 7 },
          { day: 26, count: 8 },
          { day: 27, count: 6 },
          { day: 28, count: 8 },
          { day: 29, count: 7 },
          { day: 30, count: 6 },
        ].filter((d) => d.day <= daysInMonth),
      );

      const { data: latestRows } = await supabase
        .from("shift_handovers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (latestRows && latestRows.length > 0) {
        const latest = latestRows[0];
        setLatestHandover(latest);
        const batchStart = new Date(
          new Date(latest.created_at).getTime() - 2 * 60 * 1000,
        ).toISOString();
        const { data: batchRows } = await supabase
          .from("shift_handovers")
          .select("*")
          .eq("shift_type", latest.shift_type)
          .eq("created_by", latest.created_by)
          .gte("created_at", batchStart)
          .order("created_at", { ascending: true });
        setHandoverEntries(batchRows || []);
        const patIds = [
          ...new Set(
            (batchRows || []).map((r) => r.patient_id).filter(Boolean),
          ),
        ];
        if (patIds.length > 0) {
          const { data: pats } = await supabase
            .from("patients")
            .select("id, full_name, room, wing")
            .in("id", patIds);
          const pm = {};
          (pats || []).forEach((p) => (pm[p.id] = p));
          setHandoverPatients(pm);
        }
        const { data: authorData } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", latest.created_by)
          .single();
        setHandoverAuthor(authorData || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysSince = (dateString) => {
    if (!dateString) return null;
    return Math.floor(
      (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24),
    );
  };

  const fetchAndFormatPatients = async () => {
    const FEATURE1_IDS = [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
      "00000000-0000-0000-0000-000000000003",
    ];
    const { data: patients, error: patError } = await supabase
      .from("patients")
      .select("id, full_name, bp, pulse, health_summary, key_health_indicator");
    if (patError) {
      console.error(patError);
      return;
    }
    const enriched = await Promise.all(
      patients
        .filter((p) => !FEATURE1_IDS.includes(p.id))
        .map(async (patient) => {
          const [visitLogsRes, reportsRes, schedulesRes, emarRes] =
            await Promise.all([
              supabase
                .from("visit_logs")
                .select("notes, appetite, mood, created_at")
                .eq("patient_id", patient.id)
                .order("created_at", { ascending: false })
                .limit(2),
              supabase
                .from("reports")
                .select("type, content, created_at")
                .eq("patient_id", patient.id)
                .order("created_at", { ascending: false })
                .limit(2),
              supabase
                .from("schedules")
                .select("start_at")
                .eq("patient_id", patient.id)
                .order("start_at", { ascending: false })
                .limit(1),
              supabase
                .from("emar")
                .select("medication_name, medication_mg, time_to_take, status")
                .eq("patient_id", patient.id),
            ]);
          const emar = emarRes.data || [];
          return {
            patient_id: patient.id,
            patient_name: patient.full_name,
            bp: patient.bp,
            pulse: patient.pulse,
            health_summary: patient.health_summary,
            days_since_last_visit:
              daysSince(schedulesRes.data?.[0]?.start_at) ??
              "No visit on record",
            visit_logs: (visitLogsRes.data || []).map((l) => ({
              notes: l.notes,
              appetite: l.appetite,
              mood: l.mood,
            })),
            reports: (reportsRes.data || []).map((r) => ({
              type: r.type,
              content: r.content,
            })),
            emar: {
              missed_count: emar.filter(
                (e) => e.status === "missed" || e.status === "skipped",
              ).length,
              medications: emar.map((e) => ({
                medication_name: e.medication_name,
                medication_mg: e.medication_mg,
                time_to_take: e.time_to_take,
                status: e.status,
              })),
            },
          };
        }),
    );
    return enriched;
  };

  const generatePriorityAnalysis = async () => {
    try {
      setLoadingAnalysis(true);
      setError(null);
      setPriorityList([]);

      const patients = await fetchAndFormatPatients();
      const response = await fetch("/api/generate-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patients }),
      });
      if (!response.ok) throw new Error("Failed to generate analysis");
      const data = await response.json();

      if (data.success && data.result) {
        const parsed = JSON.parse(data.result);
        const rawList = parsed.priority_list || [];

        // Save full raw result to DB
        await supabase.from("care_analysis_sessions").insert({
          created_by: MANAGER_ID,
          created_at: new Date().toISOString(),
          priority_list: rawList,
        });

        // Fetch latest completed actions and filter before displaying
        const completedSet = await fetchCompletedActions();
        const filtered = filterCompletedFromList(rawList, completedSet);
        setCompletedActions(completedSet);
        setPriorityList(filtered);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate analysis.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const staffRatio =
    staffStatus.active > 0
      ? `1:${Math.round(occupancy / staffStatus.active)}`
      : "—";
  const monthName = new Date().toLocaleDateString("en-GB", { month: "long" });
  const hour = new Date().getHours();
  const shiftLabel = hour < 14 ? "AM" : hour < 22 ? "PM" : "Night";

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const urgencyConfig = {
    IMMEDIATE: {
      gradient: "from-red-500 to-rose-600",
      glow: "bg-red-400/5 group-hover:bg-red-400/10",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-600",
      label: "Immediate",
    },
    THIS_SHIFT: {
      gradient: "from-amber-400 to-orange-500",
      glow: "bg-amber-400/5 group-hover:bg-amber-400/10",
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-600",
      label: "This Shift",
    },
    THIS_WEEK: {
      gradient: "from-emerald-400 to-green-500",
      glow: "bg-emerald-400/5 group-hover:bg-emerald-400/10",
      dot: "bg-emerald-500",
      badge: "bg-green-50 text-green-600",
      label: "This Week",
    },
  };

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Sparkles size={12} className="animate-pulse" />
              Live Facility Feed
            </div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Facility Overview
                </h1>
                <p className="text-slate-500 text-lg font-medium mt-1">
                  Operational status for{" "}
                  <span className="text-slate-900 font-bold">
                    Greenview Care Home
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <PillStat
                  icon={<Users size={20} className="text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  label="Occupancy"
                  value={loading ? "—" : `${occupancy}/50`}
                />
                <PillStat
                  icon={<TrendingUp size={20} className="text-blue-600" />}
                  iconBg="bg-blue-50"
                  label="Staff Ratio"
                  value={loading ? "—" : staffRatio}
                />
              </div>
            </div>
          </div>

          {/* ── Care Priority Analysis ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">
                  Care Priority Analysis
                </h3>
                <p className="text-slate-400 font-medium text-sm mt-1">
                  AI-powered patient prioritisation
                </p>
              </div>
              <button
                onClick={generatePriorityAnalysis}
                disabled={loadingAnalysis}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-purple-200 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                {loadingAnalysis ? (
                  <>
                    <Activity size={16} className="animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Run Analysis
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 mb-6">
                <AlertCircle
                  size={16}
                  className="text-rose-500 flex-shrink-0"
                />
                <p className="text-sm text-rose-600 font-bold">{error}</p>
              </div>
            )}

            {loadingAnalysis && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-20">
                <Activity
                  size={48}
                  className="mb-4 text-purple-400 animate-spin"
                />
                <p className="font-black text-lg text-slate-900 tracking-tight mb-1">
                  Analysing patient data...
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  Reviewing vitals, visit logs, reports and medications
                </p>
              </div>
            )}

            {!loadingAnalysis && priorityList.length === 0 && !error && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center py-20">
                <Activity
                  size={80}
                  className="mb-6 opacity-10 text-slate-300"
                />
                <p className="font-black text-xl text-slate-900 tracking-tight mb-2">
                  No analysis yet
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  Click Run Analysis to assess all patients
                </p>
              </div>
            )}

            {!loadingAnalysis && priorityList.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {priorityList.map((patient) => {
                  const cfg =
                    urgencyConfig[patient.urgency] || urgencyConfig.THIS_WEEK;
                  if (!patient.actions || patient.actions.length === 0)
                    return null;
                  return (
                    <div
                      key={patient.patient_id}
                      className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-7 flex flex-col gap-5"
                    >
                      {/* Patient header */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 bg-gradient-to-br ${cfg.gradient} rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm flex-shrink-0`}
                        >
                          {getInitials(patient.patient_name)}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                            {patient.patient_name}
                          </h2>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const ACTION_KEYS = [
                          "MAKE_SCHEDULE",
                          "MAKE_REPORT",
                          "REASSIGN_EMAR",
                          "REVIEW_EMAR_PLAN",
                          "CONTACT_FAMILY",
                          "URGENCY_LEVEL",
                        ];
                        const splitPattern = new RegExp(
                          `(?=${ACTION_KEYS.join("|")})`,
                        );
                        const segments = (patient.reasoning || "")
                          .split(splitPattern)
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((seg) => {
                            const dashIdx = seg.indexOf(" - ");
                            if (dashIdx !== -1)
                              return {
                                label: seg.substring(0, dashIdx).trim(),
                                text: seg
                                  .substring(dashIdx + 3)
                                  .trim()
                                  .replace(/^—\s*/, ""),
                              };
                            const spaceIdx = seg.indexOf(" ");
                            return {
                              label: seg.substring(0, spaceIdx).trim(),
                              text: seg
                                .substring(spaceIdx + 1)
                                .trim()
                                .replace(/^—\s*/, ""),
                            };
                          });

                        const actions = segments.filter(
                          (s) => s.label !== "URGENCY_LEVEL",
                        );
                        // Only show segments whose action type hasn't been completed
                        const visibleActions = actions.filter((seg) =>
                          patient.actions.some((a) => a.type === seg.label),
                        );

                        return (
                          <div className="flex flex-col gap-4 pt-1 border-b border-slate-50">
                            {visibleActions.map((seg, i) => (
                              <div key={i} className="flex flex-col gap-1.5">
                                <button
                                  onClick={() =>
                                    setActiveModal({ type: seg.label, patient })
                                  }
                                  className={`self-start text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-gradient-to-r ${cfg.gradient} text-white shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap`}
                                >
                                  {seg.label.replace(/_/g, " ")}
                                </button>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                  {seg.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* ── End Care Priority Analysis ── */}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
            <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10">
                <div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">
                    System Performance
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">
                    This week — incidents & missed medications
                  </p>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-100 flex gap-1">
                  {[
                    { key: "both", label: "Both" },
                    { key: "incidents", label: "Incidents" },
                    { key: "emar", label: "Missed EMAR" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setChartMetric(key)}
                      className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                        chartMetric === key
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 relative z-10">
                  <Activity
                    size={60}
                    className="mb-4 opacity-10 animate-pulse"
                  />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    Loading...
                  </p>
                </div>
              ) : (
                <div className="relative z-10">
                  <DualTrendChart
                    incidentData={trendData}
                    emarData={emarTrendData}
                    metric={chartMetric}
                  />
                </div>
              )}
            </div>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 flex flex-col">
              <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-8">
                Shift Metrics
              </h3>
              {loading ? (
                <div className="space-y-4 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-slate-100 rounded-3xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6 flex-1">
                  <StaffRow
                    dot="bg-emerald-500"
                    ringColor="ring-emerald-100"
                    label="On Shift"
                    sublabel="Active"
                    value={staffStatus.active}
                  />
                  <StaffRow
                    dot="bg-amber-500"
                    ringColor="ring-amber-100"
                    label="On Break"
                    sublabel="Inactive"
                    value={staffStatus.break}
                  />
                  <StaffRow
                    dot="bg-slate-400"
                    ringColor="ring-slate-100"
                    label="Off Duty"
                    sublabel="Standby"
                    value={staffStatus.scheduled}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10">
            <AlertCard
              icon={<Clock size={26} className="text-rose-600" />}
              iconBg="bg-rose-50"
              severity="CRITICAL"
              severityColor="text-rose-600"
              cardBg="bg-white"
              borderColor="border-rose-100"
              value={loading ? "—" : overdueTasks}
              onCta={() => setShowOverdueModal(true)}
              valueColor="text-rose-600"
              label="Overdue Tasks"
              gradient="from-rose-500 to-red-600"
            />

            <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl shadow-slate-200 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all" />
              {loading ? (
                <div className="space-y-4 relative z-10">
                  <div className="h-24 bg-white/10 rounded-[24px] animate-pulse" />
                  <div className="h-32 bg-white/10 rounded-[24px] animate-pulse" />
                </div>
              ) : !latestHandover ? (
                <div className="flex flex-col items-center justify-center py-16 text-center relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center mb-4">
                    <FileText size={28} className="text-white/30" />
                  </div>
                  <p className="text-lg font-black text-white/60 tracking-tight">
                    No handover notes yet
                  </p>
                  <p className="text-sm text-white/40 font-medium mt-2">
                    Once submitted, it will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[24px]">
                        <Calendar size={28} className="text-blue-400" />
                      </div>
                      <div className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/40">
                        Current Shift: {shiftLabel}
                      </div>
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight">
                      Shift Briefing
                    </h3>
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 relative mb-6">
                      <div className="absolute -top-3 left-8 px-3 py-1 bg-slate-800 text-[10px] font-black text-blue-400 uppercase tracking-widest rounded-lg border border-white/5">
                        Critical Directive
                      </div>
                      <p className="text-slate-300 text-lg leading-relaxed italic font-medium">
                        {latestHandover.notes
                          ? latestHandover.notes.length > 120
                            ? latestHandover.notes.slice(0, 120) + "..."
                            : latestHandover.notes
                          : "No general observations recorded."}
                        "
                      </p>
                    </div>
                    {handoverEntries.length > 0 && (
                      <div className="flex items-center gap-3 mb-8">
                        <div className="flex -space-x-2">
                          {handoverEntries.slice(0, 3).map((entry, i) => {
                            const p = handoverPatients[entry.patient_id];
                            return (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-rose-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white"
                              >
                                {p?.full_name?.charAt(0) || "?"}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm text-slate-400 font-medium">
                          <span className="font-black text-rose-400">
                            {handoverEntries.length}
                          </span>{" "}
                          resident{handoverEntries.length !== 1 ? "s" : ""}{" "}
                          flagged
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowHandoverModal(true)}
                    className="relative z-10 w-full py-5 bg-white text-slate-900 font-black text-sm uppercase tracking-widest rounded-[24px] shadow-2xl flex items-center justify-center gap-4 transition-all hover:bg-blue-50 active:scale-95"
                  >
                    Review Handover Protocol
                    <ArrowUpRight
                      size={22}
                      strokeWidth={3}
                      className="text-blue-600"
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {showHandoverModal && latestHandover && (
        <HandoverModal
          handover={latestHandover}
          entries={handoverEntries}
          patients={handoverPatients}
          author={handoverAuthor}
          onClose={() => setShowHandoverModal(false)}
        />
      )}
      {showOverdueModal && (
        <OverdueModal onClose={() => setShowOverdueModal(false)} />
      )}

      {/* ── Action Modals ── */}
      {activeModal?.type === "MAKE_REPORT" && (
        <MakeReportModal
          patient={activeModal.patient}
          onClose={() => setActiveModal(null)}
          onCompleted={() => {
            handleActionCompleted(
              activeModal.patient.patient_id,
              "MAKE_REPORT",
            );
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "MAKE_SCHEDULE" && (
        <MakeScheduleModal
          patient={activeModal.patient}
          onClose={() => setActiveModal(null)}
          onCompleted={() => {
            handleActionCompleted(
              activeModal.patient.patient_id,
              "MAKE_SCHEDULE",
            );
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "REASSIGN_EMAR" && (
        <ReassignEmarModal
          patient={activeModal.patient}
          onClose={() => setActiveModal(null)}
          onCompleted={() => {
            handleActionCompleted(
              activeModal.patient.patient_id,
              "REASSIGN_EMAR",
            );
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "CONTACT_FAMILY" && (
        <ContactFamilyModal
          patient={activeModal.patient}
          onClose={() => setActiveModal(null)}
          onCompleted={() => {
            handleActionCompleted(
              activeModal.patient.patient_id,
              "CONTACT_FAMILY",
            );
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "REVIEW_EMAR_PLAN" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-2xl">
            <p className="font-black text-slate-900 text-xl mb-2">
              Review EMAR Plan
            </p>
            <p className="text-slate-400 text-sm mb-6">Coming soon</p>
            <button
              onClick={() => setActiveModal(null)}
              className="px-6 py-3 bg-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
      >
        <div className="flex items-center gap-3 bg-white border border-emerald-100 shadow-2xl shadow-emerald-100 rounded-2xl px-5 py-4">
          <div className="w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={14} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {toast}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Handover Modal ─────────────────────────────────────────────── */
function HandoverModal({ handover, entries, patients, author, onClose }) {
  const shiftLabel = handover.shift_type === "AM->PM" ? "AM to PM" : "PM to AM";
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Shift Handover
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {new Date(handover.created_at).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8">
          <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[24px]">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
              {author?.full_name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base tracking-tight">
                {author?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-slate-400 capitalize font-medium">
                {author?.role || "Staff"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-black text-blue-400 uppercase tracking-widest">
                {shiftLabel} Transition
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {new Date(handover.created_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                <FileText size={18} className="text-blue-600" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                General Observations
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6">
              <p className="text-base text-slate-700 leading-relaxed font-medium">
                {handover.notes || (
                  <span className="italic text-slate-400">
                    No general observations recorded.
                  </span>
                )}
              </p>
            </div>
          </div>
          {entries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={18} className="text-rose-600" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Resident Red Flags
                  </p>
                </div>
                <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full">
                  {entries.length} flagged
                </span>
              </div>
              <div className="space-y-4">
                {entries.map((entry) => {
                  const patient = patients[entry.patient_id];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-6 bg-rose-50 border border-rose-200 rounded-[24px]"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-base font-black text-rose-600 flex-shrink-0">
                        {patient?.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-black text-rose-700 tracking-tight">
                            {patient?.full_name || "Unknown Resident"}
                          </p>
                          <span className="text-xs text-rose-500 bg-rose-100 px-2.5 py-1 rounded-full font-bold">
                            Room {patient?.room || "—"}
                          </span>
                          {patient?.wing && (
                            <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">
                              {patient.wing}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-rose-700 leading-relaxed font-medium">
                          {entry.patient_notes || (
                            <span className="italic text-rose-400">
                              No specific notes
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="px-10 py-8 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Pill Stat ──────────────────────────────────────────────────── */
function PillStat({ icon, iconBg, label, value }) {
  return (
    <div className="bg-white px-5 py-4 rounded-[32px] border border-slate-100 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} shadow-inner`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Alert Card ─────────────────────────────────────────────────── */
function AlertCard({
  icon,
  iconBg,
  severity,
  severityColor,
  cardBg,
  borderColor,
  value,
  valueColor,
  label,
  gradient,
  onCta,
}) {
  return (
    <div
      className={`group p-8 rounded-[32px] border shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden ${cardBg} ${borderColor} hover:scale-[1.02]`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-2xl rounded-full -mr-16 -mt-16`}
      />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div
          className={`p-4 ${iconBg} rounded-2xl shadow-sm ring-1 ring-white`}
        >
          {icon}
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${iconBg} ${severityColor}`}
        >
          {severity}
        </span>
      </div>
      <div className="relative z-10">
        <h3
          className={`text-6xl font-black mb-2 tracking-tighter ${valueColor}`}
        >
          {value}
        </h3>
        <p className="text-slate-600 font-bold text-lg mb-8 tracking-tight">
          {label}
        </p>
        <button
          onClick={onCta}
          className="w-full py-4 bg-slate-900 text-white hover:bg-slate-800 text-sm font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest"
        >
          <ArrowUpRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/* ─── Staff Row ──────────────────────────────────────────────────── */
function StaffRow({ dot, ringColor, label, sublabel, value }) {
  return (
    <div className="group p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 rounded-3xl transition-all cursor-default">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${dot} ring-4 ${ringColor}`} />
          <div>
            <p className="font-black text-sm text-slate-900 uppercase tracking-tight">
              {label}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {sublabel}
            </p>
          </div>
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}

/* ─── Make Report Modal ──────────────────────────────────────────── */
function MakeReportModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const reasoning = patient.reasoning
    ?.split(
      /(?=MAKE_SCHEDULE|MAKE_REPORT|REASSIGN_EMAR|REVIEW_EMAR_PLAN|CONTACT_FAMILY|URGENCY_LEVEL)/,
    )
    .find((s) => s.startsWith("MAKE_REPORT"))
    ?.replace(/^MAKE_REPORT\s*[-—]?\s*/i, "")
    ?.trim();

  const [formData, setFormData] = useState({
    title: `Care Report — ${patient.patient_name}`,
    type: "falls",
    content: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setError("Title and content are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from("reports").insert({
        patient_id: patient.patient_id,
        created_by: MANAGER_ID,
        title: formData.title,
        type: formData.type,
        content: formData.content,
        date: formData.date,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      onCompleted();
    } catch (err) {
      setError(err.message || "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const [generating, setGenerating] = useState(false);

  const handleGenerateContent = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_name: patient.patient_name, reasoning }),
      });
      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          content: data.content || "",
        }));
      }
    } catch (err) {
      console.error("Failed to generate content:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ring-1 ring-blue-100">
              <FileText size={12} />
              New Report
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Make Report
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {patient.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-10 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Generate Button */}
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-200"
            >
              {generating ? (
                <>
                  <Activity size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> AI Generate Content
                </>
              )}
            </button>

            {/* Title */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>

            {/* Type + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="falls">Falls</option>
                  <option value="medication">Medication</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Report Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className={`${inputClass} resize-none`}
                rows={7}
                placeholder="Describe the clinical observations, incidents or concerns..."
                required
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <p className="text-sm text-rose-600 font-bold">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
              >
                {saving ? "Saving..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Make Schedule Modal ────────────────────────────────────────── */
function MakeScheduleModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [carers, setCarers] = useState([]);
  const [loadingCarers, setLoadingCarers] = useState(true);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const defaultStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`;
  const defaultEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T10:00`;

  const [formData, setFormData] = useState({
    title: `Care Visit — ${patient.patient_name}`,
    carer_id: "",
    start_at: defaultStart,
    end_at: defaultEnd,
    status: "scheduled",
  });

  useEffect(() => {
    const fetchCarers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "carer")
        .order("full_name");
      setCarers(data || []);
      setLoadingCarers(false);
    };
    fetchCarers();
  }, []);

  const handleAddTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTasks((prev) => [...prev, trimmed]);
    setTaskInput("");
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.carer_id ||
      !formData.start_at ||
      !formData.end_at
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      setError("End time must be after start time.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from("schedules").insert({
        title: formData.title,
        patient_id: patient.patient_id,
        carer_id: formData.carer_id,
        start_at: formData.start_at,
        end_at: formData.end_at,
        status: formData.status,
        created_by: MANAGER_ID,
        required_tasks: tasks.length > 0 ? JSON.stringify(tasks) : null,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      onCompleted();
    } catch (err) {
      setError(err.message || "Failed to create schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ring-1 ring-emerald-100">
              <Calendar size={12} />
              New Schedule
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Make Schedule
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {patient.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-10 py-8">
          {loadingCarers ? (
            <div className="flex items-center justify-center py-20">
              <Activity size={40} className="animate-pulse opacity-20" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Reasoning Banner */}
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles
                  size={16}
                  className="text-purple-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-purple-700 font-medium leading-relaxed">
                  {patient.reasoning
                    ?.split(
                      /(?=MAKE_SCHEDULE|MAKE_REPORT|REASSIGN_EMAR|REVIEW_EMAR_PLAN|CONTACT_FAMILY|URGENCY_LEVEL)/,
                    )
                    .find((s) => s.startsWith("MAKE_SCHEDULE"))
                    ?.replace(/^MAKE_SCHEDULE\s*[-—]?\s*/i, "")
                    ?.trim() ||
                    "Schedule a visit for this patient based on the AI analysis."}
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>

              {/* Carer */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Assign Carer *
                </label>
                <select
                  value={formData.carer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, carer_id: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select a carer</option>
                  {carers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start + End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) =>
                      setFormData({ ...formData, start_at: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) =>
                      setFormData({ ...formData, end_at: e.target.value })
                    }
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Required Tasks */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Required Tasks
                  <span className="ml-2 text-xs text-slate-400 font-normal normal-case tracking-normal">
                    (optional — press Enter or + to add)
                  </span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTask();
                      }
                    }}
                    className={`${inputClass} flex-1`}
                    placeholder="e.g. Check blood pressure"
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!taskInput.trim()}
                    className="px-6 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-black text-lg disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                          <span className="text-sm text-slate-900 font-medium">
                            {task}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(i)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-medium">
                    No tasks added yet
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <p className="text-sm text-rose-600 font-bold">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                >
                  {saving ? "Saving..." : "Create Schedule"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reassign EMAR Modal ────────────────────────────────────────── */
function ReassignEmarModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track which missed meds the manager is reassigning: set of emar row ids
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    const fetchMeds = async () => {
      const { data } = await supabase
        .from("emar")
        .select("id, medication_name, medication_mg, time_to_take, status")
        .eq("patient_id", patient.patient_id);
      const all = data || [];
      const missed = all.filter(
        (m) => m.status === "missed" || m.status === "skipped",
      );
      setMedications(missed);
      // Pre-select all missed by default
      setSelected(new Set(missed.map((m) => m.id)));
      setLoading(false);
    };
    fetchMeds();
  }, []);

  const toggleMed = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) {
      setError("Select at least one medication to reassign.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      // Update selected missed meds back to "due" so they appear as pending again
      const { error: updateError } = await supabase
        .from("emar")
        .update({ status: "due" })
        .in("id", [...selected]);
      if (updateError) throw updateError;
      onCompleted();
    } catch (err) {
      setError(err.message || "Failed to reassign medications.");
    } finally {
      setSaving(false);
    }
  };

  // Extract AI reasoning for this action
  const reasoning = patient.reasoning
    ?.split(
      /(?=MAKE_SCHEDULE|MAKE_REPORT|REASSIGN_EMAR|REVIEW_EMAR_PLAN|CONTACT_FAMILY|URGENCY_LEVEL)/,
    )
    .find((s) => s.startsWith("REASSIGN_EMAR"))
    ?.replace(/^REASSIGN_EMAR\s*[-—]?\s*/i, "")
    ?.trim();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ring-1 ring-amber-100">
              <AlertCircle size={12} />
              EMAR
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Reassign Medications
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {patient.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-10 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Activity size={40} className="animate-pulse opacity-20" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Reasoning Banner */}
              {reasoning && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles
                    size={16}
                    className="text-purple-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-xs text-purple-700 font-medium leading-relaxed">
                    {reasoning}
                  </p>
                </div>
              )}

              {/* Missed medications list */}
              {medications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle size={40} className="text-emerald-400 mb-3" />
                  <p className="font-black text-slate-900 text-base">
                    No missed medications found
                  </p>
                  <p className="text-sm text-slate-400 font-medium mt-1">
                    The EMAR record may have already been updated.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                      Missed Medications — select to reassign
                    </p>
                    <div className="space-y-3">
                      {medications.map((med) => {
                        const isSelected = selected.has(med.id);
                        return (
                          <button
                            type="button"
                            key={med.id}
                            onClick={() => toggleMed(med.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                              isSelected
                                ? "border-amber-400 bg-amber-50"
                                : "border-slate-100 bg-slate-50 hover:border-slate-200"
                            }`}
                          >
                            {/* Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected
                                  ? "border-amber-500 bg-amber-500"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && (
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
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 text-sm tracking-tight">
                                {med.medication_name}
                                {med.medication_mg && (
                                  <span className="ml-2 text-xs font-bold text-slate-400">
                                    {med.medication_mg}mg
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Scheduled: {med.time_to_take || "—"}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                med.status === "missed"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {med.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* What happens note */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Selected medications will be marked as{" "}
                      <span className="font-black text-slate-700">due</span>,
                      making them visible to carers as pending administration
                      tasks.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <p className="text-sm text-rose-600 font-bold">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                {medications.length > 0 && (
                  <button
                    type="submit"
                    disabled={saving || selected.size === 0}
                    className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                  >
                    {saving
                      ? "Saving..."
                      : `Reassign ${selected.size} Med${selected.size !== 1 ? "s" : ""}`}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Family Modal ───────────────────────────────────────── */
function ContactFamilyModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [familyMember, setFamilyMember] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [emailData, setEmailData] = useState({
    subject: `Update regarding ${patient.patient_name} — Greenview Care Home`,
    body: "",
  });

  useEffect(() => {
    const fetchFamily = async () => {
      // Get first family member linked to this patient
      const { data: linkData } = await supabase
        .from("patient_family")
        .select("family_id, relationship")
        .eq("patient_id", patient.patient_id)
        .limit(1)
        .single();

      if (!linkData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", linkData.family_id)
        .single();

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setFamilyMember({ ...profileData, relationship: linkData.relationship });
      setLoading(false);
    };
    fetchFamily();
  }, []);

  const [generating, setGenerating] = useState(false);

  const reasoning = patient.reasoning
    ?.split(
      /(?=MAKE_SCHEDULE|MAKE_REPORT|REASSIGN_EMAR|REVIEW_EMAR_PLAN|CONTACT_FAMILY|URGENCY_LEVEL)/,
    )
    .find((s) => s.startsWith("CONTACT_FAMILY"))
    ?.replace(/^CONTACT_FAMILY\s*[-—]?\s*/i, "")
    ?.trim();

  const handleGenerateEmail = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patient.patient_name,
          family_name: familyMember.full_name,
          reasoning,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailData({
          subject: data.subject || emailData.subject,
          body: data.body || "",
        });
      }
    } catch (err) {
      console.error("Failed to generate email:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenMailto = () => {
    const mailto = `mailto:${familyMember.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailto, "_blank");
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ring-1 ring-blue-100">
              <Users size={12} />
              Family Contact
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Contact Family
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {patient.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-10 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Activity size={40} className="animate-pulse opacity-20" />
            </div>
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={40} className="text-amber-400 mb-3" />
              <p className="font-black text-slate-900 text-base">
                No family member found
              </p>
              <p className="text-sm text-slate-400 font-medium mt-1">
                No family contact is linked to this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Family member card */}
              <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {familyMember.full_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-base tracking-tight">
                    {familyMember.full_name}
                  </p>
                  <p className="text-xs text-slate-400 font-medium capitalize mt-0.5">
                    {familyMember.relationship || "Family"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    {familyMember.email}
                  </p>
                </div>
              </div>

              {/* AI Generate Button */}
              <button
                type="button"
                onClick={handleGenerateEmail}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-200"
              >
                {generating ? (
                  <>
                    <Activity size={14} className="animate-spin" />{" "}
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> AI Generate Content
                  </>
                )}
              </button>

              {/* Subject */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) =>
                    setEmailData({ ...emailData, subject: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Message
                </label>
                <textarea
                  value={emailData.body}
                  onChange={(e) =>
                    setEmailData({ ...emailData, body: e.target.value })
                  }
                  className={`${inputClass} resize-none`}
                  rows={10}
                />
              </div>

              {/* Info note */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Clicking{" "}
                  <span className="font-black text-slate-700">
                    Open in Mail
                  </span>{" "}
                  will open your default mail client with this email pre-filled.
                  After sending, click{" "}
                  <span className="font-black text-slate-700">
                    Mark as Done
                  </span>{" "}
                  to complete this action.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Open in Mail
                </button>
                <button
                  type="button"
                  onClick={onCompleted}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Mark as Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverdueModal({ onClose }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [overdueSchedules, setOverdueSchedules] = useState([]);
  const [missedEmars, setMissedEmars] = useState([]);
  const [patients, setPatients] = useState({});

  useEffect(() => {
    const fetchOverdue = async () => {
      const now = new Date().toISOString();

      // Fetch overdue schedules
      const { data: schedules } = await supabase
        .from("schedules")
        .select("id, title, patient_id, carer_id, start_at, end_at, status, required_tasks")
        .in("status", ["scheduled", "pending"])
        .lt("end_at", now)
        .order("end_at", { ascending: true });

      // Fetch missed EMAR
      const { data: emars } = await supabase
        .from("emar")
        .select("id, patient_id, medication_name, medication_mg, time_to_take, status")
        .eq("status", "missed")
        .order("time_to_take", { ascending: true });

      const allSchedules = schedules || [];
      const allEmars = emars || [];

      // Collect all patient IDs
      const patientIds = [
        ...new Set([
          ...allSchedules.map((s) => s.patient_id),
          ...allEmars.map((e) => e.patient_id),
        ].filter(Boolean)),
      ];

      if (patientIds.length > 0) {
        const { data: pats } = await supabase
          .from("patients")
          .select("id, full_name, room, wing")
          .in("id", patientIds);
        const map = {};
        (pats || []).forEach((p) => (map[p.id] = p));
        setPatients(map);
      }

      setOverdueSchedules(allSchedules);
      setMissedEmars(allEmars);
      setLoading(false);
    };

    fetchOverdue();
  }, []);

  const formatOverdue = (endAt) => {
    const diff = Math.floor((new Date() - new Date(endAt)) / 60000); // minutes
    if (diff < 60) return `${diff}m overdue`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h overdue`;
    return `${Math.floor(diff / 1440)}d overdue`;
  };

  const totalCount = overdueSchedules.length + missedEmars.length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ring-1 ring-rose-100">
              <Clock size={12} />
              Requires Attention
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Overdue Tasks
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {totalCount} item{totalCount !== 1 ? "s" : ""} requiring immediate action
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Activity size={40} className="animate-pulse opacity-20" />
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle size={48} className="text-emerald-400 mb-4" />
              <p className="font-black text-xl text-slate-900 tracking-tight mb-1">
                All clear
              </p>
              <p className="text-sm text-slate-400 font-medium">
                No overdue schedules or missed medications
              </p>
            </div>
          ) : (
            <>
              {/* Overdue Schedules */}
              {overdueSchedules.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Overdue Schedules
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {overdueSchedules.length} visit{overdueSchedules.length !== 1 ? "s" : ""} not completed
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {overdueSchedules.map((schedule) => {
                      const patient = patients[schedule.patient_id];
                      const tasks = (() => {
                        try { return JSON.parse(schedule.required_tasks || "[]"); }
                        catch { return []; }
                      })();
                      return (
                        <div
                          key={schedule.id}
                          className="p-5 bg-rose-50 border border-rose-100 rounded-2xl"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-sm font-black text-rose-600 flex-shrink-0">
                                {patient?.full_name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm tracking-tight">
                                  {patient?.full_name || "Unknown Patient"}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                  {schedule.title}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-100 text-rose-600">
                                {formatOverdue(schedule.end_at)}
                              </span>
                              {patient?.room && (
                                <p className="text-xs text-slate-400 font-medium mt-1">
                                  Room {patient.room}
                                  {patient.wing ? ` · ${patient.wing}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                            <span>
                              Due:{" "}
                              <span className="font-black text-slate-700">
                                {new Date(schedule.end_at).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short",
                                })}{" "}
                                {new Date(schedule.end_at).toLocaleTimeString("en-GB", {
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </span>
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-black text-[10px] uppercase tracking-widest">
                              {schedule.status}
                            </span>
                          </div>
                          {tasks.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-rose-100 flex flex-wrap gap-2">
                              {tasks.map((task, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg"
                                >
                                  {task}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missed EMAR */}
              {missedEmars.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Missed Medications
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {missedEmars.length} dose{missedEmars.length !== 1 ? "s" : ""} not administered
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {missedEmars.map((emar) => {
                      const patient = patients[emar.patient_id];
                      return (
                        <div
                          key={emar.id}
                          className="flex items-center gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl"
                        >
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-sm font-black text-amber-600 flex-shrink-0">
                            {patient?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm tracking-tight">
                              {patient?.full_name || "Unknown Patient"}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {emar.medication_name}
                              {emar.medication_mg ? ` · ${emar.medication_mg}mg` : ""}
                              {emar.time_to_take ? ` · ${emar.time_to_take}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                            Missed
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DualTrendChart({ incidentData, emarData, metric }) {
  const [tooltip, setTooltip] = useState(null);

  const data = incidentData;
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-300">
        <Activity size={60} className="mb-4 opacity-10" />
        <p className="font-black text-lg text-slate-900 tracking-tight">
          Not enough data yet
        </p>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Check back after more activity
        </p>
      </div>
    );
  }

  const W = 600,
    H = 260,
    padL = 44,
    padR = 20,
    padT = 24,
    padB = 44;

  const allValues = [
    ...(metric !== "emar" ? incidentData.map((d) => d.count) : []),
    ...(metric !== "incidents" ? emarData.map((d) => d.count) : []),
    1,
  ];
  const maxVal = Math.max(...allValues);

  const xScale = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yScale = (v) => padT + ((maxVal - v) / maxVal) * (H - padT - padB);

  const buildPath = (series) => {
    const pts = series.map((d, i) => ({ x: xScale(i), y: yScale(d.count) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1],
        curr = pts[i],
        cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return { path: d, pts };
  };

  const buildFill = (pathD, pts) =>
    pathD +
    ` L ${pts[pts.length - 1].x} ${H - padB} L ${pts[0].x} ${H - padB} Z`;

  const inc = buildPath(incidentData);
  const emar = buildPath(emarData);
  const yLabels = [0, 2, 4, 6, 8];
  const handleMouseMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * W;
    const step = (W - padL - padR) / (data.length - 1);
    const clamped = Math.max(
      0,
      Math.min(data.length - 1, Math.round((rawX - padL) / step)),
    );
    setTooltip({
      idx: clamped,
      x: xScale(clamped),
      day: data[clamped].day,
      incidents: incidentData[clamped].count,
      emar: emarData[clamped].count,
    });
  };

  return (
    <div className="w-full relative">
      <div className="flex items-center gap-6 mb-5">
        {metric !== "emar" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Incidents
            </span>
          </div>
        )}
        {metric !== "incidents" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Missed EMAR
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: "320px", height: "260px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="emarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>

          {yLabels.map((v) => (
            <g key={v}>
              <line
                x1={padL}
                y1={yScale(v)}
                x2={W - padR}
                y2={yScale(v)}
                stroke="#f1f5f9"
                strokeWidth="1.5"
              />
              <text
                x={padL - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="700"
              >
                {v}
              </text>
            </g>
          ))}

          {metric !== "emar" && (
            <>
              <path d={buildFill(inc.path, inc.pts)} fill="url(#incGrad)" />
              <path
                d={inc.path}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {metric !== "incidents" && (
            <>
              <path d={buildFill(emar.path, emar.pts)} fill="url(#emarGrad)" />
              <path
                d={emar.path}
                fill="none"
                stroke="#f87171"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(i)}
              y={H - 12}
              textAnchor="middle"
              fontSize="11"
              fill="#94a3b8"
              fontWeight="700"
            >
              {d.day}
            </text>
          ))}

          {tooltip && (
            <>
              <line
                x1={tooltip.x}
                y1={padT}
                x2={tooltip.x}
                y2={H - padB}
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              {metric !== "emar" && (
                <circle
                  cx={tooltip.x}
                  cy={inc.pts[tooltip.idx].y}
                  r="5"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
              )}
              {metric !== "incidents" && (
                <circle
                  cx={tooltip.x}
                  cy={emar.pts[tooltip.idx].y}
                  r="5"
                  fill="white"
                  stroke="#f87171"
                  strokeWidth="3"
                />
              )}
            </>
          )}
        </svg>

        {tooltip && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${(tooltip.x / W) * 100}%`,
              top: `${
                (Math.min(
                  metric !== "emar" ? inc.pts[tooltip.idx].y : 9999,
                  metric !== "incidents" ? emar.pts[tooltip.idx].y : 9999,
                ) /
                  H) *
                100
              }%`,
              transform: "translate(-50%, -115%)",
            }}
          >
            <div className="bg-white border border-slate-100 shadow-xl rounded-2xl px-4 py-3 min-w-[140px]">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {tooltip.day}
              </p>
              {metric !== "emar" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">
                    Incidents
                  </span>
                  <span className="text-xs font-black text-slate-900 ml-auto">
                    {tooltip.incidents}
                  </span>
                </div>
              )}
              {metric !== "incidents" && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">
                    Missed EMAR
                  </span>
                  <span className="text-xs font-black text-slate-900 ml-auto">
                    {tooltip.emar}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
