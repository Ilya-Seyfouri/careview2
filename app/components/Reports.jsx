"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  Activity,
  Users,
  AlertCircle,
  ShieldCheck,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  X,
  FileText,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";

export default function Analytics() {
  const supabase = createClient();
  const { demoUser } = useDemoUser();
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [reportsByType, setReportsByType] = useState([]);
  const [staffVisitCounts, setStaffVisitCounts] = useState([]);
  const [showAddReport, setShowAddReport] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Total completed visits
      const { count: visitsCount } = await supabase
        .from("schedules")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      setTotalVisits(visitsCount || 0);

      // All reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, type, patient_id, patients(full_name)");
      const reports = reportsData || [];
      setTotalReports(reports.length);

      // Group reports by type
      const typeCounts = { falls: 0, medication: 0, nutrition: 0, other: 0 };
      reports.forEach((r) => {
        const t = r.type || "other";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      const total = reports.length || 1;
      setReportsByType([
        {
          label: "Falls",
          key: "falls",
          count: typeCounts.falls,
          color: "#ef4444",
          pct: Math.round((typeCounts.falls / total) * 100),
        },
        {
          label: "Medication",
          key: "medication",
          count: typeCounts.medication,
          color: "#f59e0b",
          pct: Math.round((typeCounts.medication / total) * 100),
        },
        {
          label: "Nutrition",
          key: "nutrition",
          count: typeCounts.nutrition,
          color: "#3b82f6",
          pct: Math.round((typeCounts.nutrition / total) * 100),
        },
        {
          label: "Other",
          key: "other",
          count: typeCounts.other,
          color: "#94a3b8",
          pct: Math.round((typeCounts.other / total) * 100),
        },
      ]);

      // Staff visit counts
      const { data: schedulesData } = await supabase
        .from("schedules")
        .select("carer_id")
        .eq("status", "completed");
      const schedules = schedulesData || [];

      // Count visits per carer
      const carerMap = {};
      schedules.forEach((s) => {
        if (!s.carer_id) return;
        carerMap[s.carer_id] = (carerMap[s.carer_id] || 0) + 1;
      });

      // Fetch carer names
      const carerIds = Object.keys(carerMap);
      if (carerIds.length > 0) {
        const { data: carersData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", carerIds)
          .eq("role", "carer");

        const staffData = (carersData || [])
          .map((c) => ({
            id: c.id,
            name: c.full_name || "Unknown",
            shortName: c.full_name
              ? `${c.full_name.split(" ")[0]} ${c.full_name.split(" ").slice(-1)[0]?.[0] || ""}.`
              : "Unknown",
            visits: carerMap[c.id] || 0,
          }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 6);
        setStaffVisitCounts(staffData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const careRating = 4.85;
  const complianceScore = 98;

  const statCards = [
    {
      label: "Total Visits (Month)",
      value: loading ? "—" : totalVisits.toLocaleString(),
      delta: "+12%",
      positive: true,
      icon: Activity,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Avg Care Rating",
      value: `${careRating}/5`,
      delta: "+2%",
      positive: true,
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      label: "Incidents Reported",
      value: loading ? "—" : totalReports,
      delta: "-5%",
      positive: false,
      icon: AlertCircle,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
    },
    {
      label: "Compliance Score",
      value: `${complianceScore}%`,
      delta: "Stable",
      positive: null,
      icon: ShieldCheck,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
  ];

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Activity size={12} />
              Performance Insights
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Analytics & Reporting
                </h2>
             
              </div>
              <div className="flex items-center gap-3">
               
                <button
                  onClick={() => setShowAddReport(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                >
                  <Plus
                    size={20}
                    strokeWidth={3}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  Add Report
                </button>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} loading={loading} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Staff Utilisation Bar Chart */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Staff Utilisation
                </h3>
                <span className="text-[10px] text-slate-400 font-black bg-slate-50 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  Completed Visits
                </span>
              </div>

              {loading ? (
                <div className="flex items-end justify-center gap-4 h-64 pb-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-slate-100 rounded-t-xl animate-pulse"
                      style={{ height: `${40 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
              ) : staffVisitCounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <AlertCircle size={60} className="mb-4 opacity-10" />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    No completed visits yet
                  </p>
                </div>
              ) : (
                <StaffBarChart
                  data={staffVisitCounts}
                  tooltip={tooltip}
                  setTooltip={setTooltip}
                />
              )}
            </div>

            {/* Incident Distribution Donut */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Incident Distribution
                </h3>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  By type
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Activity
                    size={60}
                    className="mb-4 opacity-10 animate-pulse"
                  />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    Loading...
                  </p>
                </div>
              ) : totalReports === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <AlertCircle size={60} className="mb-4 opacity-10" />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    No incidents recorded yet
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <DonutChart segments={reportsByType} total={totalReports} />
                  <div className="flex-1 space-y-4">
                    {reportsByType.map((seg) => (
                      <div
                        key={seg.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-sm text-slate-600 font-bold">
                            {seg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {seg.pct}%
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            ({seg.count})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Type Breakdown */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">
              Report Type Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {reportsByType.map((seg) => (
                <div
                  key={seg.key}
                  className="rounded-[24px] p-6 border-2"
                  style={{
                    backgroundColor: `${seg.color}08`,
                    borderColor: `${seg.color}20`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                    style={{ backgroundColor: `${seg.color}15` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                    {seg.count}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {seg.label}
                  </p>
                  <p
                    className="text-xs font-black"
                    style={{ color: seg.color }}
                  >
                    {seg.pct}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showAddReport && (
        <AddReportModal
          onClose={() => setShowAddReport(false)}
          onSuccess={() => {
            setShowAddReport(false);
            fetchData();
          }}
          managerId={demoUser?.id}
        />
      )}
    </>
  );
}

/* ─── Staff Bar Chart ────────────────────────────────────────────── */
function StaffBarChart({ data, tooltip, setTooltip }) {
  const maxVisits = Math.max(...data.map((d) => d.visits), 1);
  const yMax = Math.ceil(maxVisits / 4) * 4 || 4;
  const yLabels = [yMax, Math.ceil(yMax / 2), 0];

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* Y axis */}
        <div className="flex flex-col justify-between pb-8 text-right w-8 flex-shrink-0">
          {yLabels.map((v) => (
            <span
              key={v}
              className="text-[10px] text-slate-400 font-black leading-none uppercase tracking-widest"
            >
              {v}
            </span>
          ))}
        </div>

        {/* Bars + x labels */}
        <div className="flex-1">
          {/* Grid lines */}
          <div className="relative h-52 mb-3">
            {yLabels.map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-slate-100"
                style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around px-2 gap-4">
              {data.map((staff) => {
                const heightPct = (staff.visits / yMax) * 100;
                const isHovered = tooltip?.id === staff.id;
                return (
                  <div
                    key={staff.id}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onMouseEnter={() => {
                      setTooltip({
                        id: staff.id,
                        name: staff.shortName,
                        visits: staff.visits,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <div className="relative w-full flex justify-center">
                      {/* Tooltip */}
                      {isHovered && (
                        <div
                          className="absolute bottom-full mb-3 bg-slate-900 rounded-2xl shadow-2xl px-4 py-3 z-10 whitespace-nowrap pointer-events-none"
                          style={{ left: "50%", transform: "translateX(-50%)" }}
                        >
                          <p className="text-xs font-black text-white tracking-tight">
                            {staff.shortName}
                          </p>
                          <p className="text-xs font-bold text-blue-400 mt-0.5">
                            {staff.visits} visits
                          </p>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-2xl transition-all duration-300 shadow-lg ${
                          isHovered
                            ? "bg-blue-500 scale-105"
                            : "bg-blue-600 group-hover:bg-blue-500"
                        }`}
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          maxHeight: "208px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X labels */}
          <div className="flex justify-around px-2 gap-4">
            {data.map((staff) => (
              <div key={staff.id} className="flex-1 text-center">
                <span className="text-[10px] text-slate-400 font-black truncate block uppercase tracking-widest">
                  {staff.shortName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Report Modal ───────────────────────────────────────────── */
function AddReportModal({ onClose, onSuccess, managerId }) {
  const supabase = createClient();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: "",
    title: "",
    type: "falls",
    content: "",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .order("full_name", { ascending: true });
      setPatients(data || []);
      setLoadingPatients(false);
    };
    fetchPatients();
  }, []);

  const typeConfig = {
    falls: {
      color: "#ef4444",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
    },
    medication: {
      color: "#f59e0b",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
    },
    nutrition: {
      color: "#3b82f6",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
    },
    other: {
      color: "#94a3b8",
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.patient_id ||
      !formData.title.trim() ||
      !formData.content.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const { data: newReport, error: insertError } = await supabase
        .from("reports")
        .insert({
          patient_id: formData.patient_id,
          created_by: managerId,
          title: formData.title.trim(),
          type: formData.type,
          content: formData.content.trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Audit log: report created
      await supabase.from("audit_logs").insert({
        action_type: "report_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: formData.patient_id,
        created_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <FileText size={12} />
              New Report
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Create Report
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Log an incident or observation
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
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Resident <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patient_id}
              onChange={(e) =>
                setFormData({ ...formData, patient_id: e.target.value })
              }
              className={inputClass}
              required
            >
              <option value="">
                {loadingPatients ? "Loading residents..." : "Select a resident"}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — Room {p.room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. Fall Incident - Morning Round"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: key })}
                  className={`py-3 px-2 rounded-2xl border-2 text-xs font-semibold capitalize transition-all ${formData.type === key ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-md` : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"}`}
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-2"
                    style={{
                      backgroundColor:
                        formData.type === key ? cfg.color : "#cbd5e1",
                    }}
                  />
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              rows={5}
              placeholder="Describe the incident, observations, actions taken and follow-up required..."
              className={`${inputClass} resize-none leading-relaxed`}
              required
            />
            <p className="text-xs text-slate-400 font-medium mt-2 text-right">
              {formData.content.length} characters
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-sm text-rose-600 font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
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
              disabled={
                saving ||
                !formData.patient_id ||
                !formData.title.trim() ||
                !formData.content.trim()
              }
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              <FileText size={16} strokeWidth={3} />
              {saving ? "Saving..." : "Save Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
}) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
      <div className="flex items-start justify-between mb-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} shadow-sm`}
        >
          <Icon size={24} className={iconColor} strokeWidth={2.5} />
        </div>
        <div
          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${positive === true ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : positive === false ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100" : "bg-slate-50 text-slate-600 ring-1 ring-slate-100"}`}
        >
          {positive === true && <TrendingUp size={12} strokeWidth={3} />}
          {positive === false && <TrendingDown size={12} strokeWidth={3} />}
          {positive === null && <Minus size={12} strokeWidth={3} />}
          {delta}
        </div>
      </div>
      <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
        {loading && value === "—" ? (
          <span className="inline-block w-20 h-8 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          value
        )}
      </p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

/* ─── Donut Chart ────────────────────────────────────────────────── */
function DonutChart({ segments, total }) {
  const size = 180;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  const arcs = segments
    .filter((s) => s.count > 0)
    .map((seg) => {
      const dash = (seg.count / total) * circumference;
      const gap = circumference - dash;
      const arc = { ...seg, dash, gap, offset };
      offset += dash;
      return arc;
    });
  return (
    <div className="flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        ))}
      </svg>
    </div>
  );
}
