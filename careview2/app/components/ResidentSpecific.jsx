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
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Loading resident information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !resident) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Resident Not Found"}
          </h1>
          <button
            onClick={() => router.push("/residents")}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 transition-all active:scale-95"
          >
            Back to Residents
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white/50">
      <div className="container mx-auto px-6 lg:px-10 py-10">
        <button
          onClick={() => router.push("/residents")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Residents</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left Sidebar ── */}
          <div className="lg:w-80 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-cyan-500/30 mx-auto mb-4">
                {resident.full_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {resident.full_name || "N/A"}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Room {resident.room || "N/A"}</span>
                {resident.wing && (
                  <>
                    <span>•</span>
                    <span>{resident.wing}</span>
                  </>
                )}
              </div>
            </div>

            {/* Demographics Card */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">
                Demographics
              </h3>
              <div>
                <DemoRow
                  label="Age / Sex"
                  value={`${calculateAge(resident.dob)}y${resident.gender ? ` / ${resident.gender}` : ""}`}
                />
                <DemoRow
                  label="Admission"
                  value={
                    resident.created_at
                      ? new Date(resident.created_at).toLocaleDateString(
                          "en-GB",
                          { year: "numeric", month: "2-digit", day: "2-digit" },
                        )
                      : "N/A"
                  }
                />
                <DemoRow
                  label="Primary Language"
                  value={resident.language || "Not recorded"}
                />
                <DemoRow
                  label="Blood Type"
                  value={resident.blood || "Not recorded"}
                  red
                  last
                />
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1">
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl">
              {/* Tabs */}
              <div className="flex border-b border-white/10 px-6 overflow-x-auto">
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
                    className={`px-4 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.toLowerCase().replace(" ", "-")
                        ? "border-cyan-500 text-cyan-500"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8">
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
function DemoRow({ label, value, red, last }) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 ${!last ? "border-b border-white/5" : ""}`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${red ? "text-red-400" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${red ? "text-red-400" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ resident }) {
  const hasVitals = resident.pulse || resident.bp;

  return (
    <div className="space-y-8">
      {/* Status + Critical Note */}
      <div className="space-y-3">
        <div
          className={`w-full py-3 px-5 rounded-xl text-center text-xs font-bold uppercase tracking-widest border ${
            resident.status === "Stable"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : resident.status === "Attention"
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {resident.status || "Unknown"} Status
        </div>

        {resident.key_health_indicator && (
          <div className="w-full py-3.5 px-5 rounded-xl border bg-red-500/5 border-red-500/20">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">
              Critical Note
            </p>
            <p className="text-sm font-bold text-red-300">
              {resident.key_health_indicator}
            </p>
          </div>
        )}
      </div>

      {/* Executive Clinical Summary */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-blue-400" />
          </div>
          <h4 className="font-bold text-foreground text-base">
            Executive Clinical Summary
          </h4>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-5">
          {resident.health_summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{resident.health_summary}"
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No health summary on record.
            </p>
          )}
        </div>
      </section>

      {/* Vitals */}
      {hasVitals && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Current Vitals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resident.pulse && (
              <VitalCard
                label="Pulse"
                value={String(resident.pulse)}
                unit="bpm"
                color="cyan"
              />
            )}
            {resident.bp && (
              <VitalCard
                label="Blood Pressure"
                value={String(resident.bp)}
                unit="mmHg"
                color="blue"
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
    cyan: "from-cyan-400/10 to-cyan-500/5 border-cyan-500/20",
    blue: "from-blue-400/10 to-blue-500/5 border-blue-500/20",
    green: "from-green-400/10 to-green-500/5 border-green-500/20",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          {unit}
        </span>
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
        icon={<ClipboardList size={48} />}
        label="No visit logs found"
        sublabel="Visit logs will appear here once they are created"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-foreground">Visit History</h4>
        <span className="text-sm text-muted-foreground">
          {visitLogs.length} total visits
        </span>
      </div>
      {visitLogs.map((log) => (
        <button
          key={log.id}
          onClick={() => router.push(`/residents/${residentId}/${log.id}`)}
          className="w-full bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Visit Log #{log.id.substring(0, 8)}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {fmtDate(log.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {fmtTime(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {log.notes && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {log.notes}
                </p>
              )}
            </div>
            <div className="text-cyan-500 group-hover:translate-x-1 transition-transform">
              <ChevronRight size={20} />
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

   // Audit log: carer assigned
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

   // Audit log: family member linked
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
    <div className="space-y-8">
      {/* Carers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2 text-foreground">
            <UserCheck size={18} className="text-cyan-500" />
            Assigned Carers
          </h4>
          <button
            onClick={() => setShowAvailableCarers(!showAvailableCarers)}
            className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
          >
            {showAvailableCarers ? "Hide" : "View"} Available (
            {availableCarers.length})
          </button>
        </div>
        {careTeam.carers.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            label="No carers assigned yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="mt-4 bg-white/5 border border-cyan-500/30 rounded-lg p-6">
            <h5 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={16} className="text-cyan-500" />
              Available Carers
            </h5>
            {availableCarers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
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
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2 text-foreground">
            <Heart size={18} className="text-cyan-500" />
            Family Members
          </h4>
          <button
            onClick={() => setShowAvailableFamily(!showAvailableFamily)}
            className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
          >
            {showAvailableFamily ? "Hide" : "View"} Available (
            {availableFamily.length})
          </button>
        </div>
        {careTeam.family.length === 0 ? (
          <EmptyState
            icon={<UserCircle size={40} />}
            label="No family members linked yet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="mt-4 bg-white/5 border border-cyan-500/30 rounded-lg p-6">
            <h5 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserCircle size={16} className="text-cyan-500" />
              Available Family Members
            </h5>
            {availableFamily.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
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
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">
          {p.full_name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
            Carer
          </span>
          <RemoveButton onRemove={onRemove} isLoading={isLoading} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {p.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground text-sm">{p.email}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground text-sm">{p.phone}</span>
          </div>
        )}
        {assignment.assigned_at && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-white/10 flex items-center gap-1">
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
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">
          {p.full_name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
            Family
          </span>
          <RemoveButton onRemove={onRemove} isLoading={isLoading} />
        </div>
      </div>
      {member.relationship && (
        <p className="text-sm mb-3 pb-3 border-b border-white/10">
          <span className="text-muted-foreground text-xs">Relationship: </span>
          <span className="font-medium text-foreground">
            {member.relationship}
          </span>
        </p>
      )}
      <div className="space-y-2 text-sm">
        {p.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground text-sm">{p.email}</span>
          </div>
        )}
        {p.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground text-sm">{p.phone}</span>
          </div>
        )}
        {member.linked_at && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-white/10 flex items-center gap-1">
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
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          {person.full_name}
        </h3>
        <AssignButton onAssign={onAssign} isLoading={isLoading} />
      </div>
      <div className="space-y-1">
        {person.email && (
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-cyan-500" />
            <span className="text-foreground text-xs">{person.email}</span>
          </div>
        )}
        {person.phone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="text-cyan-500" />
            <span className="text-foreground text-xs">{person.phone}</span>
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
  const statusColor = (s) =>
    ({
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      "in progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    })[s?.toLowerCase()] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

  if (loading) return <LoadingSpinner label="Loading schedules..." />;
  if (error) return <ErrorState message={error} />;
  if (schedules.length === 0)
    return (
      <EmptyState
        icon={<CalendarDays size={48} />}
        label="No schedules found"
        sublabel="Schedules will appear here once created"
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-foreground">Patient Schedules</h4>
        <span className="text-sm text-muted-foreground">
          {schedules.length} total
        </span>
      </div>
      {schedules.map((s) => {
        const upcoming = new Date(s.start_at) > new Date();
        return (
          <div
            key={s.id}
            className={`bg-white/5 border rounded-lg p-6 hover:bg-white/10 transition-all ${upcoming ? "border-cyan-500/30" : "border-white/10"}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg ${upcoming ? "bg-gradient-to-r from-cyan-400 to-cyan-600" : "bg-gradient-to-r from-gray-400 to-gray-600"}`}
              >
                <CalendarDays size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Schedule #{s.id.substring(0, 8)}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(s.status)}`}
                  >
                    {s.status || "Unknown"}
                  </span>
                  {upcoming && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-cyan-500" />
                  Start
                </p>
                <p className="text-sm font-medium text-foreground">
                  {fmt(s.start_at)}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-cyan-500" />
                  End
                </p>
                <p className="text-sm font-medium text-foreground">
                  {fmt(s.end_at)}
                </p>
              </div>
            </div>
            {(s.carer || s.created_by_profile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                {s.carer && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <UserCheck size={12} className="text-cyan-500" />
                      Assigned Carer
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {s.carer.full_name}
                    </p>
                  </div>
                )}
                {s.created_by_profile && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <User size={12} className="text-cyan-500" />
                      Created By
                    </p>
                    <p className="text-sm font-semibold text-foreground">
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
        <h4 className="font-bold text-foreground">Patient Reports</h4>
        <span className="text-sm text-muted-foreground">
          {reports.length} total
        </span>
      </div>
      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          label="No reports found"
          sublabel="Reports will appear here once created"
        />
      ) : (
        reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {r.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Report #{r.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {r.content || "No content available"}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {r.created_by_profile && (
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-cyan-500" />
                      Created by {r.created_by_profile.full_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-cyan-500" />
                    {fmt(r.created_at)}
                  </span>
                </div>
              </div>
              <div className="text-cyan-500 group-hover:translate-x-1 transition-transform">
                <ChevronRight size={20} />
              </div>
            </div>
          </button>
        ))
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border-2 border-white/20 rounded-lg backdrop-blur-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {selected.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {selected.created_by_profile && (
                    <span className="flex items-center gap-1">
                      <User size={14} className="text-cyan-500" />
                      Created by {selected.created_by_profile.full_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-cyan-500" />
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
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selected.content}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 transition-all active:scale-95"
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
      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
      className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-medium px-3 py-1.5 rounded transition-all disabled:opacity-50"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        "Assign"
      )}
    </button>
  );
}

function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <AlertCircle size={48} className="mb-4 text-red-400" />
      <p className="text-lg font-medium">Something went wrong</p>
      <p className="text-sm mt-2">{message}</p>
    </div>
  );
}

function EmptyState({ icon, label, sublabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <div className="opacity-20 mb-4">{icon}</div>
      <p className="text-lg font-medium">{label}</p>
      {sublabel && <p className="text-sm mt-2">{sublabel}</p>}
    </div>
  );
}
