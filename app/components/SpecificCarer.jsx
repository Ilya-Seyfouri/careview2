"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Clock,
  AlertCircle,
  Users,
  CalendarDays,
  Plus,
  X,
  Trash2,
  MapPin,
  Activity,
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

      const res = await fetch(`/api/specific-carer/${carerId}`);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Carer not found");
        return;
      }

      const { carer, assignedPatients, upcomingSchedules } = await res.json();

      setCarer(carer);
      setAssignedPatients(assignedPatients);
      setUpcomingSchedules(upcomingSchedules);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Failed to load carer information");
    } finally {
      setLoading(false);
    }
  };

const handleUnassignPatient = async (patientId) => {
  try {
    const res = await fetch(
      `/api/carer/${carerId}/clients?patient_id=${patientId}`,
      {
        method: "DELETE",
      },
    );

    if (!res.ok) throw new Error("Failed to unassign patient");

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            Loading carer information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !carer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-rose-400 mx-auto mb-6 opacity-20" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {error || "Carer Not Found"}
          </h1>
          <button
            onClick={() => router.push("/carerslist")}
            className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to Carers
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-slate-50"
      >
        {" "}
        <div className="container mx-auto px-6 lg:px-10 py-10">
          {/* Back Button */}
          <button
            onClick={() => router.push("/carerslist")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            <span>Back to Carers</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Sidebar - Profile */}
            <div className="lg:w-80 space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden p-10 text-center relative">
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-slate-900 to-slate-800 -z-0"></div>

                <div className="relative z-10 pt-4">
                  <div className="w-32 h-32 rounded-[28px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl ring-[12px] ring-white mx-auto mb-6">
                    {getInitials(carer.full_name)}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {carer.full_name || "N/A"}
                  </h2>
                  <p className="text-sm text-slate-500 mb-4 capitalize font-bold uppercase tracking-widest">
                    {carer.role || "N/A"}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Contact Information
                </h3>
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={12} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Email
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 font-bold break-words">
                      {carer.email || "Not provided"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone size={12} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Phone
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 font-bold">
                      {carer.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Account Details
                </h3>
                <div className="p-4 rounded-2xl bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Joined
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {formatDate(carer.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={<Users size={26} />}
                  label="Assigned Patients"
                  value={assignedPatients.length.toString()}
                  color="blue"
                />
                <StatCard
                  icon={<CalendarDays size={26} />}
                  label="Upcoming Shifts"
                  value={upcomingSchedules.length.toString()}
                  color="purple"
                />
                <StatCard
                  icon={<Clock size={26} />}
                  label="Total Schedules"
                  value={upcomingSchedules.length.toString()}
                  color="emerald"
                />
              </div>

              {/* Assigned Patients Section */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    Assigned Patients
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 cursor-pointer px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Plus size={16} strokeWidth={3} />
                    <span>Assign Patient</span>
                  </button>
                </div>

                {assignedPatients.length > 0 ? (
                  <div className="space-y-4">
                    {assignedPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[20px] flex items-center justify-center text-white text-lg font-black shadow-lg flex-shrink-0">
                              {getInitials(patient.full_name)}
                            </div>
                            <div>
                              <p className="font-black text-lg text-slate-900 tracking-tight">
                                {patient.full_name}
                              </p>
                              <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                <MapPin size={14} />
                                Room: {patient.room || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ring-1 ${
                                patient.status?.toLowerCase() === "stable"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                  : patient.status?.toLowerCase() ===
                                      "attention"
                                    ? "bg-amber-50 text-amber-700 ring-amber-100"
                                    : "bg-rose-50 text-rose-700 ring-rose-100"
                              }`}
                            >
                              {patient.status || "Unknown"}
                            </span>
                            <button
                              onClick={() => handleUnassignPatient(patient.id)}
                              className="p-3 hover:bg-rose-50 rounded-xl transition-colors group"
                              title="Unassign patient"
                            >
                              <Trash2
                                size={18}
                                className="text-slate-400 cursor-pointer group-hover:text-rose-600"
                                strokeWidth={2.5}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-300">
                    <Users size={80} className="mx-auto mb-6 opacity-10" />
                    <p className="font-black text-xl text-slate-900 tracking-tight mb-2">
                      No patients assigned yet
                    </p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="mt-4 px-6 py-3 bg-blue-50 text-blue-700 ring-1 ring-blue-100 rounded-xl hover:bg-blue-100 transition-colors font-black text-xs uppercase tracking-widest"
                    >
                      Assign First Patient
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Schedules Section */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <CalendarDays size={20} className="text-purple-600" />
                  </div>
                  Upcoming Schedules
                </h3>

                {upcomingSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSchedules.map((schedule) => (
                      <motion.div
                        key={schedule.id}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className="bg-slate-50 border border-slate-200 rounded-[20px] p-5 hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Left — icon + time */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Clock size={16} className="text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-sm text-slate-900 tracking-tight truncate">
                                {formatDateTime(schedule.start_at)}
                              </p>
                            </div>
                          </div>

                          {/* Right — patient + status */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {schedule.patients && (
                              <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900 tracking-tight">
                                  {schedule.patients.full_name}
                                </p>
                                <p className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1 mt-0.5">
                                  <MapPin size={10} />
                                  Room {schedule.patients.room || "N/A"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                      <CalendarDays size={28} className="text-slate-300" />
                    </div>
                    <p className="font-black text-lg text-slate-900 tracking-tight mb-1">
                      No upcoming schedules
                    </p>
                    <p className="text-sm text-slate-400 font-medium">
                      Scheduled visits will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailablePatients();
  }, []);

  const fetchAvailablePatients = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch patients");
      const patientsData = await res.json();

      const assignedPatientIds = assignedPatients.map((p) => p.id);
      const availablePatients = patientsData.filter(
        (p) => !assignedPatientIds.includes(p.id),
      );

      setAllPatients(availablePatients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (patientId) => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/carer/${carerId}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign patient");
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to assign patient");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-50 pt-15 p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Assign Patient
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Select a patient to assign to this carer
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500 cursor-pointer" />
          </button>
        </div>

        {/* Body */}
        <div className="px-10 pb-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Activity size={48} className="mb-4 opacity-10 animate-pulse" />
              <p className="font-black text-lg text-slate-900 tracking-tight">
                Loading patients...
              </p>
            </div>
          ) : allPatients.length === 0 ? (
            <div className="text-center py-16">
              <Users size={64} className="mx-auto mb-6 text-slate-200" />
              <p className="font-black text-lg text-slate-900 tracking-tight mb-2">
                All Assigned
              </p>
              <p className="text-slate-500 mb-6 font-medium">
                All patients are already assigned to this carer
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                {allPatients.length} patient{allPatients.length !== 1 && "s"}{" "}
                available
              </p>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-rose-700 font-bold">{error}</p>
                </div>
              )}

              {/* Patient Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {allPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                          {patient.full_name?.charAt(0) ?? "?"}
                        </div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">
                          {patient.full_name}
                        </h3>
                      </div>
                      <motion.button
                        onClick={() => handleAssign(patient.id)}
                        disabled={saving}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 px-3 py-1.5 cursor-pointer bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "..." : "Assign"}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full  cursor-pointer px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      ring: "ring-blue-100",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      ring: "ring-purple-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
  };
  const cfg = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
      <div
        className={`w-14 h-14 ${cfg.bg} rounded-[20px] flex items-center justify-center ${cfg.text} mb-4 shadow-sm ring-1 ${cfg.ring}`}
      >
        {icon}
      </div>
      <p className="text-4xl font-black text-slate-900 tracking-tight mb-2">
        {value}
      </p>
      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}
