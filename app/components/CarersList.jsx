"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Star, Search, X } from "lucide-react";

export default function CarersList() {
  const supabase = createClient();
  const router = useRouter();
  const [carers, setCarers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCarers();
  }, []);

  const fetchCarers = async () => {
    try {
      setLoading(true);

      const { data, error: carersError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, created_at")
        .eq("role", "carer")
        .order("full_name", { ascending: true });

      if (carersError) throw carersError;

      setCarers(data || []);
    } catch (err) {
      console.error("Error fetching carers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCarers = carers.filter((carer) =>
    carer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRandomGradient = (index) => {
    const gradients = [
      "from-cyan-400 to-cyan-600",
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-green-400 to-green-600",
      "from-yellow-400 to-yellow-600",
      "from-red-400 to-red-600",
      "from-indigo-400 to-indigo-600",
    ];
    return gradients[index % gradients.length];
  };

  const handleCarerClick = (carerId) => {
    router.push(`/carerslist/${carerId}`);
  };

  if (loading) {
    return (
      <section id="carerslist" className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading carers...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="carerslist" className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-red-500">
                Error loading carers: {error}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="carerslist" className="min-h-screen bg-white/50">
        <div className="container mx-auto">
          <div className="px-6 lg:px-10 pt-10 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                  Carers
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {carers.length} active staff
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                type="button"
              >
                <span>Add Carer</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search carers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {filteredCarers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <UserCheck size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  {searchQuery ? "No carers found" : "No carers found"}
                </p>
                <p className="text-sm mt-2">
                  {searchQuery
                    ? `No carers match "${searchQuery}"`
                    : "Carers will appear here once they are added"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCarers.map((carer, index) => (
                  <CarerCard
                    key={carer.id}
                    carer={carer}
                    gradient={getRandomGradient(index)}
                    initials={getInitials(carer.full_name)}
                    onClick={() => handleCarerClick(carer.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add Carer Modal */}
      {showAddModal && (
        <AddCarerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCarers();
          }}
        />
      )}
    </>
  );
}

function CarerCard({ carer, gradient, initials, onClick }) {
  const rating = (4.0 + Math.random()).toFixed(1);
  const isOnShift = Math.random() > 0.3;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-all hover:scale-105 hover:shadow-xl text-left"
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg truncate">
            {carer.full_name}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {carer.role}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-foreground">{rating}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOnShift ? "bg-green-500" : "bg-gray-400"}`}
          ></div>
          <span
            className={`text-sm font-medium ${isOnShift ? "text-green-400" : "text-gray-400"}`}
          >
            {isOnShift ? "On Shift" : "Off Duty"}
          </span>
        </div>
      </div>
    </button>
  );
}

function AddCarerModal({ onClose, onSuccess }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "carer",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Audit log: carer created
      await supabase.from("audit_logs").insert({
        action_type: "carer_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: data.id,
        created_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (err) {
      console.error("Error adding carer:", err);
      setError(err.message || "Failed to add carer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-2xl w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Add New Carer</h2>
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

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g., +44 123 456 7890"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="carer">Carer</option>
              <option value="senior_carer">Senior Carer</option>
              <option value="nurse">Nurse</option>
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
              {saving ? "Adding..." : "Add Carer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
