"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, useRef } from "react";
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
  const [staffVisitCounts, setStaffVisitCounts] = useState([]); // ← new
  const [showAddReport, setShowAddReport] = useState(false);
  const [tooltip, setTooltip] = useState(null); // ← new

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

      // ── Staff visit counts ──────────────────────────────────────
      // Get all completed schedules with carer_id
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
      iconColor: "text-cyan-500",
      iconBg: "bg-cyan-500/10",
    },
    {
      label: "Avg Care Rating",
      value: `${careRating}/5`,
      delta: "+2%",
      positive: true,
      icon: Users,
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10",
    },
    {
      label: "Incidents Reported",
      value: loading ? "—" : totalReports,
      delta: "-5%",
      positive: false,
      icon: AlertCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Compliance Score",
      value: `${complianceScore}%`,
      delta: "Stable",
      positive: null,
      icon: ShieldCheck,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
  ];

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Analytics & Reporting
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Key performance indicators and operational summaries
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                <Download size={16} /> Export Data
              </button>
              <button
                onClick={() => setShowAddReport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
              >
                <Plus size={16} /> Add Report
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} loading={loading} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Staff Utilisation Bar Chart ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-800">
                  Staff Utilisation
                </h3>
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
                  Completed Visits
                </span>
              </div>

              {loading ? (
                <div className="flex items-end justify-center gap-4 h-48 pb-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gray-100 rounded-t-lg animate-pulse"
                      style={{ height: `${40 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
              ) : staffVisitCounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <AlertCircle size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No completed visits yet</p>
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-800">
                  Incident Distribution
                </h3>
                <span className="text-xs text-gray-400 font-medium">
                  By type
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : totalReports === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <AlertCircle size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No incidents recorded yet</p>
                </div>
              ) : (
                <div className="flex items-center gap-8">
                  <DonutChart segments={reportsByType} total={totalReports} />
                  <div className="flex-1 space-y-3">
                    {reportsByType.map((seg) => (
                      <div
                        key={seg.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {seg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800">
                            {seg.pct}%
                          </span>
                          <span className="text-xs text-gray-400">
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mt-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">
              Report Type Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {reportsByType.map((seg) => (
                <div
                  key={seg.key}
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: `${seg.color}10`,
                    borderColor: `${seg.color}30`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${seg.color}20` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-0.5">
                    {seg.count}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {seg.label}
                  </p>
                  <p
                    className="text-xs font-bold mt-1"
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
  // Y axis labels: 0, half, max rounded up to nice number
  const yMax = Math.ceil(maxVisits / 4) * 4 || 4;
  const yLabels = [yMax, Math.ceil(yMax / 2), 0];

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex flex-col justify-between pb-7 text-right w-6 flex-shrink-0">
          {yLabels.map((v) => (
            <span
              key={v}
              className="text-[11px] text-gray-400 font-medium leading-none"
            >
              {v}
            </span>
          ))}
        </div>

        {/* Bars + x labels */}
        <div className="flex-1">
          {/* Grid lines */}
          <div className="relative h-44 mb-2">
            {yLabels.map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-t border-gray-100"
                style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-around px-2 gap-3">
              {data.map((staff, i) => {
                const heightPct = (staff.visits / yMax) * 100;
                const isHovered = tooltip?.id === staff.id;
                return (
                  <div
                    key={staff.id}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
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
                          className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 z-10 whitespace-nowrap pointer-events-none"
                          style={{ left: "50%", transform: "translateX(-50%)" }}
                        >
                          <p className="text-xs font-bold text-gray-800">
                            {staff.shortName}
                          </p>
                          <p className="text-xs font-bold text-blue-500">
                            visits : {staff.visits}
                          </p>
                        </div>
                      )}

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isHovered
                            ? "bg-blue-400"
                            : "bg-blue-500 group-hover:bg-blue-400"
                        }`}
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          maxHeight: "176px",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X labels */}
          <div className="flex justify-around px-2 gap-3">
            {data.map((staff) => (
              <div key={staff.id} className="flex-1 text-center">
                <span className="text-[11px] text-gray-400 font-medium truncate block">
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
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white transition-colors text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Report</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Log an incident or observation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Resident <span className="text-red-400">*</span>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-400">*</span>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: key })}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold capitalize transition-all ${formData.type === key ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm` : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"}`}
                >
                  <div
                    className="w-2 h-2 rounded-full mx-auto mb-1.5"
                    style={{
                      backgroundColor:
                        formData.type === key ? cfg.color : "#d1d5db",
                    }}
                  />
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Details <span className="text-red-400">*</span>
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
            <p className="text-xs text-gray-400 mt-1 text-right">
              {formData.content.length} characters
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold text-sm disabled:opacity-50"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              <FileText size={14} />
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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon size={20} className={iconColor} />
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${positive === true ? "bg-green-50 text-green-600" : positive === false ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}
        >
          {positive === true && <TrendingUp size={11} />}
          {positive === false && <TrendingDown size={11} />}
          {positive === null && <Minus size={11} />}
          {delta}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">
        {loading && value === "—" ? (
          <span className="inline-block w-16 h-7 bg-gray-100 rounded animate-pulse" />
        ) : (
          value
        )}
      </p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

/* ─── Donut Chart ────────────────────────────────────────────────── */
function DonutChart({ segments, total }) {
  const size = 160;
  const strokeWidth = 28;
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
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        ))}
      </svg>
    </div>
  );
}
