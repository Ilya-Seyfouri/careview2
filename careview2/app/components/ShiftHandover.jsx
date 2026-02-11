"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useDemoUser } from "../components/DemoContext";
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Plus,
  X,
  ChevronRight,
  FileText,
} from "lucide-react";

const SHIFT_TYPES = [
  { value: "AM->PM", label: "AM to PM Transition" },
  { value: "PM->AM", label: "PM to AM Transition" },
];

export default function ShiftHandover() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [patients, setPatients] = useState([]);
  const [pastHandovers, setPastHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [shiftType, setShiftType] = useState("AM->PM");
  const [generalNotes, setGeneralNotes] = useState("");
  const [redFlags, setRedFlags] = useState([]); // [{ patient_id, patient_notes }]
  const [newFlag, setNewFlag] = useState({ patient_id: "", patient_notes: "" });
  const [addingFlag, setAddingFlag] = useState(false);

  useEffect(() => {
    if (demoUser?.id) fetchData(demoUser);
  }, [demoUser]);

  const fetchData = async (user) => {
    try {
      setLoading(true);

      let patientIds = null;
      if (user.role === "carer") {
        const { data: assignments } = await supabase
          .from("patient_carers")
          .select("patient_id")
          .eq("carer_id", user.id);
        patientIds = (assignments || []).map((a) => a.patient_id);
      }

      let patQuery = supabase
        .from("patients")
        .select("id, full_name, room, wing");
      if (patientIds !== null) patQuery = patQuery.in("id", patientIds);
      const { data: pats } = await patQuery;
      setPatients(pats || []);

      const { data: past } = await supabase
        .from("shift_handovers")
        .select("id, shift_type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setPastHandovers(past || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlag = () => {
    if (!newFlag.patient_id) return;
    setRedFlags((prev) => [...prev, { ...newFlag }]);
    setNewFlag({ patient_id: "", patient_notes: "" });
    setAddingFlag(false);
  };

  const handleRemoveFlag = (idx) => {
    setRedFlags((prev) => prev.filter((_, i) => i !== idx));
  };

const handleSubmit = async () => {
  setError(null);

  if (redFlags.length === 0) {
    setError("Please add at least one resident red flag before saving.");
    return;
  }

  try {
    setSaving(true);

    const rows = redFlags.map((flag) => ({
      patient_id: flag.patient_id,
      shift_type: shiftType,
      notes: generalNotes || null,
      patient_notes: flag.patient_notes || null,
      created_by: demoUser.id,
    }));

    const { data: insertedHandovers, error: insertError } = await supabase
      .from("shift_handovers")
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    // Audit log: shift handover created (one log per handover created)
    // Use manager ID (aaa...) if manager, or carer ID (bbb...) if carer
    const actorId =
      demoUser.role === "carer"
        ? "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
        : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const auditLogs = insertedHandovers.map((handover) => ({
      action_type: "shift_handover_created",
      actor_id: actorId,
      related_to: handover.patient_id,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("audit_logs").insert(auditLogs);

    setSaved(true);
    setTimeout(() => {
      setGeneralNotes("");
      setRedFlags([]);
      setSaved(false);
      fetchData(demoUser);
    }, 1200);
  } catch (err) {
    setError(err.message || "Failed to save handover");
  } finally {
    setSaving(false);
  }
};

  const sortedPatients = [...patients].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );
  const flaggedPatientIds = redFlags.map((f) => f.patient_id);
  const availablePatients = sortedPatients.filter(
    (p) => !flaggedPatientIds.includes(p.id),
  );
  const getPatient = (id) => patients.find((p) => p.id === id);

  const completionSteps = [
    { label: "Shift direction set", done: !!shiftType },
    { label: "General observations", done: generalNotes.trim().length > 0 },
    { label: "Resident flags added", done: redFlags.length > 0 },
  ];
  const completionPct = Math.round(
    (completionSteps.filter((s) => s.done).length / completionSteps.length) *
      100,
  );

  const isLoading = userLoading || loading;

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 pt-10 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
              Shift Handover
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Critical communication between AM and PM shifts
            </p>
          </div>
          <div className="flex gap-3">
            
            <button
              onClick={() => handleSubmit("published")}
              disabled={saving || saved || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 transition-all disabled:opacity-50 active:scale-95"
            >
              <Send size={16} />
              {saving
                ? "Publishing..."
                : saved
                  ? "Published!"
                  : "Publish Handover"}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shift Direction */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center">
                    <ArrowRight size={18} className="text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Shift Direction
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Required
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SHIFT_TYPES.map((shift) => (
                    <button
                      key={shift.value}
                      onClick={() => setShiftType(shift.value)}
                      className={`py-3.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                        shiftType === shift.value
                          ? "bg-cyan-50 border-cyan-400 text-cyan-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-bold">
                        {shift.value === "AM->PM" ? "AM" : "PM"}
                      </span>
                      <ArrowRight size={14} />
                      <span className="font-bold">
                        {shift.value === "AM->PM" ? "PM" : "AM"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* General Observations */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      General Observations
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Mandatory Field
                    </p>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors text-sm resize-none"
                  placeholder="Summarise general facility status, maintenance issues, or site-wide events..."
                />
              </div>

              {/* Resident Red Flags */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Resident Red Flags
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                      Per-resident concerns
                    </p>
                  </div>
                </div>

                {/* Existing flags */}
                <div className="space-y-3 mb-4">
                  {redFlags.map((flag, idx) => {
                    const patient = getPatient(flag.patient_id);
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-sm font-bold text-red-500 flex-shrink-0">
                          {patient?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-red-700">
                            {patient?.full_name} — {patient?.room}
                          </p>
                          <p className="text-sm text-red-600 mt-0.5 leading-relaxed">
                            {flag.patient_notes || (
                              <span className="italic text-red-400">
                                No notes added
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFlag(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Inline add form */}
                {addingFlag ? (
                  <div className="border-2 border-dashed border-cyan-200 rounded-xl p-4 bg-cyan-50/30 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Select Resident
                      </label>
                      <select
                        value={newFlag.patient_id}
                        onChange={(e) =>
                          setNewFlag({ ...newFlag, patient_id: e.target.value })
                        }
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors"
                      >
                        <option value="">Choose a resident...</option>
                        {availablePatients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name} — Room {p.room} ({p.wing})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Patient Notes
                      </label>
                      <textarea
                        rows={2}
                        value={newFlag.patient_notes}
                        onChange={(e) =>
                          setNewFlag({
                            ...newFlag,
                            patient_notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors resize-none"
                        placeholder="e.g. Refused morning meds, breathing slightly laboured..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingFlag(false);
                          setNewFlag({ patient_id: "", patient_notes: "" });
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddFlag}
                        disabled={!newFlag.patient_id}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-cyan-500/20 hover:from-cyan-500 hover:to-cyan-700 transition-all disabled:opacity-40"
                      >
                        Add Flag
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingFlag(true)}
                    disabled={availablePatients.length === 0}
                    className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 font-medium hover:border-cyan-300 hover:text-cyan-500 hover:bg-cyan-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus size={15} />
                    Add New Flag
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle
                    size={16}
                    className="text-red-500 flex-shrink-0"
                  />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="space-y-5">
              {/* Handover Details — dark card */}
              <div className="bg-gray-900 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-5">
                  <Clock size={17} className="text-cyan-400" />
                  <h3 className="text-base font-bold text-white">
                    Handover Details
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Date</span>
                    <span className="text-sm font-bold text-white">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Shift</span>
                    <span className="text-sm font-semibold text-cyan-400">
                      {SHIFT_TYPES.find((s) => s.value === shiftType)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Author</span>
                    <span className="text-sm font-bold text-white">
                      {demoUser?.full_name || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Flags</span>
                    <span className="text-sm font-bold text-white">
                      {redFlags.length} resident
                      {redFlags.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Completion status */}
                <div className="mt-6 pt-5 border-t border-gray-700/60">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Completion Status
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white w-9 text-right">
                      {completionPct}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completionSteps.map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                            done ? "bg-cyan-400" : "bg-gray-600"
                          }`}
                        />
                        <span
                          className={`text-xs transition-colors ${
                            done ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Past Handovers */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-4">
                  Past Handovers
                </h3>
                {pastHandovers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">
                    No past handovers found
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {pastHandovers.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between py-3.5 group cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {new Date(h.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                            {h.shift_type === "AM->PM"
                              ? "AM Shift"
                              : "PM Shift"}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-gray-300 group-hover:text-cyan-400 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
