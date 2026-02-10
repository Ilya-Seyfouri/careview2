"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  Activity,
  Clock,
  AlertCircle,
  ClipboardList,
  Users,
  CalendarDays,
  FileText,
  ChevronRight,
  History,
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

  // Unwrap the params Promise for Next.js 15
  const unwrappedParams = use(params);
  const residentId = unwrappedParams.id;

  useEffect(() => {
    if (!residentId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch resident info
        const { data: residentData, error: residentError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", residentId)
          .single();

        if (residentError) {
          console.error(residentError);
          setError("Resident not found");
          return;
        }

        setResident(residentData);

        // Fetch visit logs
        const { data: logsData, error: logsError } = await supabase
          .from("visit_logs")
          .select("*")
          .eq("patient_id", residentId)
          .order("created_at", { ascending: false });

        if (logsError) {
          console.error(logsError);
        } else {
          setVisitLogs(logsData || []);
        }
      } catch (err) {
        console.error(err);
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
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
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
        {/* Back Button */}
        <button
          onClick={() => router.push("/residents")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to Residents</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Profile */}
          <div className="lg:w-80 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-cyan-500/30 mx-auto mb-4">
                {resident.full_name?.charAt(0).toUpperCase() || "?"}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {resident.full_name || "N/A"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Room {resident.room || "N/A"}
              </p>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  resident.status === "Stable"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : resident.status === "Attention"
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {resident.status || "Unknown"}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <StatRow label="Age" value={calculateAge(resident.dob)} />
                <StatRow
                  label="Date of Birth"
                  value={
                    resident.dob
                      ? new Date(resident.dob).toLocaleDateString()
                      : "N/A"
                  }
                />
                <StatRow label="Gender" value={resident.gender || "N/A"} />
                <StatRow
                  label="Admission"
                  value={
                    resident.admission_date
                      ? new Date(resident.admission_date).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Phone size={12} />
                    <span>Phone</span>
                  </div>
                  <p className="text-sm text-foreground pl-5">
                    {resident.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Mail size={12} />
                    <span>Email</span>
                  </div>
                  <p className="text-sm text-foreground pl-5">
                    {resident.email || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Tabs */}
          <div className="flex-1">
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl">
              {/* Tab Navigation */}
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
                )}{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Overview Tab Component
function OverviewTab({ resident }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medical Summary */}
        <section>
          <h4 className="font-bold mb-4 flex items-center gap-2 text-foreground">
            <History size={18} className="text-cyan-500" /> Medical Summary
          </h4>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resident.medical_notes || "No medical notes available."}
            </p>
          </div>
        </section>

        {/* Emergency Contact */}
        {(resident.emergency_contact_name ||
          resident.emergency_contact_phone) && (
          <section>
            <h4 className="font-bold mb-4 flex items-center gap-2 text-foreground">
              <Heart size={18} className="text-cyan-500" /> Emergency Contact
            </h4>
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {resident.emergency_contact_name || "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resident.emergency_contact_relationship ||
                    "Relationship not specified"}
                </p>
                <p className="text-sm text-foreground">
                  {resident.emergency_contact_phone || "No phone"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Personal Information */}
      <section>
        <h4 className="font-bold mb-4 flex items-center gap-2 text-foreground">
          <User size={18} className="text-cyan-500" /> Personal Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Full Name" value={resident.full_name} />
          <InfoField label="Room Number" value={resident.room} />
          <InfoField
            label="Admission Date"
            value={
              resident.admission_date
                ? new Date(resident.admission_date).toLocaleDateString()
                : "N/A"
            }
          />
          <InfoField
            label="Last Checkup"
            value={
              resident.last_checkup
                ? new Date(resident.last_checkup).toLocaleDateString()
                : "N/A"
            }
          />
        </div>
      </section>
    </div>
  );
}

function VisitLogsTab({ visitLogs, residentId }) {
  const router = useRouter();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (visitLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ClipboardList size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No visit logs found</p>
        <p className="text-sm mt-2">
          Visit logs will appear here once they are created
        </p>
      </div>
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

      <div className="space-y-4">
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
                        {formatDate(log.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {log.notes && (
                  <p className="text-sm text-muted-foreground mt-3 pl-13 line-clamp-2">
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
    </div>
  );
}

// Replace the CareTeamTab component with this updated version:

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

      // Fetch assigned carers
      const { data: carers, error: carersError } = await supabase
        .from('patient_carers')
        .select(`
          id,
          assigned_at,
          carer_id,
          profiles:carer_id (
            id,
            full_name,
            email,
            phone,
            role
          )
        `)
        .eq('patient_id', residentId);

      if (carersError) throw carersError;

      // Fetch assigned family members
      const { data: family, error: familyError } = await supabase
        .from('patient_family')
        .select(`
          id,
          relationship,
          linked_at,
          family_id,
          profiles:family_id (
            id,
            full_name,
            email,
            phone,
            role
          )
        `)
        .eq('patient_id', residentId);

      if (familyError) throw familyError;

      setCareTeam({
        carers: carers || [],
        family: family || []
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCarers = async () => {
    try {
      // Get all assigned carer IDs for this patient
      const { data: assignedCarers } = await supabase
        .from('patient_carers')
        .select('carer_id')
        .eq('patient_id', residentId);

      const assignedCarerIds = assignedCarers?.map(ac => ac.carer_id) || [];

      // Get all carers not assigned to this patient
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .eq('role', 'carer');

      if (assignedCarerIds.length > 0) {
        query = query.not('id', 'in', `(${assignedCarerIds.join(',')})`);
      }

      const { data: carers, error } = await query;

      if (error) throw error;

      setAvailableCarers(carers || []);
    } catch (err) {
      console.error('Error fetching available carers:', err);
    }
  };

  const fetchAvailableFamily = async () => {
    try {
      // Get all assigned family IDs for this patient
      const { data: assignedFamily } = await supabase
        .from('patient_family')
        .select('family_id')
        .eq('patient_id', residentId);

      const assignedFamilyIds = assignedFamily?.map(af => af.family_id) || [];

      // Get all family members not assigned to this patient
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role')
        .eq('role', 'family');

      if (assignedFamilyIds.length > 0) {
        query = query.not('id', 'in', `(${assignedFamilyIds.join(',')})`);
      }

      const { data: family, error } = await query;

      if (error) throw error;

      setAvailableFamily(family || []);
    } catch (err) {
      console.error('Error fetching available family:', err);
    }
  };

  const assignCarer = async (carerId) => {
    try {
      setActionLoading(`assign-carer-${carerId}`);

      const { error } = await supabase
        .from('patient_carers')
        .insert({
          patient_id: residentId,
          carer_id: carerId,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;

      // Refresh data
      await fetchCareTeam();
      await fetchAvailableCarers();
    } catch (err) {
      console.error('Error assigning carer:', err);
      alert('Failed to assign carer');
    } finally {
      setActionLoading(null);
    }
  };

  const removeCarer = async (assignmentId, carerId) => {
    try {
      setActionLoading(`remove-carer-${carerId}`);

      const { error } = await supabase
        .from('patient_carers')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // Refresh data
      await fetchCareTeam();
      await fetchAvailableCarers();
    } catch (err) {
      console.error('Error removing carer:', err);
      alert('Failed to remove carer');
    } finally {
      setActionLoading(null);
    }
  };

  const assignFamily = async (familyId) => {
    try {
      setActionLoading(`assign-family-${familyId}`);

      const { error } = await supabase
        .from('patient_family')
        .insert({
          patient_id: residentId,
          family_id: familyId,
          linked_at: new Date().toISOString(),
          relationship: 'Family Member' // Default relationship
        });

      if (error) throw error;

      // Refresh data
      await fetchCareTeam();
      await fetchAvailableFamily();
    } catch (err) {
      console.error('Error assigning family member:', err);
      alert('Failed to assign family member');
    } finally {
      setActionLoading(null);
    }
  };

  const removeFamily = async (assignmentId, familyId) => {
    try {
      setActionLoading(`remove-family-${familyId}`);

      const { error } = await supabase
        .from('patient_family')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // Refresh data
      await fetchCareTeam();
      await fetchAvailableFamily();
    } catch (err) {
      console.error('Error removing family member:', err);
      alert('Failed to remove family member');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading care team...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-medium">Error loading care team</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Assigned Carers Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2 text-foreground">
            <UserCheck size={18} className="text-cyan-500" /> Assigned Carers
          </h4>
          <button
            onClick={() => setShowAvailableCarers(!showAvailableCarers)}
            className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
          >
            {showAvailableCarers ? 'Hide' : 'View'} Available Carers ({availableCarers.length})
          </button>
        </div>
        
        {careTeam.carers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
            <Users size={40} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground">No carers assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careTeam.carers.map((assignment, index) => (
              <CarerCard 
                key={index} 
                assignment={assignment} 
                onRemove={() => removeCarer(assignment.id, assignment.carer_id)}
                isLoading={actionLoading === `remove-carer-${assignment.carer_id}`}
              />
            ))}
          </div>
        )}

        {/* Available Carers Dropdown */}
        {showAvailableCarers && (
          <div className="mt-4 bg-white/5 border border-cyan-500/30 rounded-lg p-6">
            <h5 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={16} className="text-cyan-500" />
              Available Carers
            </h5>
            {availableCarers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available carers to assign
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCarers.map((carer) => (
                  <AvailableCarerCard 
                    key={carer.id} 
                    carer={carer} 
                    onAssign={() => assignCarer(carer.id)}
                    isLoading={actionLoading === `assign-carer-${carer.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Assigned Family Members Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold flex items-center gap-2 text-foreground">
            <Heart size={18} className="text-cyan-500" /> Family Members
          </h4>
          <button
            onClick={() => setShowAvailableFamily(!showAvailableFamily)}
            className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors font-medium"
          >
            {showAvailableFamily ? 'Hide' : 'View'} Available Family ({availableFamily.length})
          </button>
        </div>
        
        {careTeam.family.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
            <UserCircle size={40} className="mx-auto mb-3 opacity-20 text-muted-foreground" />
            <p className="text-muted-foreground">No family members linked yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careTeam.family.map((member, index) => (
              <FamilyCard 
                key={index} 
                member={member} 
                onRemove={() => removeFamily(member.id, member.family_id)}
                isLoading={actionLoading === `remove-family-${member.family_id}`}
              />
            ))}
          </div>
        )}

        {/* Available Family Dropdown */}
        {showAvailableFamily && (
          <div className="mt-4 bg-white/5 border border-cyan-500/30 rounded-lg p-6">
            <h5 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserCircle size={16} className="text-cyan-500" />
              Available Family Members
            </h5>
            {availableFamily.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available family members to link
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableFamily.map((family) => (
                  <AvailableFamilyCard 
                    key={family.id} 
                    family={family} 
                    onAssign={() => assignFamily(family.id)}
                    isLoading={actionLoading === `assign-family-${family.id}`}
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
  const carer = assignment.profiles;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{carer.full_name}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
            Carer
          </span>
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded disabled:opacity-50"
            title="Remove carer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        {carer.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground">{carer.email}</span>
          </div>
        )}
        
        {carer.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground">{carer.phone}</span>
          </div>
        )}
        
        {assignment.assigned_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-white/10">
            <Clock size={12} />
            <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FamilyCard({ member, onRemove, isLoading }) {
  const family = member.profiles;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{family.full_name}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium px-2.5 py-1 rounded-full">
            Family
          </span>
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded disabled:opacity-50"
            title="Remove family member"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {member.relationship && (
        <div className="mb-3 pb-3 border-b border-white/10">
          <span className="text-xs text-muted-foreground">Relationship: </span>
          <span className="text-sm font-medium text-foreground">{member.relationship}</span>
        </div>
      )}
      
      <div className="space-y-2 text-sm">
        {family.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground">{family.email}</span>
          </div>
        )}
        
        {family.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground">{family.phone}</span>
          </div>
        )}
        
        {member.linked_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-white/10">
            <Clock size={12} />
            <span>Linked: {new Date(member.linked_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Available Carer Card Component
function AvailableCarerCard({ carer, onAssign, isLoading }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">{carer.full_name}</h3>
        <button
          onClick={onAssign}
          disabled={isLoading}
          className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-medium px-3 py-1.5 rounded transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Assign'
          )}
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        {carer.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground text-xs">{carer.email}</span>
          </div>
        )}
        
        {carer.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground text-xs">{carer.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Available Family Card Component
function AvailableFamilyCard({ family, onAssign, isLoading }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">{family.full_name}</h3>
        <button
          onClick={onAssign}
          disabled={isLoading}
          className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-medium px-3 py-1.5 rounded transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Assign'
          )}
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        {family.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={14} className="text-cyan-500" />
            <span className="text-foreground text-xs">{family.email}</span>
          </div>
        )}
        
        {family.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={14} className="text-cyan-500" />
            <span className="text-foreground text-xs">{family.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
// Replace the ScheduleTab component with this:

function ScheduleTab({ residentId }) {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, [residentId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      const { data, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          start_at,
          end_at,
          status,
          created_at,
          carer:carer_id (
            id,
            full_name,
            email,
            phone
          ),
          created_by_profile:created_by (
            id,
            full_name
          )
        `)
        .eq('patient_id', residentId)
        .order('start_at', { ascending: false });

      if (schedulesError) throw schedulesError;

      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const isUpcoming = (startAt) => {
    return new Date(startAt) > new Date();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-medium">Error loading schedules</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CalendarDays size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No schedules found</p>
        <p className="text-sm mt-2">Schedules will appear here once they are created</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-foreground">Patient Schedules</h4>
        <span className="text-sm text-muted-foreground">{schedules.length} total schedules</span>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} formatDateTime={formatDateTime} formatTime={formatTime} getStatusColor={getStatusColor} isUpcoming={isUpcoming} />
        ))}
      </div>
    </div>
  );
}

function ScheduleCard({ schedule, formatDateTime, formatTime, getStatusColor, isUpcoming }) {
  const upcoming = isUpcoming(schedule.start_at);

  return (
    <div className={`bg-white/5 border rounded-lg p-6 hover:bg-white/10 transition-all ${upcoming ? 'border-cyan-500/30' : 'border-white/10'}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg ${upcoming ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-gray-400 to-gray-600'}`}>
            <CalendarDays size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Schedule #{schedule.id.substring(0, 8)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(schedule.status)}`}>
                {schedule.status || 'Unknown'}
              </span>
              {upcoming && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Upcoming
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock size={12} className="text-cyan-500" />
            <span>Start Time</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {formatDateTime(schedule.start_at)}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock size={12} className="text-cyan-500" />
            <span>End Time</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {formatDateTime(schedule.end_at)}
          </p>
        </div>
      </div>

      {/* Carer and Creator Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
        {schedule.carer && (
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <UserCheck size={12} className="text-cyan-500" />
              <span>Assigned Carer</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{schedule.carer.full_name}</p>
              {schedule.carer.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail size={10} />
                  {schedule.carer.email}
                </p>
              )}
              {schedule.carer.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} />
                  {schedule.carer.phone}
                </p>
              )}
            </div>
          </div>
        )}

        {schedule.created_by_profile && (
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <User size={12} className="text-cyan-500" />
              <span>Created By</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{schedule.created_by_profile.full_name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(schedule.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Replace the ReportsTab component with this:

function ReportsTab({ residentId }) {
  const supabase = createClient();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [residentId]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const { data, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          content,
          created_at,
          created_by_profile:created_by (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('patient_id', residentId)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-medium">Error loading reports</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-bold text-foreground">Patient Reports</h4>
        <span className="text-sm text-muted-foreground">{reports.length} total reports</span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No reports found</p>
          <p className="text-sm mt-2">Reports will appear here once they are created</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => openViewModal(report)}
            />
          ))}
        </div>
      )}

      
    </div>
  );
}

function ReportCard({ report, onView }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <button
      onClick={onView}
      className="w-full bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <FileText size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">
                {report.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Report #{report.id.substring(0, 8)}
              </p>
            </div>
          </div>

          {/* Preview of content */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {report.content || 'No content available'}
          </p>

          {/* Creator and Date Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {report.created_by_profile && (
              <div className="flex items-center gap-1">
                <User size={12} className="text-cyan-500" />
                <span>Created by {report.created_by_profile.full_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-cyan-500" />
              <span>{formatDate(report.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="text-cyan-500 group-hover:translate-x-1 transition-transform">
          <ChevronRight size={20} />
        </div>
      </div>
    </button>
  );
}

// View Report Modal Component
function ViewReportModal({ report, onClose }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-lg backdrop-blur-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{report.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {report.created_by_profile && (
                <div className="flex items-center gap-1">
                  <User size={14} className="text-cyan-500" />
                  <span>Created by {report.created_by_profile.full_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-cyan-500" />
                <span>{formatDate(report.created_at)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {report.content}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-foreground">{value || "Not provided"}</p>
    </div>
  );
}
