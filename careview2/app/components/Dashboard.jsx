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
  ArrowRight,
  FileText,
  User,
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
  const [latestHandover, setLatestHandover] = useState(null); // the most recent shift_handover row
  const [handoverEntries, setHandoverEntries] = useState([]); // all rows from same shift
  const [handoverPatients, setHandoverPatients] = useState({}); // patient map
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

      // ── Latest Handover ──
      // 1. Get the most recent handover row
      const { data: latestRows } = await supabase
        .from("shift_handovers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (latestRows && latestRows.length > 0) {
        const latest = latestRows[0];
        setLatestHandover(latest);

        // 2. Get all rows from the same batch (same created_by + shift_type within ~2 min)
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

        // 3. Fetch patients for those entries
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

        // 4. Fetch author profile
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
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Facility Overview
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Live operational status for Greenview Care Home
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PillStat
              icon={<Users size={18} className="text-green-600" />}
              iconBg="bg-green-100"
              label="Occupancy"
              value={loading ? "—" : `${occupancy}/50`}
            />
            <PillStat
              icon={<TrendingUp size={18} className="text-blue-600" />}
              iconBg="bg-blue-100"
              label="Staff Ratio"
              value={loading ? "—" : staffRatio}
            />
          </div>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-7">
          <AlertCard
            icon={<Clock size={22} className="text-red-500" />}
            iconBg="bg-red-100"
            severity="HIGH"
            severityColor="text-red-500"
            cardBg="bg-red-50 border-red-100"
            value={loading ? "—" : overdueTasks}
            valueColor="text-red-600"
            label="Overdue Tasks"
            cta="View All Tasks"
            ctaColor="text-red-500"
            onCta={() => router.push("/schedules")}
          />
          <AlertCard
            icon={<AlertCircle size={22} className="text-amber-500" />}
            iconBg="bg-amber-100"
            severity="MEDIUM"
            severityColor="text-amber-500"
            cardBg="bg-amber-50 border-amber-100"
            value={loading ? "—" : repeatedIncidents}
            valueColor="text-amber-600"
            label="Repeated Incidents"
            cta="Check Logs"
            ctaColor="text-amber-500"
            onCta={() => router.push("/reports")}
          />
          <AlertCard
            icon={<Activity size={22} className="text-blue-500" />}
            iconBg="bg-blue-100"
            severity="MEDIUM"
            severityColor="text-blue-500"
            cardBg="bg-blue-50 border-blue-100"
            value={loading ? "—" : missingVitals}
            valueColor="text-blue-600"
            label="Missing Vitals"
            cta="Notify Carers"
            ctaColor="text-blue-500"
            onCta={() => router.push("/residents")}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-gray-800">
                Incident Trend — {monthName}
              </h3>
              <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
                This Month
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <TrendChart data={trendData} />
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-6">
              Staffing Status
            </h3>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                <StaffRow
                  dot="bg-green-500"
                  label="On Shift"
                  value={staffStatus.active}
                />
                <StaffRow
                  dot="bg-amber-500"
                  label="On Break"
                  value={staffStatus.break}
                />
                <StaffRow
                  dot="bg-blue-500"
                  label="Next Shift"
                  value={staffStatus.scheduled}
                />
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Occupancy Rate
                </p>
                <p className="text-sm font-bold text-blue-600">
                  {occupancyPct}%
                </p>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {bedsAvailable} {bedsAvailable === 1 ? "bed" : "beds"} currently
                available for admission
              </p>
            </div>
            <div className="mt-6 space-y-2">
              {[
                { label: "View Schedules", path: "/schedules" },
                { label: "Manage Residents", path: "/residents" },
                { label: "View Reports", path: "/reports" },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 transition-all group"
                >
                  {label}
                  <ChevronRight
                    size={14}
                    className="text-gray-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">
                Active Alerts
              </h3>
              <button
                onClick={() => router.push("/residents")}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View Audit Log <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                <AlertCircle size={36} className="mb-2" />
                <p className="text-sm text-gray-400 font-medium">
                  No active alerts
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Latest Handover */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800">
                Latest Handover
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Shift: {shiftLabel}
              </span>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ) : !latestHandover ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                    <FileText size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    No handover notes yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Once a handover is submitted it will appear here
                  </p>
                </div>
              ) : (
                <>
                  {/* Meta row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {handoverAuthor?.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">
                        {handoverAuthor?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(latestHandover.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}{" "}
                        ·{" "}
                        {new Date(latestHandover.created_at).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full flex-shrink-0">
                      {latestHandover.shift_type}
                    </span>
                  </div>

                  {/* General note preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={12} className="text-gray-400" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        General Note
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 italic">
                      "
                      {latestHandover.notes ||
                        "No general observations recorded."}
                      "
                    </p>
                  </div>

                  {/* Red flags count */}
                  {handoverEntries.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex -space-x-1.5">
                        {handoverEntries.slice(0, 3).map((entry, i) => {
                          const p = handoverPatients[entry.patient_id];
                          return (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-red-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-red-500"
                            >
                              {p?.full_name?.charAt(0) || "?"}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-red-500">
                          {handoverEntries.length}
                        </span>{" "}
                        resident{handoverEntries.length !== 1 ? "s" : ""}{" "}
                        flagged
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => setShowHandoverModal(true)}
                    className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-95"
                  >
                    Read Full Handover
                    <ArrowUpRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </section>
  );
}

/* ─── Handover Modal ─────────────────────────────────────────────── */
function HandoverModal({ handover, entries, patients, author, onClose }) {
  const shiftLabel = handover.shift_type === "AM->PM" ? "AM to PM" : "PM to AM";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Shift Handover</h3>
            <p className="text-sm text-gray-400 mt-0.5">
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
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-6">
          {/* Handover meta */}
          <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-2xl">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-cyan-500/20 flex-shrink-0">
              {author?.full_name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">
                {author?.full_name || "Unknown"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {author?.role || "Staff"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-cyan-400">
                {shiftLabel} Transition
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(handover.created_at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* General Observations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText size={14} className="text-blue-500" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                General Observations
              </p>
            </div>
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {handover.notes || (
                  <span className="italic text-gray-400">
                    No general observations recorded.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Resident Red Flags */}
          {entries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle size={14} className="text-red-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Resident Red Flags
                  </p>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                  {entries.length} flagged
                </span>
              </div>
              <div className="space-y-3">
                {entries.map((entry) => {
                  const patient = patients[entry.patient_id];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-sm font-bold text-red-500 flex-shrink-0">
                        {patient?.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-red-700">
                            {patient?.full_name || "Unknown Resident"}
                          </p>
                          <span className="text-xs text-red-400 bg-red-100 px-2 py-0.5 rounded-full font-medium">
                            Room {patient?.room || "—"}
                          </span>
                          {patient?.wing && (
                            <span className="text-xs text-gray-400 uppercase tracking-wide">
                              {patient.wing}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-red-600 leading-relaxed">
                          {entry.patient_notes || (
                            <span className="italic text-red-400">
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
        <div className="px-7 py-5 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
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
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    resolved: {
      label: "RESOLVED",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    review_needed: {
      label: "REVIEW NEEDED",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    },
  };
  const cfg = statusConfig[alert.status] || statusConfig.review_needed;
  const avatarColors = [
    "bg-red-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-pink-500",
  ];
  const colorIdx =
    (alert.initials.charCodeAt(0) + (alert.initials.charCodeAt(1) || 0)) %
    avatarColors.length;

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      <div
        className={`w-10 h-10 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
      >
        {alert.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{alert.name}</p>
        <p className="text-xs text-gray-400">{alert.subtitle}</p>
      </div>
      <span
        className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}
      >
        {cfg.label}
      </span>
      <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
        <MoreVertical size={16} className="text-gray-400" />
      </button>
    </div>
  );
}

/* ─── Pill Stat ──────────────────────────────────────────────────── */
function PillStat({ icon, iconBg, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
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
  value,
  valueColor,
  label,
  cta,
  ctaColor,
  onCta,
}) {
  return (
    <div className={`rounded-2xl border p-6 ${cardBg}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <span
          className={`text-xs font-black uppercase tracking-widest ${severityColor}`}
        >
          {severity}
        </span>
      </div>
      <p className={`text-5xl font-black mb-1 ${valueColor}`}>{value}</p>
      <p className="text-sm text-gray-600 font-medium mb-5">{label}</p>
      <button
        onClick={onCta}
        className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-sm transition-all"
      >
        <span className={ctaColor}>{cta}</span>
        <ChevronRight size={14} className={ctaColor} />
      </button>
    </div>
  );
}

/* ─── Staff Row ──────────────────────────────────────────────────── */
function StaffRow({ dot, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  );
}

/* ─── Trend Chart SVG ────────────────────────────────────────────── */
function TrendChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-300">
        <p className="text-sm">Not enough data yet this month</p>
      </div>
    );
  }

  const W = 600,
    H = 200,
    padL = 32,
    padR = 16,
    padT = 16,
    padB = 28;
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
        style={{ minWidth: "280px", height: "200px" }}
      >
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={padL}
              y1={yScale(v)}
              x2={W - padR}
              y2={yScale(v)}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={yScale(v) + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {v}
            </text>
          </g>
        ))}
        <path d={fillD} fill="rgba(239,68,68,0.08)" />
        <path
          d={pathD}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {xLabels.map((d, i) => (
          <text
            key={i}
            x={xScale(data.indexOf(d))}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
          >
            {d.day}
          </text>
        ))}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke="#ef4444"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
