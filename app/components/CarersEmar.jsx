"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useDemoUser } from "./DemoContext";
import { motion } from "framer-motion";
import {
  Search,
  AlertTriangle,
  ChevronRight,
  Pill,
  X,
  Activity,
} from "lucide-react";

const TIME_ROUNDS = [
  { label: "Morning", range: ["06:00", "12:00"] },
  { label: "Lunch", range: ["12:00", "14:00"] },
  { label: "Teatime", range: ["14:00", "18:00"] },
  { label: "Night", range: ["18:00", "23:59"] },
];

export default function CarerEmar() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [emarData, setEmarData] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeRound, setActiveRound] = useState("Morning");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [administeringId, setAdministeringId] = useState(null);

  useEffect(() => {
    if (demoUser?.id) {
      fetchData(demoUser);
    }
  }, [demoUser]);

  const fetchData = async (user) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/carer-emar/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch EMAR data");
      const { emar, patients } = await res.json();

      setPatients(patients);
      setEmarData(emar);
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

      const res = await fetch(`/api/carer-emar/${demoUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, patient_id: entry.patient_id }),
      });

      if (!res.ok) throw new Error("Failed to administer medication");

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

  const filteredEntries = roundEntries
    .filter((entry) => {
      const patient = patients[entry.patient_id];
      const name = patient?.full_name?.toLowerCase() || "";
      const med = entry.medication_name?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return name.includes(term) || med.includes(term);
    })
    .sort((a, b) => {
      // Status priority: due (0) -> missed (1) -> given (2)
      const statusPriority = {
        due: 0,
        missed: 1,
        given: 2,
      };

      const aPriority = statusPriority[a.status] ?? 3;
      const bPriority = statusPriority[b.status] ?? 3;

      // First sort by status priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by time within same status
      return a.time_to_take.localeCompare(b.time_to_take);
    });

  const given = roundEntries.filter((e) => e.status === "given").length;
  const total = roundEntries.length;
  const missed = roundEntries.filter((e) => e.status === "missed").length;
  const percent = total > 0 ? Math.round((given / total) * 100) : 0;
  const missedEntries = emarData.filter((e) => e.status === "missed");

  const isLoading = userLoading || loading;

  const getStatusStyle = (status) => {
    switch (status) {
      case "given":
        return {
          pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
          label: "GIVEN",
        };
      case "due":
        return {
          pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
          label: "DUE",
        };
      case "missed":
        return {
          pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
          label: "MISSED",
        };
      default:
        return {
          pill: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
          label: status,
        };
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-slate-50"
    >
      {" "}
      <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 ring-1 ring-slate-100">
            <Pill size={10} />
            Medication Administration
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Electronic MAR
          </h2>
          <p className="text-slate-500 text-base font-medium mt-1">
            Medication Tracking
          </p>
        </div>

        {/* Carer scope banner */}
        {!isLoading && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-[20px] px-6 py-4 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
            <p className="text-sm text-blue-900 font-medium">
              You are viewing medication records for your{" "}
              <span className="font-black">
                {Object.keys(patients).length} assigned residents
              </span>{" "}
              only.
            </p>
          </div>
        )}

        {/* Round Tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm mb-8">
          {TIME_ROUNDS.map((round) => (
            <button
              key={round.label}
              onClick={() => setActiveRound(round.label)}
              className={`px-5 py-2 rounded-lg cursor-pointer text-[11px] font-black uppercase tracking-widest transition-all ${
                activeRound === round.label
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {round.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0 space-y-5">
            <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-5">
                Round Progress
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Administered
                </span>
                <span className="text-xs font-black text-emerald-600">
                  {percent}%
                </span>
              </div>
              <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden mb-5 ring-1 ring-slate-100">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Scheduled
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {total}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Missed
                  </span>
                  <span
                    className={`text-sm font-black ${missed > 0 ? "text-rose-500" : "text-slate-900"}`}
                  >
                    {missed}
                  </span>
                </div>
              </div>
            </div>

            {missedEntries.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <AlertTriangle size={16} />
                  </div>
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest">
                    Critical Warning
                  </h3>
                </div>
                <div className="space-y-2">
                  {missedEntries.slice(0, 3).map((entry) => {
                    const patient = patients[entry.patient_id];
                    return (
                      <p
                        key={entry.id}
                        className="text-xs text-amber-900 leading-relaxed font-medium"
                      >
                        <span className="font-black">{patient?.full_name}</span>{" "}
                        (Room {patient?.room}) missed{" "}
                        <span className="font-black">
                          {entry.medication_name}
                        </span>{" "}
                        at {entry.time_to_take}.
                      </p>
                    );
                  })}
                  {missedEntries.length > 3 && (
                    <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">
                      +{missedEntries.length - 3} more missed doses
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Table */}
          <div className="flex-1">
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Search Bar */}
              <div className="p-6 border-b border-slate-50 bg-slate-50/20">
                <div className="relative max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search resident or medication..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-5 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                  <Activity
                    size={64}
                    className="mb-5 opacity-10 animate-pulse"
                  />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    Loading medications...
                  </p>
                </div>
              ) : Object.keys(patients).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Pill className="text-slate-300 mb-3 opacity-20" size={64} />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    No residents assigned
                  </p>
                  <p className="text-xs font-bold mt-2 text-slate-400 uppercase tracking-widest">
                    Contact your manager to be assigned residents
                  </p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Pill className="text-slate-300 mb-3 opacity-20" size={64} />
                  <p className="font-black text-lg text-slate-900 tracking-tight">
                    No medications for this round
                  </p>
                  <p className="text-xs font-bold mt-2 text-slate-400 uppercase tracking-widest">
                    Try a different round or search
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <th className="px-8 py-4">Resident</th>
                          <th className="px-8 py-4">Medication</th>
                          <th className="px-8 py-4">Time</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredEntries.map((entry) => {
                          const patient = patients[entry.patient_id];
                          const { pill, label } = getStatusStyle(entry.status);
                          const isAdministering = administeringId === entry.id;
                          return (
                            <tr
                              key={entry.id}
                              onClick={() => setSelectedEntry(entry)}
                              className="hover:bg-slate-50/50 transition-all cursor-pointer group/row"
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xs font-black text-slate-600 flex-shrink-0 border border-slate-100 group-hover/row:scale-105 transition-transform">
                                    {patient?.room || "?"}
                                  </div>
                                  <div>
                                    <p className="font-black text-base text-slate-900 tracking-tight group-hover/row:text-slate-600 transition-colors">
                                      {patient?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                      {patient?.wing || "—"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Pill size={14} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900">
                                      {entry.medication_name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-bold">
                                      {entry.medication_mg}mg
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4">
                                <span className="text-sm font-black text-slate-700">
                                  {entry.time_to_take}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span
                                  className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${pill}`}
                                >
                                  {label}
                                </span>
                                {entry.status === "missed" && (
                                  <p className="text-xs text-rose-500 font-bold mt-1">
                                    Refused
                                  </p>
                                )}
                              </td>
                              <td className="px-8 py-4 text-right">
                                {entry.status === "due" ? (
                                  <button
                                    onClick={(e) => handleAdminister(e, entry)}
                                    disabled={isAdministering}
                                    className="px-4 py-1.5 bg-blue-500 cursor-pointer text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    {isAdministering ? "..." : "Administer"}
                                  </button>
                                ) : (
                                  <ChevronRight
                                    size={14}
                                    className="text-slate-300"
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
    </motion.section>
  );
}

function EntryDetailModal({ entry, patient, onClose }) {
  const { pill, label } = (() => {
    switch (entry.status) {
      case "given":
        return {
          pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
          label: "GIVEN",
        };
      case "due":
        return {
          pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
          label: "DUE",
        };
      case "missed":
        return {
          pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
          label: "MISSED",
        };
      default:
        return {
          pill: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
          label: entry.status,
        };
    }
  })();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-md w-full p-10 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Medication Detail
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[24px]">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              {patient?.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="font-black text-lg text-slate-900 tracking-tight">
                {patient?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-slate-500 font-bold">
                Room {patient?.room} · {patient?.wing}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-[20px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Medication
              </p>
              <p className="text-sm font-black text-slate-900">
                {entry.medication_name}
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-[20px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Dosage
              </p>
              <p className="text-sm font-black text-slate-900">
                {entry.medication_mg}mg
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-[20px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Scheduled Time
              </p>
              <p className="text-sm font-black text-slate-900">
                {entry.time_to_take}
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-[20px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Status
              </p>
              <span
                className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${pill}`}
              >
                {label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-8 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
        >
          Close
        </button>
      </div>
    </div>
  );
}
