"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Clock,
  AlertCircle,
  Star,
  Users,
  CalendarDays,
  Plus,
  X,
  Trash2,
} from "lucide-react";

export default function SpecificCarer({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [carer, setCarer] = useState(null);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const unwrappedParams = use(params);
  const carerId = unwrappedParams.id;

  useEffect(() => {
    if (!carerId) return;
    fetchCarerData();
  }, [carerId]);

  const fetchCarerData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Carer Profile
      const { data: carerData, error: carerError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", carerId)
        .eq("role", "carer")
        .single();

      if (carerError) {
        console.error("Carer Error:", carerError);
        setError("Carer not found");
        return;
      }

      setCarer(carerData);

      // 2. Fetch Assigned Patients via patient_carers join table
      const { data: patientCarersData, error: patientCarersError } =
        await supabase
          .from("patient_carers")
          .select(
            `
            patient_id,
            patients (
              id,
              full_name,
              room,
              status
            )
          `,
          )
          .eq("carer_id", carerId);

      if (patientCarersError) {
        console.error("Patient Carers Error:", patientCarersError);
      } else {
        // Extract patient data from the nested structure
        const patients = patientCarersData
          .map((pc) => pc.patients)
          .filter((p) => p !== null);
        setAssignedPatients(patients);
      }

      // 3. Fetch Upcoming Schedules
      const now = new Date().toISOString();
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(
          `
          *,
          patients (
            full_name,
            room
          )
        `,
        )
        .eq("carer_id", carerId)
        .gte("start_at", now)
        .order("start_at", { ascending: true })
        .limit(10);

      if (schedulesError) {
        console.error("Schedules Error:", schedulesError);
      } else {
        setUpcomingSchedules(schedulesData || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load carer information");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPatient = async (patientId) => {
    if (!confirm("Are you sure you want to unassign this patient?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("patient_carers")
        .delete()
        .eq("carer_id", carerId)
        .eq("patient_id", patientId);

      if (error) throw error;

      // Refresh the data
      await fetchCarerData();
    } catch (err) {
      console.error("Error unassigning patient:", err);
      alert("Failed to unassign patient");
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading carer information...</p>
        </div>
      </div>
    );
  }

  if (error || !carer) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Carer Not Found"}
          </h1>
          <button
            onClick={() => router.push("/carerslist")}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
          >
            Back to Carers
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          {/* Back Button */}
          <button
            onClick={() => router.push("/carerslist")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Carers</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Profile */}
            <div className="lg:w-80 space-y-6">
              {/* Profile Card */}
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-cyan-500/30 mx-auto mb-4">
                  {getInitials(carer.full_name)}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {carer.full_name || "N/A"}
                </h2>
                <p className="text-sm text-muted-foreground mb-4 capitalize">
                  {carer.role || "N/A"}
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  Active Carer
                </span>
              </div>

              {/* Contact Info */}
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Mail size={12} />
                      <span>Email</span>
                    </div>
                    <p className="text-sm text-foreground pl-5 break-words">
                      {carer.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Phone size={12} />
                      <span>Phone</span>
                    </div>
                    <p className="text-sm text-foreground pl-5">
                      {carer.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Account Details
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-cyan-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="text-foreground">
                        {formatDate(carer.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={<Users size={24} />}
                  label="Assigned Patients"
                  value={assignedPatients.length.toString()}
                  color="cyan"
                />
                <StatCard
                  icon={<CalendarDays size={24} />}
                  label="Upcoming Shifts"
                  value={upcomingSchedules.length.toString()}
                  color="blue"
                />
                <StatCard
                  icon={<Clock size={24} />}
                  label="Total Schedules"
                  value={upcomingSchedules.length.toString()}
                  color="purple"
                />
              </div>

              {/* Assigned Patients Section */}
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Users size={20} className="text-cyan-500" />
                    Assigned Patients
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold text-sm shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Assign Patient</span>
                  </button>
                </div>

                {assignedPatients.length > 0 ? (
                  <div className="space-y-3">
                    {assignedPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="bg-white/5 border border-white/10 p-4 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
                              {getInitials(patient.full_name)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {patient.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Room: {patient.room || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                patient.status === "Stable"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : patient.status === "Attention"
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {patient.status || "Unknown"}
                            </span>
                            <button
                              onClick={() => handleUnassignPatient(patient.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                              title="Unassign patient"
                            >
                              <Trash2
                                size={16}
                                className="text-muted-foreground group-hover:text-red-400"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No patients assigned yet</p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                    >
                      Assign First Patient
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Schedules Section */}
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-8">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CalendarDays size={20} className="text-cyan-500" />
                  Upcoming Schedules
                </h3>
                {upcomingSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-white/5 border border-white/10 p-4 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock size={14} className="text-cyan-500" />
                              <p className="font-semibold text-foreground text-sm">
                                {formatDateTime(schedule.start_at)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground ml-5">
                              to {formatDateTime(schedule.end_at)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              schedule.status === "scheduled"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : schedule.status === "completed"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
                          >
                            {schedule.status || "Pending"}
                          </span>
                        </div>
                        {schedule.patients && (
                          <div className="ml-5 mt-2 text-sm">
                            <p className="text-muted-foreground">
                              Patient:{" "}
                              <span className="text-foreground font-medium">
                                {schedule.patients.full_name}
                              </span>
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Room: {schedule.patients.room || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays
                      size={48}
                      className="mx-auto mb-2 opacity-30"
                    />
                    <p>No upcoming schedules</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <AssignPatientModal
          carerId={carerId}
          assignedPatients={assignedPatients}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchCarerData();
          }}
        />
      )}
    </>
  );
}

function AssignPatientModal({ carerId, assignedPatients, onClose, onSuccess }) {
  const supabase = createClient();
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailablePatients();
  }, []);

  const fetchAvailablePatients = async () => {
    try {
      setLoading(true);

      // Fetch all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, room, status")
        .order("full_name", { ascending: true });

      if (patientsError) throw patientsError;

      // Filter out already assigned patients
      const assignedPatientIds = assignedPatients.map((p) => p.id);
      const availablePatients = patientsData.filter(
        (p) => !assignedPatientIds.includes(p.id),
      );

      setAllPatients(availablePatients || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: insertError } = await supabase
        .from("patient_carers")
        .insert([
          {
            patient_id: selectedPatient,
            carer_id: carerId,
            assigned_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      // Audit log: patient assigned to carer
      await supabase.from("audit_logs").insert({
        action_type: "carer_assigned_to_patient",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: selectedPatient,
        created_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (err) {
      console.error("Error assigning patient:", err);
      setError(err.message || "Failed to assign patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-md w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Assign Patient</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading patients...</p>
            </div>
          </div>
        ) : allPatients.length === 0 ? (
          <div className="text-center py-8">
            <Users
              size={48}
              className="mx-auto mb-4 text-muted-foreground opacity-30"
            />
            <p className="text-muted-foreground mb-4">
              All patients are already assigned to this carer
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 border border-white/10 text-foreground rounded-lg hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Patient *
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                required
              >
                <option value="">Choose a patient...</option>
                {allPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name} - Room {patient.room} ({patient.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                {allPatients.length} patient(s) available to assign
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-foreground rounded-lg hover:bg-white/10 transition-all font-semibold"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Assigning..." : "Assign Patient"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    cyan: "from-cyan-400 to-cyan-600",
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600",
  };

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-lg p-6 backdrop-blur-xl">
      <div
        className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-lg flex items-center justify-center text-white mb-3 shadow-lg`}
      >
        {icon}
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
