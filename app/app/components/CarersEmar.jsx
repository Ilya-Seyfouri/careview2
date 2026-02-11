"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useDemoUser } from "../components/DemoContext";
import {
  Search,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Pill,
  X,
  Plus,
  Check,
} from "lucide-react";

const TIME_ROUNDS = [
  { label: "Morning", range: ["06:00", "12:00"] },
  { label: "Lunch", range: ["12:00", "14:00"] },
  { label: "Teatime", range: ["14:00", "18:00"] },
  { label: "Night", range: ["18:00", "23:59"] },
];

export default function Emar() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [emarData, setEmarData] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeRound, setActiveRound] = useState("Morning");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [administeringId, setAdministeringId] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Re-fetch whenever the demo user changes (same pattern as MyClients)
  useEffect(() => {
    if (demoUser?.id) {
      fetchData(demoUser);
    }
  }, [demoUser]);

  const fetchData = async (user) => {
    try {
      setLoading(true);

      let patientIds = null;

      if (user.role === "carer") {
        // 1. Get patient IDs assigned to this carer
        const { data: assignments, error: assignError } = await supabase
          .from("patient_carers")
          .select("patient_id")
          .eq("carer_id", user.id);

        if (assignError) throw assignError;

        if (!assignments || assignments.length === 0) {
          setPatients({});
          setEmarData([]);
          setLoading(false);
          return;
        }

        patientIds = assignments.map((a) => a.patient_id);
      }

      // 2. Fetch patients — filtered if carer, all if manager/admin
      let patQuery = supabase
        .from("patients")
        .select("id, full_name, room, wing");

      if (patientIds !== null) {
        patQuery = patQuery.in("id", patientIds);
      }

      const { data: pats, error: patsError } = await patQuery;
      if (patsError) throw patsError;

      const patMap = {};
      (pats || []).forEach((p) => (patMap[p.id] = p));
      setPatients(patMap);

      // 3. Fetch EMAR — filtered to those patient IDs if carer
      let emarQuery = supabase.from("emar").select("*");
      if (patientIds !== null) {
        emarQuery = emarQuery.in("patient_id", patientIds);
      }

      const { data: emar, error: emarError } = await emarQuery;
      if (emarError) throw emarError;

      setEmarData(emar || []);
    } catch (err) {
      console.error("Error fetching EMAR data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminister = async (e, entry) => {
    e.stopPropagation();
    try {
      setAdministeringId(entry.id);

      const { error } = await supabase
        .from("emar")
        .update({ status: "given" })
        .eq("id", entry.id);

      if (error) throw error;

      // Audit log: medication administered
      const actorId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

      await supabase.from("audit_logs").insert({
        action_type: "emar_administered",
        actor_id: actorId,
        related_to: entry.patient_id,
        created_at: new Date().toISOString(),
      });

      setEmarData((prev) =>
        prev.map((r) => (r.id === entry.id ? { ...r, status: "given" } : r)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAdministeringId(null);
    }
  };
  const isInRound = (time, round) => {
    const [start, end] = round.range;
    return time >= start && time < end;
  };

  const roundEntries = emarData.filter((e) => {
    const round = TIME_ROUNDS.find((r) => r.label === activeRound);
    return round ? isInRound(e.time_to_take, round) : true;
  });

  const filteredEntries = roundEntries.filter((entry) => {
    const patient = patients[entry.patient_id];
    const name = patient?.full_name?.toLowerCase() || "";
    const med = entry.medication_name?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || med.includes(term);
  });

  const given = roundEntries.filter((e) => e.status === "given").length;
  const total = roundEntries.length;
  const missed = roundEntries.filter((e) => e.status === "missed").length;
  const percent = total > 0 ? Math.round((given / total) * 100) : 0;
  const missedEntries = emarData.filter((e) => e.status === "missed");

  const isAdmin = demoUser?.role !== "carer";
  const isLoading = userLoading || loading;

  const getStatusStyle = (status) => {
    switch (status) {
      case "given":
        return {
          pill: "bg-green-100 text-green-700 border border-green-200",
          label: "GIVEN",
        };
      case "due":
        return {
          pill: "bg-amber-100 text-amber-700 border border-amber-200",
          label: "DUE",
        };
      case "missed":
        return {
          pill: "bg-red-100 text-red-600 border border-red-200",
          label: "MISSED",
        };
      default:
        return {
          pill: "bg-gray-100 text-gray-500 border border-gray-200",
          label: status,
        };
    }
  };

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
              Electronic MAR
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isLoading
                ? "Loading..."
                : demoUser?.role === "carer"
                  ? `Showing your assigned residents · ${demoUser.full_name}`
                  : `All residents · ${demoUser?.full_name ?? ""}`}
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowAuditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
              >
                <Clock size={16} />
                Audit MAR
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 transition-all">
              <Calendar size={16} />
              View Schedule
            </button>
          </div>
        </div>

        {/* Carer scope banner */}
        {demoUser?.role === "carer" && !isLoading && (
          <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-5 py-3 mb-6 text-sm text-cyan-700">
            <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            You are viewing medication records for your{" "}
            <span className="font-bold">
              {Object.keys(patients).length} assigned residents
            </span>{" "}
            only.
          </div>
        )}

        {/* Round Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 w-fit mb-8 shadow-sm">
          {TIME_ROUNDS.map((round) => (
            <button
              key={round.label}
              onClick={() => setActiveRound(round.label)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeRound === round.label
                  ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {round.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Round Progress
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Administered
                </span>
                <span className="text-sm font-bold text-green-600">
                  {percent}%
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Scheduled Medications
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Missed / Refused
                  </span>
                  <span
                    className={`text-sm font-bold ${missed > 0 ? "text-red-500" : "text-gray-800"}`}
                  >
                    {missed}
                  </span>
                </div>
              </div>
            </div>

            {missedEntries.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <p className="text-sm font-bold text-amber-700">
                    Critical Warning
                  </p>
                </div>
                <div className="space-y-2">
                  {missedEntries.slice(0, 3).map((entry) => {
                    const patient = patients[entry.patient_id];
                    if (!patient) return null;
                    return (
                      <p
                        key={entry.id}
                        className="text-xs text-amber-700 leading-relaxed"
                      >
                        <span className="font-semibold">
                          {patient.full_name}
                        </span>{" "}
                        (Room {patient.room}) missed{" "}
                        <span className="font-semibold">
                          {entry.medication_name}
                        </span>{" "}
                        at {entry.time_to_take}.
                      </p>
                    );
                  })}
                  {missedEntries.length > 3 && (
                    <p className="text-xs text-amber-600 font-semibold">
                      +{missedEntries.length - 3} more missed doses
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Table */}
          <div className="flex-1">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search resident or medication..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-sm"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all shadow-sm font-medium">
                <Filter size={15} />
                Filters
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                  Loading medications...
                </div>
              ) : Object.keys(patients).length === 0 &&
                demoUser?.role === "carer" ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Pill className="text-gray-200 mb-3" size={40} />
                  <p className="text-gray-500 text-sm font-medium">
                    No residents assigned to you yet
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Contact your manager to be assigned residents
                  </p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Pill className="text-gray-200 mb-3" size={40} />
                  <p className="text-gray-400 text-sm">
                    No medications for this round
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-12 px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="col-span-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Resident
                    </div>
                    <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Medication
                    </div>
                    <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Time
                    </div>
                    <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </div>
                    <div className="col-span-1 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                      Actions
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {filteredEntries.map((entry) => {
                      const patient = patients[entry.patient_id];
                      const { pill, label } = getStatusStyle(entry.status);
                      const isAdministering = administeringId === entry.id;
                      return (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                              {patient?.room || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {patient?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">
                                {patient?.wing || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-3 flex items-center gap-2">
                            <Pill
                              size={14}
                              className="text-cyan-400 flex-shrink-0"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {entry.medication_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {entry.medication_mg}mg
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {entry.time_to_take}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${pill}`}
                            >
                              {label}
                            </span>
                            {entry.status === "missed" && (
                              <p className="text-xs text-red-400 mt-1">
                                Refused
                              </p>
                            )}
                          </div>
                          <div className="col-span-1 flex justify-end items-center">
                            {entry.status === "due" ? (
                              <button
                                onClick={(e) => handleAdminister(e, entry)}
                                disabled={isAdministering}
                                className="px-3 py-1.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 hover:from-cyan-500 hover:to-cyan-700 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                              >
                                {isAdministering ? "..." : "Administer"}
                              </button>
                            ) : (
                              <ChevronRight
                                size={16}
                                className="text-gray-300"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          patient={patients[selectedEntry.patient_id]}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {showAuditModal && (
        <AddEmarModal
          patients={Object.values(patients)}
          onClose={() => setShowAuditModal(false)}
          onSuccess={() => {
            setShowAuditModal(false);
            fetchData(demoUser);
          }}
          supabase={supabase}
        />
      )}
    </section>
  );
}

function AddEmarModal({ patients, onClose, onSuccess, supabase }) {
  const [formData, setFormData] = useState({
    patient_id: "",
    medication_name: "",
    medication_mg: "",
    time_to_take: "",
    status: "due",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.patient_id ||
      !formData.medication_name ||
      !formData.medication_mg ||
      !formData.time_to_take
    ) {
      setError("Please fill in all required fields");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from("emar").insert([
        {
          patient_id: formData.patient_id,
          medication_name: formData.medication_name,
          medication_mg: parseInt(formData.medication_mg),
          time_to_take: formData.time_to_take,
          status: formData.status,
        },
      ]);
      if (insertError) throw insertError;
      setSuccess(true);
      setTimeout(() => onSuccess(), 800);
    } catch (err) {
      setError(err.message || "Failed to add medication");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors text-sm";
  const sortedPatients = [...patients].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );
  const COMMON_TIMES = ["08:00", "12:00", "14:00", "18:00", "20:00", "22:00"];
  const COMMON_MEDS = [
    "Aspirin",
    "Amlodipine",
    "Atorvastatin",
    "Bisoprolol",
    "Donepezil",
    "Furosemide",
    "Metformin",
    "Omeprazole",
    "Ramipril",
    "Sertraline",
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Audit MAR</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Add a new medication record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
              <option value="">Select a resident...</option>
              {sortedPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} — Room {p.room} ({p.wing})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Medication Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              list="med-suggestions"
              value={formData.medication_name}
              onChange={(e) =>
                setFormData({ ...formData, medication_name: e.target.value })
              }
              className={inputClass}
              placeholder="e.g. Metformin"
              required
            />
            <datalist id="med-suggestions">
              {COMMON_MEDS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_MEDS.slice(0, 5).map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, medication_name: med })
                  }
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${formData.medication_name === med ? "bg-cyan-500 text-white border-cyan-500" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-cyan-300 hover:text-cyan-600"}`}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Dosage (mg) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.medication_mg}
                onChange={(e) =>
                  setFormData({ ...formData, medication_mg: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={formData.time_to_take}
                onChange={(e) =>
                  setFormData({ ...formData, time_to_take: e.target.value })
                }
                className={inputClass}
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_TIMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, time_to_take: t })
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${formData.time_to_take === t ? "bg-cyan-500 text-white border-cyan-500" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-cyan-300 hover:text-cyan-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Initial Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "due", label: "Due", color: "amber" },
                { value: "given", label: "Given", color: "green" },
                { value: "missed", label: "Missed", color: "red" },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: value })}
                  className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                    formData.status === value
                      ? color === "amber"
                        ? "bg-amber-50 border-amber-400 text-amber-700"
                        : color === "green"
                          ? "bg-green-50 border-green-400 text-green-700"
                          : "bg-red-50 border-red-400 text-red-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${success ? "bg-green-500 text-white" : "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 active:scale-95 disabled:opacity-50"}`}
            >
              {success ? (
                <>
                  <Check size={16} />
                  Added!
                </>
              ) : saving ? (
                "Saving..."
              ) : (
                <>
                  <Plus size={16} />
                  Add Medication
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EntryDetailModal({ entry, patient, onClose }) {
  const { pill, label } = (() => {
    switch (entry.status) {
      case "given":
        return {
          pill: "bg-green-100 text-green-700 border border-green-200",
          label: "GIVEN",
        };
      case "due":
        return {
          pill: "bg-amber-100 text-amber-700 border border-amber-200",
          label: "DUE",
        };
      case "missed":
        return {
          pill: "bg-red-100 text-red-600 border border-red-200",
          label: "MISSED",
        };
      default:
        return {
          pill: "bg-gray-100 text-gray-500 border border-gray-200",
          label: entry.status,
        };
    }
  })();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Medication Detail</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
              {patient?.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-bold text-gray-800">
                {patient?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                Room {patient?.room} · {patient?.wing}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Medication", value: entry.medication_name },
              { label: "Dosage", value: `${entry.medication_mg}mg` },
              { label: "Scheduled Time", value: entry.time_to_take },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase ${pill}`}
              >
                {label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
