"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import {
  Search,
  Filter,
  User,
  X,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 4;

export default function Residents() {
  const [residentData, setResidentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchResidentData();
  }, []);

 const fetchResidentData = async () => {
   try {
     setLoading(true);
     const res = await fetch("/api/patients");
     if (!res.ok) throw new Error("Failed to fetch patients");
     const data = await res.json();
     setResidentData(data || []);
   } catch (err) {
     console.error(err);
   } finally {
     setLoading(false);
   }
 };

  const filteredResidents = residentData.filter((resident) =>
    resident.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE);
  const paginatedResidents = filteredResidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const activeCount = residentData.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "stable":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
      case "attention":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
      case "critical":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-slate-50"
      >
        {" "}
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-6">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Users size={12} />
              Care Delivery Network
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Resident Directory
            </h2>
            <p className="text-slate-500 text-lg font-medium mt-1">
              {loading ? (
                "Loading..."
              ) : (
                <>
                  {activeCount} active residents
                  <span className="text-slate-900 font-bold"></span>
                </>
              )}
            </p>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Search and Filter Bar */}
            <div className="p-8 border-b border-slate-50 flex flex-wrap gap-6 items-center justify-between bg-slate-50/20">
              <div className="relative max-w-sm w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full placeholder:text-slate-400 pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 cursor-pointer hover:bg-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                type="button"
              >
                <Plus
                  size={20}
                  strokeWidth={3}
                  className="group-hover:rotate-90 transition-transform"
                />
                Register Resident
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
                <p className="font-black text-xl text-slate-900 tracking-tight">
                  Loading residents...
                </p>
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <User className="text-slate-300 mb-4 opacity-20" size={80} />
                <p className="font-black text-xl text-slate-900 tracking-tight">
                  No residents found
                </p>
                <p className="text-sm font-bold mt-2 text-slate-400 uppercase tracking-widest">
                  Try adjusting your search
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-10 py-6">Resident Identity</th>
                        <th className="px-10 py-6">Location</th>
                        <th className="px-10 py-6">Health Summary</th>
                        <th className="px-10 py-6">Admission</th>
                        <th className="px-10 py-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedResidents.map((resident) => (
                        <tr
                          key={resident.id}
                          onClick={() =>
                            router.push(`/residents/${resident.id}`)
                          }
                          className="hover:bg-slate-50/50 transition-all cursor-pointer group/row"
                        >
                          {/* Resident Identity */}
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md group-hover/row:scale-105 transition-transform duration-300 ring-4 ring-white">
                                  {resident.full_name
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                                </div>
                                <div
                                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white ${
                                    resident.status?.toLowerCase() === "stable"
                                      ? "bg-emerald-500"
                                      : resident.status?.toLowerCase() ===
                                          "attention"
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                  }`}
                                ></div>
                              </div>
                              <div>
                                <p className="font-black text-lg text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors">
                                  {resident.full_name || "N/A"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                  Patient ID: {resident.id?.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Facility Location */}
                          <td className="px-10 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900">
                                {resident.wing || "N/A"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                Room {resident.room || "N/A"}
                              </span>
                            </div>
                          </td>

                          {/* Key Health Indicator */}
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Activity size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-900">
                                {resident.key_health_indicator || "N/A"}
                              </span>
                            </div>
                          </td>

                          {/* Admission */}
                          <td className="px-10 py-6 text-sm text-slate-500 font-bold">
                            {formatDate(resident.created_at)}
                          </td>

                          {/* Clinical Status */}
                          <td className="px-10 py-6">
                            <span
                              className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${getStatusStyle(resident.status)}`}
                            >
                              {resident.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-8 bg-slate-50/20 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      filteredResidents.length,
                    )}
                    –
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredResidents.length,
                    )}{" "}
                    of {filteredResidents.length} residents
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 py-3 cursor-pointer bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-6 py-3 cursor-pointer bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Page
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {showAddModal && (
        <AddResidentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchResidentData();
          }}
        />
      )}
    </>
  );
}

function AddResidentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    dob: "",
    room: "",
    status: "stable",
    wing: "",
    key_health_indicator: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.dob || !formData.room) {
      setError("Please fill in all required fields");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add resident");
      }

      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to add resident");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-10 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Users size={12} />
              New Registration
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Add New Resident
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className={inputClass}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Room *
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 101"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Wing
              </label>
              <select
                value={formData.wing}
                onChange={(e) =>
                  setFormData({ ...formData, wing: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select wing</option>
                <option value="North Wing">North Wing</option>
                <option value="East Wing">East Wing</option>
                <option value="South Wing">South Wing</option>
                <option value="West Wing">West Wing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={inputClass}
              >
                <option value="stable">Stable</option>
                <option value="attention">Attention</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Key Health Indicator
            </label>
            <input
              type="text"
              value={formData.key_health_indicator}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  key_health_indicator: e.target.value,
                })
              }
              className={inputClass}
              placeholder="e.g. Diabetes, Heart Failure"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-sm text-rose-600 font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              {saving ? "Adding..." : "Add Resident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
