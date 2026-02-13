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
  ChevronRight,
  MoreVertical,
  Calendar,
  ArrowUpRight,
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  History,
} from "lucide-react";

export default function ManagerDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [occupancy, setOccupancy] = useState(0);
  const [staffStatus, setStaffStatus] = useState({
    active: 0,
    break: 0,
    scheduled: 0,
  });
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [repeatedIncidents, setRepeatedIncidents] = useState(0);
  const [missingVitals, setMissingVitals] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Handover state
  const [latestHandover, setLatestHandover] = useState(null);
  const [handoverEntries, setHandoverEntries] = useState([]);
  const [handoverPatients, setHandoverPatients] = useState({});
  const [handoverAuthor, setHandoverAuthor] = useState(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const now = new Date();

      // Occupancy
      const { count: patientCount } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      setOccupancy(patientCount || 0);

      // Missing vitals
      const { data: allPatients } = await supabase
        .from("patients")
        .select("id, pulse, bp, full_name, room, key_health_indicator");
      const missing = (allPatients || []).filter((p) => !p.pulse || !p.bp);
      setMissingVitals(missing.length);

      const alertsFromVitals = missing.slice(0, 3).map((p) => ({
        id: p.id,
        initials:
          p.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "??",
        name: p.full_name || "Unknown",
        subtitle: `Missing Vitals · Room ${p.room || "N/A"}`,
        status: "review_needed",
        color: "bg-amber-500",
      }));
      setActiveAlerts(alertsFromVitals);

      // Overdue tasks
      const { data: overdueData } = await supabase
        .from("schedules")
        .select("id, end_at, status")
        .in("status", ["scheduled", "pending"])
        .lt("end_at", now.toISOString());
      setOverdueTasks((overdueData || []).length);

      // Staff status
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

      // Reports this month
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, patient_id, date, created_at")
        .gte("date", startOfMonth);
      const reports = reportsData || [];

      const patientMap = {};
      reports.forEach((r) => {
        if (!r.patient_id) return;
        patientMap[r.patient_id] = (patientMap[r.patient_id] || 0) + 1;
      });
      setRepeatedIncidents(
        Object.values(patientMap).filter((c) => c >= 2).length,
      );

      const today = now.getDate();
      const dayBuckets = {};
      for (let d = 1; d <= today; d++) dayBuckets[d] = 0;
      reports.forEach((r) => {
        const day = new Date(r.date || r.created_at).getDate();
        if (dayBuckets[day] !== undefined) dayBuckets[day]++;
      });
      setTrendData(
        Object.entries(dayBuckets).map(([d, count]) => ({
          day: Number(d),
          count,
        })),
      );

      // Latest Handover
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

  const staffRatio =
    staffStatus.active > 0
      ? `1:${Math.round(occupancy / staffStatus.active)}`
      : "—";
  const monthName = new Date().toLocaleDateString("en-GB", { month: "long" });
  const bedsAvailable = Math.max(0, 50 - occupancy);
  const occupancyPct = Math.round((occupancy / 50) * 100);
  const hour = new Date().getHours();
  const shiftLabel = hour < 14 ? "AM" : hour < 22 ? "PM" : "Night";

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

          {/* Alert Cards */}
          <div className="flex w-full h-90 w-90">
            <div className="border-2">
              hi
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
            <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 relative overflow-hidden">
              {/* Subtle Glow */}
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10">
                <div>
                  <h3 className="font-black text-2xl text-slate-900 tracking-tight">
                    System Performance
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">
                    Incident trends — {monthName}
                  </p>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-100 flex gap-1">
                  <button className="px-5 py-2 bg-white text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm">
                    Week
                  </button>
                  <button className="px-5 py-2 text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl hover:text-slate-600 transition-colors">
                    Month
                  </button>
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
                  <TrendChart data={trendData} />
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
              valueColor="text-rose-600"
              label="Overdue Tasks"
              cta="View All Tasks"
              ctaColor="text-rose-600"
              gradient="from-rose-500 to-red-600"
              onCta={() => router.push("/schedules")}
            />

            {/* Latest Handover */}
            <div className="bg-slate-900 rounded-[32px] p-10 text-white shadow-2xl shadow-slate-200 flex flex-col justify-between relative overflow-hidden group">
              {/* Accent Glow */}
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>

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
                        "
                        {latestHandover.notes ||
                          "No general observations recorded."}
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

      {/* Handover Detail Modal */}
      {showHandoverModal && latestHandover && (
        <HandoverModal
          handover={latestHandover}
          entries={handoverEntries}
          patients={handoverPatients}
          author={handoverAuthor}
          onClose={() => setShowHandoverModal(false)}
        />
      )}
    </>
  );
}

/* ─── Handover Modal ─────────────────────────────────────────────── */
function HandoverModal({ handover, entries, patients, author, onClose }) {
  const shiftLabel = handover.shift_type === "AM->PM" ? "AM to PM" : "PM to AM";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
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

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8">
          {/* Handover meta */}
          <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[24px]">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 flex-shrink-0">
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

          {/* General Observations */}
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

          {/* Resident Red Flags */}
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

/* ─── Alert Row ──────────────────────────────────────────────────── */
function AlertRow({ alert }) {
  const statusConfig = {
    in_progress: {
      label: "IN PROGRESS",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    resolved: {
      label: "RESOLVED",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    review_needed: {
      label: "REVIEW NEEDED",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
  };
  const cfg = statusConfig[alert.status] || statusConfig.review_needed;
  const avatarColors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-pink-500",
  ];
  const colorIdx =
    (alert.initials.charCodeAt(0) + (alert.initials.charCodeAt(1) || 0)) %
    avatarColors.length;

  return (
    <div className="flex items-center gap-6 px-8 py-6 hover:bg-slate-50 transition-all group cursor-pointer">
      <div
        className={`w-16 h-16 rounded-[24px] ${avatarColors[colorIdx]} flex items-center justify-center text-white text-base font-black flex-shrink-0 shadow-sm ring-4 ring-white group-hover:scale-105 transition-transform`}
      >
        {alert.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-black text-slate-900 truncate tracking-tight">
          {alert.name}
        </p>
        <p className="text-sm text-slate-400 font-medium mt-0.5">
          {alert.subtitle}
        </p>
      </div>
      <span
        className={`text-[10px] font-black px-4 py-2 rounded-full border-2 flex-shrink-0 uppercase tracking-widest ${cfg.color}`}
      >
        {cfg.label}
      </span>
      <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-300 group-hover:text-slate-900 transition-all flex-shrink-0">
        <MoreVertical size={20} />
      </button>
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
  cta,
  ctaColor,
  gradient,
  onCta,
}) {
  return (
    <div
      className={`group p-8 rounded-[32px] border shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all relative overflow-hidden ${cardBg} ${borderColor} hover:scale-[1.02]`}
    >
      {/* Background Gradient Accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity blur-2xl rounded-full -mr-16 -mt-16`}
      ></div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div
          className={`p-4 ${iconBg} rounded-2xl shadow-sm ring-1 ring-white`}
        >
          {icon}
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${iconBg} ${severityColor} ring-1 ring-white/20`}
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
          {cta}
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

/* ─── Trend Chart SVG ────────────────────────────────────────────── */
function TrendChart({ data }) {
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
    H = 240,
    padL = 40,
    padR = 20,
    padT = 20,
    padB = 40;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const xScale = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yScale = (v) => padT + ((maxVal - v) / maxVal) * (H - padT - padB);
  const points = data.map((d, i) => ({ x: xScale(i), y: yScale(d.count) }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1],
      curr = points[i],
      cpX = (prev.x + curr.x) / 2;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const fillD =
    pathD +
    ` L ${points[points.length - 1].x} ${H - padB} L ${points[0].x} ${H - padB} Z`;
  const yLabels = [0, Math.ceil(maxVal / 2), maxVal];
  const xLabels = data.filter(
    (_, i) => i === 0 || (i + 1) % 5 === 0 || i === data.length - 1,
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: "320px", height: "240px" }}
      >
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
        <path d={fillD} fill="url(#blueGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {xLabels.map((d, i) => (
          <text
            key={i}
            x={xScale(data.indexOf(d))}
            y={H - 12}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontWeight="700"
          >
            {d.day}
          </text>
        ))}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="3"
          />
        ))}
      </svg>
    </div>
  );
}