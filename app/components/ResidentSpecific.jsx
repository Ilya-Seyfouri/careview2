"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
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
  Users,
  CalendarDays,
  FileText,
  ChevronRight,
  UserCheck,
  UserCircle,
  Activity,
  MapPin,
  X,
} from "lucide-react";

export default function ResidentSpecific({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [resident, setResident] = useState(null);
  const [visitLogs, setVisitLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const unwrappedParams = use(params);
  const residentId = unwrappedParams.id;

  useEffect(() => {
    if (!residentId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: residentData, error: residentError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", residentId)
          .single();

        if (residentError) {
          setError("Resident not found");
          return;
        }
        setResident(residentData);

        const { data: logsData, error: logsError } = await supabase
          .from("visit_logs")
          .select("*")
          .eq("patient_id", residentId)
          .order("created_at", { ascending: false });

        if (!logsError) setVisitLogs(logsData || []);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [residentId]);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity
            size={80}
            className="mb-6 opacity-10 animate-pulse mx-auto"
          />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            Loading resident information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-rose-400 mx-auto mb-6 opacity-20" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {error || "Resident Not Found"}
          </h1>
          <button
            onClick={() => router.push("/residents")}
            className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to Residents
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 py-10">
        <button
          onClick={() => router.push("/residents")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span>Back to Residents</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Left Sidebar ── */}
          <div className="lg:w-80 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden p-10 text-center relative">
              {/* Header Gradient */}
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-900 to-slate-800 -z-0"></div>

              <div className="relative z-10 pt-4">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-[28px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl ring-[12px] ring-white mx-auto">
                    {resident.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${
                      resident.status?.toLowerCase() === "stable"
                        ? "bg-emerald-500"
                        : resident.status?.toLowerCase() === "attention"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                  ></div>
                </div>

                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                  {resident.full_name || "N/A"}
                </h2>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600">
                    <MapPin size={14} className="text-blue-500" /> Room{" "}
                    {resident.room || "N/A"}
                  </div>
                  {resident.wing && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600">
                      {resident.wing}
                    </div>
                  )}
                </div>

                <div
                  className={` py-4 px-4 rounded-[24px] text-center text-xs font-black uppercase tracking-widest ring-1 ${
                    resident.status?.toLowerCase() === "stable"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : resident.status?.toLowerCase() === "attention"
                        ? "bg-amber-50 text-amber-700 ring-amber-100"
                        : "bg-rose-50 text-rose-700 ring-rose-100"
                  }`}
                >
                  {resident.status || "Unknown"} Status
                </div>
              </div>
            </div>

            {/* Demographics Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                Key Demographics
              </h3>
              <div className="space-y-4">
                <DemoRow
                  label="Age"
                  value={`${calculateAge(resident.dob)}y${resident.gender ? ` / ${resident.gender}` : ""}`}
                  icon={User}
                />
                <DemoRow
                  label="Admission"
                  value={
                    resident.created_at
                      ? new Date(resident.created_at).toLocaleDateString(
                          "en-GB",
                          { year: "numeric", month: "short", day: "numeric" },
                        )
                      : "N/A"
                  }
                  icon={Calendar}
                />
                <DemoRow
                  label="Primary Language"
                  value={resident.language || "English"}
                  icon={Activity}
                />
                <DemoRow
                  label="Blood Type"
                  value={resident.blood || "Not recorded"}
                  icon={Heart}
                  color="text-rose-500"
                  last
                />
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden min-h-[600px] flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-slate-50 px-8 bg-slate-50/20 pt-4">
                {[
                  "Overview",
                  "Visit Logs",
                  "Care Team",
                  "Schedule",
                  "Reports",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(tab.toLowerCase().replace(" ", "-"))
                    }
                    className={`px-6 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${
                      activeTab === tab.toLowerCase().replace(" ", "-")
                        ? "text-blue-600"
                        : "text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase().replace(" ", "-") && (
                      <div className="absolute bottom-0 left-6 right-6 h-1 bg-blue-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-10 flex-1">
                {activeTab === "overview" && (
                  <OverviewTab resident={resident} />
                )}
                {activeTab === "visit-logs" && (
                  <VisitLogsTab visitLogs={visitLogs} residentId={residentId} />
                )}
                {activeTab === "care-team" && (
                  <CareTeamTab residentId={residentId} />
                )}
                {activeTab === "schedule" && (
                  <ScheduleTab residentId={residentId} />
                )}
                {activeTab === "reports" && (
                  <ReportsTab residentId={residentId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Demographics Row ─────────────────────────────────────────────────────────
function DemoRow({ label, value, icon: Icon, color, last }) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors ${!last ? "" : ""}`}
    >
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Icon size={12} className={color || "text-slate-400"} />
        {label}
      </span>
      <span className={`font-black text-sm ${color || "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ resident }) {
  const hasVitals = resident.pulse || resident.bp;

  return (
    <div className="space-y-10">
      {/* Status Badge */}
      

      {/* Executive Clinical Summary */}
      <section>
        <h4 className="font-semibold text-xl mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText size={20} />
          </div>
          Executive Clinical Summary
        </h4>
        <div className="p-4 bg-slate-50/50 rounded-3xl border-2 border-slate-100 border-dashed">
          {resident.health_summary ? (
            <p className="text-md text-slate-600 leading-relaxed italic font-medium">
              "{resident.health_summary}"
            </p>
          ) : (
            <p className="text-lg text-slate-400 italic font-medium">
              No health summary on record.
            </p>
          )}
        </div>
      </section>

      {/* Vitals */}
      {hasVitals && (
        <section>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">
            Current Vitals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {resident.pulse && (
              <VitalCard
                label="Pulse"
                value={String(resident.pulse)}
                unit="bpm"
                color="blue"
              />
            )}
            {resident.bp && (
              <VitalCard
                label="Blood Pressure"
                value={String(resident.bp)}
                unit="mmHg"
                color="rose"
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function VitalCard({ label, value, unit, color }) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      ring: "ring-blue-100",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      ring: "ring-rose-100",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
  };
  const cfg = colors[color] || colors.blue;

  return (
    <div
      className={`${cfg.bg} rounded-[24px] p-4 ring-1 ${cfg.ring} shadow-sm`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
        {label}
      </p>
      <p className={`text-3xl font-black ${cfg.text} tracking-tight`}>
        {value}
        <span className="text-sm font-bold text-slate-400 ml-2">{unit}</span>
      </p>
    </div>
  );
}

// ─── Visit Logs Tab ───────────────────────────────────────────────────────────
function VisitLogsTab({ visitLogs, residentId }) {
  const router = useRouter();
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (visitLogs.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={80} />}
        label="No visit logs found"
        sublabel="Visit logs will appear here once they are created"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          Visit History
        </h4>
        <span className="text-sm text-slate-500 font-bold">
          {visitLogs.length} total visits
        </span>
      </div>
      {visitLogs.map((log) => (
        <button
          key={log.id}
          onClick={() => router.push(`/residents/${residentId}/${log.id}`)}
          className="w-full bg-white border border-slate-100 p-8 rounded-[24px] hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">
                    Visit Log #{log.id.substring(0, 8)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {fmtDate(log.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {fmtTime(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {log.notes && (
                <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
                  {log.notes}
                </p>
              )}
            </div>
            <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
              <ChevronRight size={24} strokeWidth={2.5} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Care Team Tab ────────────────────────────────────────────────────────────
function CareTeamTab({ residentId }) {
  const supabase = createClient();
  const [careTeam, setCareTeam] = useState({ carers: [], family: [] });
  const [availableCarers, setAvailableCarers] = useState([]);
  const [availableFamily, setAvailableFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAvailableCarers, setShowAvailableCarers] = useState(false);
  const [showAvailableFamily, setShowAvailableFamily] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchCareTeam();
    fetchAvailableCarers();
    fetchAvailableFamily();
  }, [residentId]);

  const fetchCareTeam = async () => {
    try {
      setLoading(true);
      const { data: carers, error: ce } = await supabase
        .from("patient_carers")
        .select(
          `id, assigned_at, carer_id, profiles:carer_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", residentId);
      if (ce) throw ce;

      const { data: family, error: fe } = await supabase
        .from("patient_family")
        .select(
          `id, relationship, linked_at, family_id, profiles:family_id (id, full_name, email, phone, role)`,
        )
        .eq("patient_id", residentId);
      if (fe) throw fe;

      setCareTeam({ carers: carers || [], family: family || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCarers = async () => {
    const { data: a } = await supabase
      .from("patient_carers")
      .select("carer_id")
      .eq("patient_id", residentId);
    const ids = (a || []).map((x) => x.carer_id);
    let q = supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "carer");
    if (ids.length > 0) q = q.not("id", "in", `(${ids.join(",")})`);
    const { data } = await q;
    setAvailableCarers(data || []);
  };

  const fetchAvailableFamily = async () => {
    const { data: a } = await supabase
      .from("patient_family")
      .select("family_id")
      .eq("patient_id", residentId);
    const ids = (a || []).map((x) => x.family_id);
    let q = supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("role", "family");
    if (ids.length > 0) q = q.not("id", "in", `(${ids.join(",")})`);
    const { data } = await q;
    setAvailableFamily(data || []);
  };

  const assignCarer = async (id) => {
    setActionLoading(`assign-carer-${id}`);
    await supabase.from("patient_carers").insert({
      patient_id: residentId,
      carer_id: id,
      assigned_at: new Date().toISOString(),
    });

    await supabase.from("audit_logs").insert({
      action_type: "carer_assigned_to_patient",
      actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      related_to: residentId,
      created_at: new Date().toISOString(),
    });

    await fetchCareTeam();
    await fetchAvailableCarers();
    setActionLoading(null);
  };

  const removeCarer = async (assignId, carerId) => {
    setActionLoading(`remove-carer-${carerId}`);
    await supabase.from("patient_carers").delete().eq("id", assignId);
    await fetchCareTeam();
    await fetchAvailableCarers();
    setActionLoading(null);
  };

  const assignFamily = async (id) => {
    setActionLoading(`assign-family-${id}`);
    await supabase.from("patient_family").insert({
      patient_id: residentId,
      family_id: id,
      linked_at: new Date().toISOString(),
      relationship: "Family Member",
    });

    await supabase.from("audit_logs").insert({
      action_type: "family_linked_to_patient",
      actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      related_to: residentId,
      created_at: new Date().toISOString(),
    });

    await fetchCareTeam();
    await fetchAvailableFamily();
    setActionLoading(null);
  };

  const removeFamily = async (assignId, famId) => {
    setActionLoading(`remove-family-${famId}`);
    await supabase.from("patient_family").delete().eq("id", assignId);
    await fetchCareTeam();
    await fetchAvailableFamily();
    setActionLoading(null);
  };

  if (loading) return <LoadingSpinner label="Loading care team..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-10">
      {/* Carers */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-black text-xl flex items-center gap-3 text-slate-900 tracking-tight">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <UserCheck size={20} />
            </div>
            Assigned Carers
          </h4>
          <button
            onClick={() => setShowAvailableCarers(!showAvailableCarers)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-black uppercase tracking-widest"
          >
            {showAvailableCarers ? "Hide" : "View"} Available (
            {availableCarers.length})
          </button>
        </div>
        {careTeam.carers.length === 0 ? (
          <EmptyState
            icon={<Users size={60} />}
            label="No carers assigned yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careTeam.carers.map((a, i) => (
              <CarerCard
                key={i}
                assignment={a}
                onRemove={() => removeCarer(a.id, a.carer_id)}
                isLoading={actionLoading === `remove-carer-${a.carer_id}`}
              />
            ))}
          </div>
        )}
        {showAvailableCarers && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-[24px] p-8">
            <h5 className="font-black text-lg text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
              <Users size={18} className="text-blue-600" />
              Available Carers
            </h5>
            {availableCarers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 font-medium">
                No available carers
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCarers.map((c) => (
                  <AvailableCard
                    key={c.id}
                    person={c}
                    onAssign={() => assignCarer(c.id)}
                    isLoading={actionLoading === `assign-carer-${c.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Family */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-black text-xl flex items-center gap-3 text-slate-900 tracking-tight">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <Heart size={20} />
            </div>
            Family Members
          </h4>
          <button
            onClick={() => setShowAvailableFamily(!showAvailableFamily)}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-black uppercase tracking-widest"
          >
            {showAvailableFamily ? "Hide" : "View"} Available (
            {availableFamily.length})
          </button>
        </div>
        {careTeam.family.length === 0 ? (
          <EmptyState
            icon={<UserCircle size={60} />}
            label="No family members linked yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careTeam.family.map((m, i) => (
              <FamilyCard
                key={i}
                member={m}
                onRemove={() => removeFamily(m.id, m.family_id)}
                isLoading={actionLoading === `remove-family-${m.family_id}`}
              />
            ))}
          </div>
        )}
        {showAvailableFamily && (
          <div className="mt-6 bg-rose-50 border border-rose-200 rounded-[24px] p-8">
            <h5 className="font-black text-lg text-slate-900 mb-6 flex items-center gap-2 tracking-tight">
              <UserCircle size={18} className="text-rose-600" />
              Available Family Members
            </h5>
            {availableFamily.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 font-medium">
                No available family members
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableFamily.map((f) => (
                  <AvailableCard
                    key={f.id}
                    person={f}
                    onAssign={() => assignFamily(f.id)}
                    isLoading={actionLoading === `assign-family-${f.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function CarerCard({ assignment, onRemove, isLoading }) {
  const p = assignment.profiles;
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-lg transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          {p.full_name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 ring-1 ring-blue-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
            Carer
          </span>
          <RemoveButton onRemove={onRemove} isLoading={isLoading} />
        </div>
      </div>
      <div className="space-y-3 text-sm">
        {p.email && (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-500" />
            <span className="text-slate-700 font-medium">{p.email}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-blue-500" />
            <span className="text-slate-700 font-medium">{p.phone}</span>
          </div>
        )}
        {assignment.assigned_at && (
          <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 font-bold">
            <Clock size={12} />
            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function FamilyCard({ member, onRemove, isLoading }) {
  const p = member.profiles;
  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 hover:shadow-lg transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          {p.full_name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
            Family
          </span>
          <RemoveButton onRemove={onRemove} isLoading={isLoading} />
        </div>
      </div>
      {member.relationship && (
        <p className="text-sm mb-4 pb-4 border-b border-slate-100">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Relationship:{" "}
          </span>
          <span className="font-black text-slate-900">
            {member.relationship}
          </span>
        </p>
      )}
      <div className="space-y-3 text-sm">
        {p.email && (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-rose-500" />
            <span className="text-slate-700 font-medium">{p.email}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-rose-500" />
            <span className="text-slate-700 font-medium">{p.phone}</span>
          </div>
        )}
        {member.linked_at && (
          <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 font-bold">
            <Clock size={12} />
            Linked: {new Date(member.linked_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function AvailableCard({ person, onAssign, isLoading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          {person.full_name}
        </h3>
        <AssignButton onAssign={onAssign} isLoading={isLoading} />
      </div>
      <div className="space-y-2">
        {person.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-blue-500" />
            <span className="text-slate-600 text-xs font-medium">
              {person.email}
            </span>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-blue-500" />
            <span className="text-slate-600 text-xs font-medium">
              {person.phone}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab({ residentId }) {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("schedules")
          .select(
            `id, start_at, end_at, status, created_at, carer:carer_id (id, full_name, email, phone), created_by_profile:created_by (id, full_name)`,
          )
          .eq("patient_id", residentId)
          .order("start_at", { ascending: false });
        if (err) throw err;
        setSchedules(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [residentId]);

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

  const statusConfig = {
    completed: {
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    },
    pending: {
      label: "Pending",
      color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    },
    "in progress": {
      label: "In Progress",
      color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    },
  };

  if (loading) return <LoadingSpinner label="Loading schedules..." />;
  if (error) return <ErrorState message={error} />;
  if (schedules.length === 0)
    return (
      <EmptyState
        icon={<CalendarDays size={80} />}
        label="No schedules found"
        sublabel="Schedules will appear here once created"
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          Patient Schedules
        </h4>
        <span className="text-sm text-slate-500 font-bold">
          {schedules.length} total
        </span>
      </div>
      {schedules.map((s) => {
        const upcoming = new Date(s.start_at) > new Date();
        const cfg =
          statusConfig[s.status?.toLowerCase()] || statusConfig.pending;

        return (
          <div
            key={s.id}
            className={`bg-white border rounded-[24px] p-8 hover:shadow-lg transition-all ${upcoming ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-100"}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${upcoming ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}`}
              >
                <CalendarDays size={26} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  Schedule #{s.id.substring(0, 8)}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  {upcoming && (
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100 uppercase tracking-widest">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" />
                  Start Time
                </p>
                <p className="text-sm font-black text-slate-900">
                  {fmt(s.start_at)}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-500" />
                  End Time
                </p>
                <p className="text-sm font-black text-slate-900">
                  {fmt(s.end_at)}
                </p>
              </div>
            </div>
            {(s.carer || s.created_by_profile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                {s.carer && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <UserCheck size={12} className="text-blue-500" />
                      Assigned Carer
                    </p>
                    <p className="text-base font-black text-slate-900 tracking-tight">
                      {s.carer.full_name}
                    </p>
                  </div>
                )}
                {s.created_by_profile && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <User size={12} className="text-blue-500" />
                      Created By
                    </p>
                    <p className="text-base font-black text-slate-900 tracking-tight">
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

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ residentId }) {
  const supabase = createClient();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from("reports")
          .select(
            `id, title, content, created_at, created_by_profile:created_by (id, full_name)`,
          )
          .eq("patient_id", residentId)
          .order("created_at", { ascending: false });
        if (err) throw err;
        setReports(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [residentId]);

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (loading) return <LoadingSpinner label="Loading reports..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-xl text-slate-900 tracking-tight">
          Patient Reports
        </h4>
        <span className="text-sm text-slate-500 font-bold">
          {reports.length} total
        </span>
      </div>
      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={80} />}
          label="No reports found"
          sublabel="Reports will appear here once created"
        />
      ) : (
        reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="w-full bg-white border border-slate-100 rounded-[24px] p-8 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <FileText size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-bold">
                      Report #{r.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 font-medium leading-relaxed">
                  {r.content || "No content available"}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  {r.created_by_profile && (
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-blue-500" />
                      Created by {r.created_by_profile.full_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" />
                    {fmt(r.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                <ChevronRight size={24} strokeWidth={2.5} />
              </div>
            </div>
          </button>
        ))
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-3xl w-full p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                  {selected.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                  {selected.created_by_profile && (
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-blue-500" />
                      Created by {selected.created_by_profile.full_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    {new Date(selected.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-4">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-base">
                {selected.content}
              </p>
            </div>
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setSelected(null)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function RemoveButton({ onRemove, isLoading }) {
  return (
    <button
      onClick={onRemove}
      disabled={isLoading}
      className="text-rose-500 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      )}
    </button>
  );
}

function AssignButton({ onAssign, isLoading }) {
  return (
    <button
      onClick={onAssign}
      disabled={isLoading}
      className="bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 text-[10px] font-black px-4 py-2 rounded-xl transition-all disabled:opacity-50 uppercase tracking-widest"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        "Assign"
      )}
    </button>
  );
}

function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
      <p className="font-black text-xl text-slate-900 tracking-tight">
        {label}
      </p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
      <AlertCircle size={80} className="mb-6 opacity-10" />
      <p className="font-black text-xl text-slate-900 tracking-tight">
        Something went wrong
      </p>
      <p className="text-sm font-medium text-slate-500 mt-2">{message}</p>
    </div>
  );
}

function EmptyState({ icon, label, sublabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
      <div className="opacity-10 mb-6">{icon}</div>
      <p className="font-black text-xl text-slate-900 tracking-tight">
        {label}
      </p>
      {sublabel && (
        <p className="text-sm font-medium text-slate-500 mt-2">{sublabel}</p>
      )}
    </div>
  );
}
