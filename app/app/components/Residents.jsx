"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { Search, Filter, User, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Residents() {
  const supabase = createClient();
  const [residentData, setResidentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchResidentData();
  }, []);

  const fetchResidentData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("patients").select("*");

      if (error) {
        console.log(error);
      }

      setResidentData(data || []);
      console.log(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, residentId) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this resident? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(residentId);

      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", residentId);

      if (error) throw error;

      // Refresh the list
      await fetchResidentData();
    } catch (err) {
      console.error("Error deleting resident:", err);
      alert("Failed to delete resident");
    } finally {
      setDeletingId(null);
    }
  };

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

  const filteredResidents = residentData.filter((resident) =>
    resident.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeCount = filteredResidents.filter(
    (r) => r.status === "Stable",
  ).length;

  return (
    <>
      <section id="residents" className="min-h-screen bg-white/50">
        <div className="container mx-auto">
          <div className="px-6 lg:px-10 pt-10 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                  Residents
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
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

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search residents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all active:scale-95"
                type="button"
              >
                <Filter size={18} />
                <span>Filter</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">
                    Loading residents...
                  </div>
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <User className="text-muted-foreground mb-2" size={48} />
                  <p className="text-muted-foreground">No residents found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                          Name
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                          Room
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                          Age
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                          Date of Birth
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                        
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResidents.map((resident, index) => (
                        <tr
                          key={resident.id}
                          onClick={() =>
                            router.push(`/residents/${resident.id}`)
                          }
                          className={`border-b border-white/5 hover:bg-green-50 transition-colors cursor-pointer`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/30">
                                {resident.full_name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {resident.full_name || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {resident.room || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            {calculateAge(resident.dob)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {resident.dob
                              ? new Date(resident.dob).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                resident.status === "Stable"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : resident.status === "Attention"
                                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {resident.status || "unknown"}
                            </span>
                          </td>
                         
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Add Resident Modal */}
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
    status: "Stable",
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

      const { data, error: insertError } = await supabase
        .from("patients")
        .insert([
          {
            full_name: formData.full_name,
            dob: formData.dob,
            room: formData.room,
            status: formData.status,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      console.error("Error adding resident:", err);
      setError(err.message || "Failed to add resident");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-2xl w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Add New Resident
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Date of Birth and Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Room Number *
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g., 101"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="Stable">Stable</option>
              <option value="Attention">Attention</option>
              <option value="Critical">Critical</option>
            </select>
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
              {saving ? "Adding..." : "Add Resident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
