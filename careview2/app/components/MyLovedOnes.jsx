"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  User,
  Heart,
  Clock,
  AlertCircle,
  ClipboardList,
  FileText,
  ChevronRight,
  History,
  X,
  Utensils,
  MapPin,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import { useDemoUser } from "../components/DemoContext";

export default function MyLovedOnes() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [client, setClient] = useState(null);
  const [visitLogs, setVisitLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [assignedCarers, setAssignedCarers] = useState([]);
  const [carerNames, setCarerNames] = useState({});
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showViewReport, setShowViewReport] = useState(null);

  useEffect(() => {
    if (demoUser?.id) fetchAll(demoUser.id);
  }, [demoUser]);

  const fetchAll = async (familyId) => {
    try {
      setLoading(true);

      // Get linked patient via patient_family
      const { data: linkData, error: linkError } = await supabase
        .from("patient_family")
        .select("patient_id, relationship")
        .eq("family_id", familyId);

      if (linkError || !linkData || linkData.length === 0) {
        setLoading(false);
        return;
      }

      // Get the first patient if there are multiple
      const firstLink = linkData[0];
      setRelationship(firstLink.relationship);
      const patientId = firstLink.patient_id;

      // Fetch patient
      const { data: clientData, error: clientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (clientError) {
        setError("Resident not found");
        return;
      }
      setClient(clientData);

      // Fetch visit logs
      const { data: logsData } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      const logs = logsData || [];
      setVisitLogs(logs);

      // Resolve carer names for visit logs
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

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select(
          "id, title, content, type, created_at, created_by_profile:created_by (id, full_name, role)",
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      setReports(reportsData || []);

      // Fetch assigned carers via patient_carers
      const { data: carerLinks } = await supabase
        .from("patient_carers")
        .select(
          `id, assigned_at, carer_id, profiles:carer_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", patientId);

      const carers = (carerLinks || []).map((link) => ({
        ...link.profiles,
        assigned_at: link.assigned_at,
      }));
      setAssignedCarers(carers);
    } catch (err) {
      console.error(err);
      setError("Failed to load resident details");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isLoading = userLoading || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error || "Resident not found"}
          </h1>
          <button
            onClick={() => router.push("/family")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    stable: {
      badge: "bg-green-100 text-green-700 border-green-200",
      dot: "bg-green-500",
    },
    attention: {
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    critical: {
      badge: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
  };
  const statusCfg =
    statusConfig[client.status?.toLowerCase()] || statusConfig.stable;
  const tabs = ["Overview", "Visit Logs", "Reports", "Schedules"];

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          {/* Back */}
          <button
            onClick={() => router.push("/family")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Left Sidebar ── */}
            <div className="lg:w-80 space-y-5">
              {/* Profile card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-blue-500/20 mx-auto mb-4">
                  {client.full_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {client.full_name}
                </h2>
                {relationship && (
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">
                    Your {relationship}
                  </p>
                )}
                <p className="text-sm text-gray-400 mb-4 flex items-center justify-center gap-1.5">
                  <MapPin size={13} className="text-blue-400" />
                  Room {client.room || "N/A"}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {client.status || "Unknown"}
                </span>
              </div>

              {/* Quick stats */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Quick Info
                </h3>
                <div className="space-y-3">
                  <StatRow label="Age" value={calculateAge(client.dob)} />
                  <StatRow
                    label="Date of Birth"
                    value={
                      client.dob
                        ? new Date(client.dob).toLocaleDateString("en-GB")
                        : "N/A"
                    }
                  />
                  <StatRow label="Wing" value={client.wing || "N/A"} />
                  <StatRow label="Blood Type" value={client.blood || "N/A"} />
                  <StatRow label="Visit Logs" value={visitLogs.length} />
                  <StatRow label="Reports" value={reports.length} />
                </div>
              </div>

              {/* Care Team */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Care Team
                </h3>
                {assignedCarers.length === 0 ? (
                  <p className="text-sm text-gray-400">No assigned carers</p>
                ) : (
                  <div className="space-y-4">
                    {assignedCarers.map((carer) => (
                      <div key={carer.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                            {carer.full_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              {carer.full_name}
                            </p>
                            <p className="text-xs text-gray-400">Carer</p>
                          </div>
                        </div>
                        {carer.phone && (
                          <a
                            href={`tel:${carer.phone}`}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-500 transition-colors pl-9"
                          >
                            <Phone size={11} /> {carer.phone}
                          </a>
                        )}
                        {carer.email && (
                          <a
                            href={`mailto:${carer.email}`}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-500 transition-colors pl-9"
                          >
                            <Mail size={11} /> {carer.email}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Tab nav */}
                <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
                  {tabs.map((tab) => {
                    const key = tab.toLowerCase().replace(" ", "-");
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === key
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-400 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="p-8">
                  {activeTab === "overview" && (
                    <OverviewTab
                      client={client}
                      assignedCarers={assignedCarers}
                      calculateAge={calculateAge}
                    />
                  )}
                  {activeTab === "visit-logs" && (
                    <VisitLogsTab
                      visitLogs={visitLogs}
                      carerNames={carerNames}
                    />
                  )}
                  {activeTab === "reports" && (
                    <ReportsTab
                      reports={reports}
                      onViewReport={(r) => setShowViewReport(r)}
                    />
                  )}
                  {activeTab === "schedules" && (
                    <SchedulesTab patientId={client.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showViewReport && (
        <ViewReportModal
          report={showViewReport}
          onClose={() => setShowViewReport(null)}
        />
      )}
    </>
  );
}

/* ─── Overview Tab ───────────────────────────────────────────────── */
function OverviewTab({ client, assignedCarers, calculateAge }) {
  return (
    <div className="space-y-6">
      <section>
        <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
          <User size={18} className="text-blue-500" /> Personal Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Full Name" value={client.full_name} />
          <InfoField label="Room Number" value={client.room} />
          <InfoField label="Age" value={calculateAge(client.dob)} />
          <InfoField
            label="Date of Birth"
            value={
              client.dob
                ? new Date(client.dob).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"
            }
          />
          <InfoField label="Wing" value={client.wing} />
          <InfoField label="Language" value={client.language} />
        </div>
      </section>

      {client.health_summary && (
        <section>
          <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <History size={18} className="text-blue-500" /> Health Summary
          </h4>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p className="text-sm text-gray-600 leading-relaxed">
              {client.health_summary}
            </p>
          </div>
        </section>
      )}

      {client.key_health_indicator && (
        <section>
          <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Heart size={18} className="text-blue-500" /> Key Health Indicator
          </h4>
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm font-semibold text-red-700">
              {client.key_health_indicator}
            </span>
          </div>
        </section>
      )}

      {assignedCarers.length > 0 && (
        <section>
          <h4 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
            <UserCheck size={18} className="text-blue-500" /> Care Team
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assignedCarers.map((carer) => (
              <div
                key={carer.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                    {carer.full_name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {carer.full_name}
                    </p>
                    <p className="text-xs text-gray-400">Carer</p>
                  </div>
                </div>
                {carer.phone && (
                  <a
                    href={`tel:${carer.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Phone size={13} className="text-green-500" /> {carer.phone}
                  </a>
                )}
                {carer.email && (
                  <a
                    href={`mailto:${carer.email}`}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Mail size={13} className="text-blue-500" /> {carer.email}
                  </a>
                )}
                {carer.assigned_at && (
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                    Assigned:{" "}
                    {new Date(carer.assigned_at).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Visit Logs Tab ─────────────────────────────────────────────── */
function VisitLogsTab({ visitLogs, carerNames }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-GB", {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800">Visit History</h4>
        <span className="text-sm text-gray-400">{visitLogs.length} total</span>
      </div>

      {visitLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <ClipboardList size={48} className="mb-4" />
          <p className="font-medium text-gray-400">No visit logs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitLogs.map((log) => {
            const moodConfig = getMoodConfig(log.mood);
            const appetiteConfig = getAppetiteConfig(log.appetite);
            const carerName = carerNames[log.carer_id];
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
              <div
                key={log.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-5"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="font-semibold text-gray-800 text-sm">
                        {carerName || "Care Team"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar size={11} /> {fmt(log.created_at)}
                        <Clock size={11} /> {fmtTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mood + Appetite */}
                {(moodConfig || appetiteConfig) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {moodConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${moodConfig.color}`}
                      >
                        {moodConfig.emoji} {moodConfig.label}
                      </span>
                    )}
                    {appetiteConfig && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${appetiteConfig.color}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${appetiteConfig.dot}`}
                        />
                        Appetite: {appetiteConfig.label}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {log.notes && (
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Observations
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {log.notes}
                    </p>
                  </div>
                )}

                {/* Tasks */}
                {tasks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Tasks Completed
                    </p>
                    <div className="space-y-1.5">
                      {tasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0">
                            <svg
                              width="8"
                              height="7"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="#16a34a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Reports Tab ────────────────────────────────────────────────── */
function ReportsTab({ reports, onViewReport }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800">Reports</h4>
        <span className="text-sm text-gray-400">{reports.length} total</span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <FileText size={48} className="mb-4" />
          <p className="font-medium text-gray-400">No reports yet</p>
          <p className="text-sm mt-1 text-gray-400">
            Reports from the care team will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const typeCfg = typeConfig[report.type] || typeConfig.other;
            return (
              <button
                key={report.id}
                onClick={() => onViewReport(report)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 hover:bg-white hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-800 truncate">
                          {report.title}
                        </p>
                        {report.type && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${typeCfg.color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`}
                            />
                            {report.type.charAt(0).toUpperCase() +
                              report.type.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {report.content || "No content"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {report.created_by_profile && (
                          <span className="flex items-center gap-1">
                            <User size={10} className="text-blue-400" />
                            {report.created_by_profile.full_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={10} className="text-blue-400" />
                          {fmt(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Schedules Tab ──────────────────────────────────────────────── */
function SchedulesTab({ patientId }) {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("schedules")
          .select(
            `id, start_at, end_at, status, created_at, carer:carer_id (id, full_name, email, phone), created_by_profile:created_by (id, full_name)`,
          )
          .eq("patient_id", patientId)
          .order("start_at", { ascending: false });
        if (err) throw err;
        setSchedules(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [patientId]);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-medium">Something went wrong</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <CalendarDays size={48} className="mb-4" />
        <p className="text-lg font-medium text-gray-400">No schedules found</p>
        <p className="text-sm mt-2 text-gray-400">
          Scheduled visits will appear here once created
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-gray-800">Care Schedules</h4>
        <span className="text-sm text-gray-400">{schedules.length} total</span>
      </div>
      {schedules.map((s) => {
        const upcoming = new Date(s.start_at) > new Date();
        return (
          <div
            key={s.id}
            className={`bg-gray-50 border rounded-xl p-6 hover:bg-white hover:shadow-sm transition-all ${upcoming ? "border-blue-300" : "border-gray-200"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${upcoming ? "bg-gradient-to-r from-blue-400 to-blue-600" : "bg-gradient-to-r from-gray-400 to-gray-600"}`}
              >
                <CalendarDays size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Schedule #{s.id.substring(0, 8)}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(s.status)}`}
                  >
                    {s.status || "Unknown"}
                  </span>
                  {upcoming && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-blue-400" />
                  Start
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {fmt(s.start_at)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-blue-400" />
                  End
                </p>
                <p className="text-sm font-medium text-gray-800">
                  {fmt(s.end_at)}
                </p>
              </div>
            </div>
            {(s.carer || s.created_by_profile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                {s.carer && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <UserCheck size={12} className="text-blue-400" />
                      Assigned Carer
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {s.carer.full_name}
                    </p>
                  </div>
                )}
                {s.created_by_profile && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <User size={12} className="text-blue-400" />
                      Created By
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {s.created_by_profile.full_name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── View Report Modal ──────────────────────────────────────────── */
function ViewReportModal({ report, onClose }) {
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

/* ─── Helpers ────────────────────────────────────────────────────── */
function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-700">{value}</span>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="font-medium text-gray-800">{value || "Not provided"}</p>
    </div>
  );
}
