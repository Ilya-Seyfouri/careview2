"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  User,
  X,
  Activity,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 10;

export default function Residents() {
  const supabase = createClient();
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
      const { data, error } = await supabase.from("patients").select("*");
      if (error) console.log(error);
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

  const activeCount = residentData.filter(
    (r) => r.status?.toLowerCase() === "stable",
  ).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "stable":
        return "bg-green-100 text-green-700 border border-green-200";
      case "attention":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                Residents
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "Loading..." : `${activeCount} stable residents`}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
              type="button"
            >
              <span>Add Resident</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search residents..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-sm"
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              type="button"
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-400">Loading residents...</div>
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <User className="text-gray-300 mb-2" size={48} />
                <p className="text-gray-400">No residents found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Resident & Room
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Wing
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Key Health Indicator
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Admission
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Clinical Status
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedResidents.map((resident) => (
                        <tr
                          key={resident.id}
                          onClick={() =>
                            router.push(`/residents/${resident.id}`)
                          }
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          {/* Resident & Room */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-cyan-500/20 flex-shrink-0">
                                {resident.full_name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">
                                  {resident.full_name || "N/A"}
                                </p>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">
                                  Room {resident.room || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Wing */}
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {resident.wing || "N/A"}
                          </td>

                          {/* Key Health Indicator */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Activity
                                size={14}
                                className="text-cyan-500 flex-shrink-0"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {resident.key_health_indicator || "N/A"}
                              </span>
                            </div>
                          </td>

                          {/* Admission */}
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(resident.created_at)}
                          </td>

                          {/* Clinical Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(resident.status)}`}
                            >
                              {resident.status || "Unknown"}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
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
                    of{" "}
                    <span className="font-medium">
                      {filteredResidents.length}
                    </span>{" "}
                    active residents
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

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
  const supabase = createClient();
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
      const { error: insertError } = await supabase.from("patients").insert([
        {
          full_name: formData.full_name,
          dob: formData.dob,
          room: formData.room,
          status: formData.status,
          wing: formData.wing,
          key_health_indicator: formData.key_health_indicator,
          created_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to add resident");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-colors text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add New Resident</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? "Adding..." : "Add Resident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
