"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CarePriorityAnalysis from "./CarePriorityAnalysis";

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
  ArrowRight,
  User,
} from "lucide-react";

const MANAGER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

export default function ManagerDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState(null);
  const [priorityList, setPriorityList] = useState([]);
  const [completedActions, setCompletedActions] = useState(new Set());
  const [activeModal, setActiveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [analysisSectionOpen, setAnalysisSectionOpen] = useState(true);

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
    loadLatestAnalysis();
  }, []);

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
      const completedSet = await fetchCompletedActions();
      const filtered = filterCompletedFromList(list, completedSet);
      setPriorityList(filtered);
      setCompletedActions(completedSet);
    } catch (err) {
      console.error("Failed to load analysis session:", err);
    }
  };

  const fetchCompletedActions = async () => {
    const { data, error } = await supabase
      .from("completed_care_actions")
      .select("patient_id, action_type");

    if (error || !data) return new Set();
    return new Set(data.map((r) => `${r.patient_id}::${r.action_type}`));
  };

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

        await supabase.from("care_analysis_sessions").insert({
          created_by: MANAGER_ID,
          created_at: new Date().toISOString(),
          priority_list: rawList,
        });

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
      glow: "bg-red-50",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 border-red-200",
      label: "Immediate",
      border: "border-red-100",
    },
    THIS_SHIFT: {
      gradient: "from-amber-500 to-orange-600",
      glow: "bg-amber-50",
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "This Shift",
      border: "border-amber-100",
    },
    THIS_WEEK: {
      gradient: "from-emerald-500 to-teal-600",
      glow: "bg-emerald-50",
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "This Week",
      border: "border-emerald-100",
    },
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50"
      >
        <div className="container mx-auto px-6 lg:px-10 pt-12 pb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
              <div>
                <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">
                  Dashboard
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Operational Hub for{" "}
                  <span className="text-slate-900 font-semibold">
                    North Senior Care
                  </span>
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-wrap gap-3"
              >
                <PillStat
                  icon={<Users size={18} className="text-emerald-600" />}
                  iconBg="bg-gradient-to-br from-emerald-50 to-teal-50"
                  label="Occupancy"
                  value={loading ? "—" : `${occupancy}/50`}
                />
                <PillStat
                  icon={<TrendingUp size={18} className="text-blue-600" />}
                  iconBg="bg-gradient-to-br from-blue-50 to-indigo-50"
                  label="Staff Ratio"
                  value={loading ? "—" : staffRatio}
                />
              </motion.div>
            </div>
          </motion.div>

          <CarePriorityAnalysis
            analysisSectionOpen={analysisSectionOpen}
            setAnalysisSectionOpen={setAnalysisSectionOpen}
            generatePriorityAnalysis={generatePriorityAnalysis}
            loadingAnalysis={loadingAnalysis}
            error={error}
            priorityList={priorityList}
            urgencyConfig={urgencyConfig}
            getInitials={getInitials}
            setActiveModal={setActiveModal}
          />

          {/* Charts Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          >
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/50 p-8 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-blue-400/5 to-indigo-400/5 blur-3xl rounded-full pointer-events-none" />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-10 relative z-10">
                <div>
                  <h3 className="font-bold text-xl text-slate-900 tracking-tight mb-1">
                    System Performance
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">
                    This week — incidents & missed medications
                  </p>
                </div>
                <div className="bg-slate-50/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 flex gap-1">
                  {[
                    { key: "both", label: "Both" },
                    { key: "incidents", label: "Incidents" },
                    { key: "emar", label: "Missed EMAR" },
                  ].map(({ key, label }) => (
                    <motion.button
                      key={key}
                      onClick={() => setChartMetric(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        chartMetric === key
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative z-10">
                <DualTrendChart
                  incidentData={trendData}
                  emarData={emarTrendData}
                  metric={chartMetric}
                />
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-lg shadow-slate-200/50 p-8 flex flex-col">
              <h3 className="font-bold text-xl text-slate-900 tracking-tight mb-8">
                Shift Metrics
              </h3>
              {loading ? (
                <div className="space-y-4 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-20 bg-slate-50 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4 flex-1"
                >
                  <motion.div variants={itemVariants}>
                    <StaffRow
                      dot="bg-emerald-500"
                      ringColor="bg-emerald-50"
                      label="On Shift"
                      sublabel="Active"
                      value={staffStatus.active}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StaffRow
                      dot="bg-amber-500"
                      ringColor="bg-amber-50"
                      label="On Break"
                      sublabel="Inactive"
                      value={staffStatus.break}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <StaffRow
                      dot="bg-slate-400"
                      ringColor="bg-slate-50"
                      label="Off Duty"
                      sublabel="Standby"
                      value={staffStatus.scheduled}
                    />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Bottom Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12"
          >
            <div className="lg:max-w-xl">
              {" "}
              {/* 👈 constrain the width */}
              <AlertCard
                icon={<Clock size={24} className="text-rose-600" />}
                iconBg="bg-gradient-to-br from-rose-50 to-red-50"
                severity="CRITICAL"
                severityColor="text-rose-700"
                cardBg="bg-white"
                borderColor="border-rose-200/60"
                value={loading ? "—" : overdueTasks}
                onCta={() => setShowOverdueModal(true)}
                valueColor="text-rose-600"
                label="Overdue Tasks"
                gradient="from-rose-500 to-red-600"
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-xl shadow-slate-900/20 flex flex-col justify-between relative overflow-hidden group border border-slate-800/50"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-3xl rounded-full"
              />
              {loading ? (
                <div className="space-y-5 relative z-10">
                  <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                  <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
                </div>
              ) : !latestHandover ? (
                <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                    <FileText size={28} className="text-white/30" />
                  </div>
                  <p className="text-lg font-semibold text-white/80 mb-2">
                    No handover notes yet
                  </p>
                  <p className="text-sm text-white/50 font-medium">
                    Once submitted, it will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-3.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl"
                      >
                        <Calendar size={26} className="text-blue-400" />
                      </motion.div>
                      <div className="px-4 py-2 bg-blue-600 text-white text-[10px] font-semibold uppercase tracking-wider rounded-full shadow-lg shadow-blue-500/30">
                        Current Shift: {shiftLabel}
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold mb-5 tracking-tight">
                      Shift Briefing
                    </h3>
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 relative mb-6">
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-slate-800 text-[10px] font-semibold text-blue-400 uppercase tracking-wider rounded-lg border border-white/10">
                        Critical Directive
                      </div>
                      <p className="text-slate-200 text-base leading-relaxed italic font-normal mt-2">
                        "
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
                        <div className="flex -space-x-2.5">
                          {handoverEntries.slice(0, 3).map((entry, i) => {
                            const p = handoverPatients[entry.patient_id];
                            return (
                              <div
                                key={i}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-slate-900 flex items-center justify-center text-[11px] font-bold text-white shadow-lg"
                              >
                                {p?.full_name?.charAt(0) || "?"}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm text-slate-300 font-medium">
                          <span className="font-bold text-rose-300">
                            {handoverEntries.length}
                          </span>{" "}
                          resident{handoverEntries.length !== 1 ? "s" : ""}{" "}
                          flagged
                        </p>
                      </div>
                    )}
                  </div>
                  <motion.button
                    onClick={() => setShowHandoverModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative z-10 w-full py-4 bg-white text-slate-900 font-semibold text-sm rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-blue-50 group/btn"
                  >
                    Review Handover Protocol
                    <motion.div
                      className="text-blue-600"
                      whileHover={{ x: 2, y: -2 }}
                    >
                      <ArrowUpRight size={20} />
                    </motion.div>
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

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

      <AnimatePresence>
        {activeModal?.type === "REVIEW_EMAR_PLAN" && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalContentVariants}
              className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-6">
                <Activity size={32} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900 text-xl mb-2">
                Review EMAR Plan
              </p>
              <p className="text-slate-500 text-sm mb-8">Coming soon</p>
              <motion.button
                onClick={() => setActiveModal(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="flex items-center gap-3 bg-white border border-emerald-200/60 shadow-2xl shadow-emerald-500/20 rounded-2xl px-6 py-4 backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <CheckCircle
                  size={16}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </motion.div>
              <p className="text-sm font-semibold text-emerald-700">{toast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
    "w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm";

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
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold mb-2">
                <FileText size={12} />
                New Report
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Make Report
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {patient.patient_name}
              </p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <X size={20} className="text-slate-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* AI Generate Button */}
              <motion.button
                type="button"
                onClick={handleGenerateContent}
                disabled={generating}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                {generating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Activity size={16} />
                    </motion.div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>AI Generate Content</span>
                  </>
                )}
              </motion.button>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              {/* Type and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                  >
                    <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  {saving ? "Saving..." : "Submit Report"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
    "w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm";

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
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold mb-2">
                <Calendar size={12} />
                New Schedule
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Make Schedule
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {patient.patient_name}
              </p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <X size={20} className="text-slate-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {loadingCarers ? (
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={32} className="text-slate-300" />
                </motion.div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* AI Reasoning */}
                <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
                  <Sparkles size={16} className="text-violet-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-violet-700">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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

                {/* Tasks */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Required Tasks
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      (optional)
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
                    <motion.button
                      type="button"
                      onClick={handleAddTask}
                      disabled={!taskInput.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
                    >
                      Add
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {tasks.length > 0 && (
                      <div className="space-y-2">
                        {tasks.map((task, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3"
                          >
                            <span className="text-sm text-slate-700">{task}</span>
                            <motion.button
                              type="button"
                              onClick={() => handleRemoveTask(i)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <X size={16} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium text-sm"
                  >
                    {saving ? "Saving..." : "Create Schedule"}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Reassign EMAR Modal ────────────────────────────────────────── */
function ReassignEmarModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const reasoning = patient.reasoning
    ?.split(
      /(?=MAKE_SCHEDULE|MAKE_REPORT|REASSIGN_EMAR|REVIEW_EMAR_PLAN|CONTACT_FAMILY|URGENCY_LEVEL)/,
    )
    .find((s) => s.startsWith("REASSIGN_EMAR"))
    ?.replace(/^REASSIGN_EMAR\s*[-—]?\s*/i, "")
    ?.trim();

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold mb-2">
                <AlertCircle size={12} />
                EMAR
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Reassign Medications
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {patient.patient_name}
              </p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <X size={20} className="text-slate-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={32} className="text-slate-300" />
                </motion.div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* AI Reasoning */}
                {reasoning && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-start gap-3">
                    <Sparkles size={16} className="text-violet-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-violet-700">{reasoning}</p>
                  </div>
                )}

                {/* Empty or List */}
                {medications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <p className="font-semibold text-slate-900 mb-1">
                      No missed medications found
                    </p>
                    <p className="text-sm text-slate-500">
                      The EMAR record may have already been updated.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Missed Medications
                      </label>
                      <div className="space-y-2">
                        {medications.map((med) => {
                          const isSelected = selected.has(med.id);
                          return (
                            <motion.button
                              type="button"
                              key={med.id}
                              onClick={() => toggleMed(med.id)}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                                isSelected
                                  ? "border-amber-300 bg-amber-50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-amber-500 bg-amber-500"
                                    : "border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg width="12" height="10" viewBox="0 0 10 8" fill="none">
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
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  {med.medication_name}
                                  {med.medication_mg && (
                                    <span className="ml-2 text-sm text-slate-500">
                                      {med.medication_mg}mg
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Scheduled: {med.time_to_take || "—"}
                                </p>
                              </div>
                              <span className="text-xs font-medium px-2 py-1 rounded bg-rose-100 text-rose-700">
                                {med.status}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm text-slate-600">
                        Selected medications will be marked as{" "}
                        <span className="font-medium text-slate-900">due</span>,
                        making them visible to carers.
                      </p>
                    </div>
                  </>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                {medications.length > 0 && (
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={saving || selected.size === 0}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 font-medium text-sm"
                    >
                      {saving
                        ? "Saving..."
                        : `Reassign ${selected.size} Med${selected.size !== 1 ? "s" : ""}`}
                    </motion.button>
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Contact Family Modal ───────────────────────────────────────── */
function ContactFamilyModal({ patient, onClose, onCompleted }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [familyMember, setFamilyMember] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [emailData, setEmailData] = useState({
    subject: `Update regarding ${patient.patient_name} — Greenview Care Home`,
    body: "",
  });

  useEffect(() => {
    const fetchFamily = async () => {
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
    "w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm";

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold mb-2">
                <Users size={12} />
                Family Contact
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Contact Family
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {patient.patient_name}
              </p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <X size={20} className="text-slate-400" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-6">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={32} className="text-slate-300" />
                </motion.div>
              </div>
            ) : notFound ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-amber-600" />
                </div>
                <p className="font-semibold text-slate-900 mb-1">
                  No family member found
                </p>
                <p className="text-sm text-slate-500">
                  No family contact is linked to this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Family Card */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                    {familyMember.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {familyMember.full_name}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">
                      {familyMember.relationship || "Family"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-blue-600">
                      {familyMember.email}
                    </p>
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  type="button"
                  onClick={handleGenerateEmail}
                  disabled={generating}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {generating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Activity size={16} />
                      </motion.div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>AI Generate Content</span>
                    </>
                  )}
                </motion.button>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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

                {/* Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600">
                    Clicking <span className="font-medium">Open in Mail</span>{" "}
                    will open your default mail client. After sending, click{" "}
                    <span className="font-medium">Mark as Done</span>.
                  </p>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleOpenMailto}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Open Mail
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={onCompleted}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

      const { data: schedules } = await supabase
        .from("schedules")
        .select(
          "id, title, patient_id, carer_id, start_at, end_at, status, required_tasks",
        )
        .in("status", ["scheduled", "pending"])
        .lt("end_at", now)
        .order("end_at", { ascending: true });

      const { data: emars } = await supabase
        .from("emar")
        .select(
          "id, patient_id, medication_name, medication_mg, time_to_take, status",
        )
        .eq("status", "missed")
        .order("time_to_take", { ascending: true });

      const allSchedules = schedules || [];
      const allEmars = emars || [];

      const patientIds = [
        ...new Set(
          [
            ...allSchedules.map((s) => s.patient_id),
            ...allEmars.map((e) => e.patient_id),
          ].filter(Boolean),
        ),
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
    const diff = Math.floor((new Date() - new Date(endAt)) / 60000);
    if (diff < 60) return `${diff}m overdue`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h overdue`;
    return `${Math.floor(diff / 1440)}d overdue`;
  };

  const totalCount = overdueSchedules.length + missedEmars.length;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[90vh]"
        >
        
          {/* Content */}
          <div className="overflow-y-auto flex-1 px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Activity size={32} className="text-slate-300" />
                </motion.div>
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-lg text-slate-900 mb-1">
                  All clear
                </p>
                <p className="text-sm text-slate-500">
                  No overdue schedules or missed medications
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Overdue Schedules */}
                {overdueSchedules.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl flex items-center justify-center shadow-sm">
                        <Clock size={20} className="text-rose-600" />
                      </div>
                      <div>
                        <p className="text-xl font-black pt-2 text-slate-900 tracking-tight">
                          Overdue Schedules
                        </p>
                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest mt-0.5">
                          {overdueSchedules.length} visit
                          {overdueSchedules.length !== 1 ? "s" : ""} not
                          completed
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overdueSchedules.map((schedule) => {
                        const patient = patients[schedule.patient_id];
                        const tasks = (() => {
                          try {
                            return JSON.parse(schedule.required_tasks || "[]");
                          } catch {
                            return [];
                          }
                        })();
                        return (
                          <motion.div
                            key={schedule.id}
                            whileHover={{ y: -2 }}
                            className="group p-5 bg-white border border-rose-200 hover:border-rose-300 rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center font-semibold text-rose-900 shadow-sm">
                                  {patient?.full_name?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {patient?.full_name || "Unknown"}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {schedule.title}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                                {formatOverdue(schedule.end_at)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span>
                                  {new Date(schedule.end_at).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}{" "}
                                  {new Date(schedule.end_at).toLocaleTimeString(
                                    "en-GB",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                {patient?.room && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>
                                      Room {patient.room}
                                      {patient.wing ? ` ${patient.wing}` : ""}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {tasks.length > 0 && (
                              <div className="pt-4 border-t border-slate-100">
                                <div className="flex flex-wrap gap-1.5">
                                  {tasks.slice(0, 3).map((task, i) => (
                                    <span
                                      key={i}
                                      className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded-md"
                                    >
                                      {task}
                                    </span>
                                  ))}
                                  {tasks.length > 3 && (
                                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                      +{tasks.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Missed Medications */}
                {missedEmars.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl flex items-center justify-center shadow-sm">
                        <AlertTriangle size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xl font-black pt-5 text-slate-900 tracking-tight">
                          Missed Medications
                        </p>
                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest mt-0.5">
                          {missedEmars.length} dose
                          {missedEmars.length !== 1 ? "s" : ""} not administered
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {missedEmars.map((emar) => {
                        const patient = patients[emar.patient_id];
                        return (
                          <motion.div
                            key={emar.id}
                            whileHover={{ y: -2 }}
                            className="group flex items-center gap-4 p-5 bg-white border border-amber-200 hover:border-amber-300 rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center font-semibold text-amber-900 shadow-sm shrink-0">
                              {patient?.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 truncate mb-1">
                                {patient?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-600 mb-2">
                                {emar.medication_name}
                                {emar.medication_mg
                                  ? ` ${emar.medication_mg}mg`
                                  : ""}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
                                  Missed
                                </span>
                                {emar.time_to_take && (
                                  <span className="text-xs text-slate-500">
                                    {emar.time_to_take}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-sm"
            >
              Close
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
function HandoverModal({ handover, entries, patients, author, onClose }) {
  const shiftLabel = handover.shift_type === "AM->PM" ? "AM to PM" : "PM to AM";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-6">
      <div className="bg-white rounded-[28px] w-full max-w-[60vw] h-[95vh] shadow-2xl border border-slate-100 flex flex-col">
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
                {new Date(handover.created_at).toLocaleString("en-GB", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 cursor-pointer hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Meta grid */}
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
              {author && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <User size={12} className="text-blue-400" />
                    Created By
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {author.full_name}
                  </p>
                </div>
              )}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-red-400" />
                  Red Flags
                </p>
                <p className="text-sm font-black text-slate-900 tracking-tight">
                  {entries.length} Resident{entries.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* General Notes */}
            <div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                General Observations
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                {handover.notes ? (
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {handover.notes}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic font-medium">
                    No general observations recorded.
                  </p>
                )}
              </div>
            </div>

            {/* Red Flags */}
            {entries.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                  Resident Red Flags
                </p>
                <div className="space-y-3">
                  {entries.map((entry) => {
                    const patient = patients[entry.patient_id];
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-black flex-shrink-0">
                          {patient?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-base font-black text-red-900">
                              {patient?.full_name || "Unknown Resident"}
                            </p>
                            <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-black uppercase tracking-widest">
                              Room {patient?.room || "—"}
                            </span>
                            {patient?.wing && (
                              <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-black uppercase tracking-widest">
                                {patient.wing}
                              </span>
                            )}
                          </div>
                          {entry.patient_notes ? (
                            <p className="text-sm text-red-800 font-medium leading-relaxed whitespace-pre-wrap">
                              {entry.patient_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-red-400 italic">
                              No specific notes recorded
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!entries.length && !handover.notes && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText size={48} className="mb-3 opacity-20" />
                <p className="font-bold text-sm">No details available</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 cursor-pointer bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
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
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white px-6 py-4 rounded-2xl border border-slate-200/60 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} shadow-sm border border-slate-100/50`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
      </div>
    </motion.div>
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
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`group p-8 rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden ${cardBg} ${borderColor}`}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 3, repeat: Infinity }}
        className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${gradient} blur-3xl rounded-full -mr-20 -mt-20`}
      />
      <div className="flex justify-between items-start mb-10 relative z-10">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className={`p-4 ${iconBg} rounded-2xl shadow-sm border border-rose-100/50`}
        >
          {icon}
        </motion.div>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border ${iconBg} ${severityColor} border-rose-200`}
        >
          {severity}
        </span>
      </div>
      <div className="relative z-10">
        <h3
          className={`text-6xl font-bold mb-3 tracking-tighter ${valueColor}`}
        >
          {value}
        </h3>
        <p className="text-slate-700 font-semibold text-lg mb-10 tracking-tight">
          {label}
        </p>
        <motion.button
          onClick={onCta}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group/btn w-full py-4 bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
        >
          <span>View Details</span>
          <motion.div whileHover={{ x: 2, y: -2 }}>
            <ArrowUpRight size={18} />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Staff Row ──────────────────────────────────────────────────── */
function StaffRow({ dot, ringColor, label, sublabel, value }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className="group p-7 bg-gradient-to-br from-slate-50 to-slate-100/30 hover:from-slate-100 hover:to-slate-50 border border-slate-200/60 rounded-2xl transition-all duration-300 cursor-default hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full ${dot} shadow-sm relative z-10`}
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 w-3 h-3 rounded-full ${dot}`}
            />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900 mb-0.5">
              {label}
            </p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {sublabel}
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Dual Trend Chart ───────────────────────────────────────────── */
function DualTrendChart({ incidentData, emarData, metric }) {
  const [tooltip, setTooltip] = useState(null);

  const data = incidentData;
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-5">
          <Activity size={32} className="text-slate-300" />
        </div>
        <p className="font-semibold text-lg text-slate-900 mb-1">
          Not enough data yet
        </p>
        <p className="text-sm font-normal text-slate-500">
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
      <div className="flex items-center gap-6 mb-6">
        {metric !== "emar" && (
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm" />
            <span className="text-xs font-medium text-slate-600">
              Incidents
            </span>
          </div>
        )}
        {metric !== "incidents" && (
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-rose-400 to-red-500 shadow-sm" />
            <span className="text-xs font-medium text-slate-600">
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
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="emarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
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
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={yScale(v) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontWeight="600"
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
                strokeWidth="3"
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
                strokeWidth="3"
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
              fontWeight="600"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
            <div className="bg-white border border-slate-200 shadow-2xl rounded-xl px-4 py-3 min-w-[140px]">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Day {tooltip.day}
              </p>
              {metric !== "emar" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-normal">
                    Incidents
                  </span>
                  <span className="text-xs font-semibold text-slate-900 ml-auto">
                    {tooltip.incidents}
                  </span>
                </div>
              )}
              {metric !== "incidents" && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-normal">
                    Missed EMAR
                  </span>
                  <span className="text-xs font-semibold text-slate-900 ml-auto">
                    {tooltip.emar}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
