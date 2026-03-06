"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Star, Search, X, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function CarersList() {
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

      const res = await fetch("/api/carers-list")
      if (!res.ok) throw new Error ("Failed to fetch carers")
      const data = await res.json()

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
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-green-500 to-green-600",
      "from-amber-500 to-amber-600",
      "from-red-500 to-red-600",
      "from-indigo-500 to-indigo-600",
      "from-cyan-500 to-cyan-600",
    ];
    return gradients[index % gradients.length];
  };

  const handleCarerClick = (carerId) => {
    router.push(`/carerslist/${carerId}`);
  };

  if (error) {
    return (
      <section id="carerslist" className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
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
      <motion.section
        id="carerslist"
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
              <UserCheck size={12} />
              Workforce Management
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Care Team
            </h2>
            <p className="text-slate-500 text-lg font-medium mt-1">
              {carers.length} staff members
              <span className="text-slate-900 font-bold"></span>{" "}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between mb-10">
            <div className="relative max-w-sm w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search carers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900 hover:bg-slate-800 cursor-pointer text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
              type="button"
            >
              <Plus
                size={20}
                strokeWidth={3}
                className="group-hover:rotate-90 transition-transform"
              />
              Create Carer
            </button>
          </div>

          {filteredCarers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <UserCheck size={80} className="mb-6 opacity-10" />
              <p className="font-black text-xl text-slate-900 tracking-tight">
                {searchQuery ? "No carers found" : "No carers found"}
              </p>
              <p className="text-sm font-bold mt-2 text-slate-400 uppercase tracking-widest">
                {searchQuery
                  ? `No carers match "${searchQuery}"`
                  : "Carers will appear here once they are added"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
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
      </motion.section>

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
      className="w-full bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden text-left"
    >
      {/* Subtle Accent Glow */}
      <div className="absolute bottom-[-10%] right-[-10%] w-24 h-24 bg-blue-400/5 blur-2xl rounded-full group-hover:bg-blue-400/10 transition-all"></div>

      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div
            className={`w-20 h-20 bg-gradient-to-r ${gradient} rounded-[24px] flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-105 transition-transform duration-300 ring-4 ring-white`}
          >
            {initials}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white ${
              isOnShift ? "bg-emerald-500" : "bg-slate-300"
            }`}
          ></div>
        </div>
        <div>
          <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
            {carer.full_name}
          </h3>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
            {carer.role}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-slate-50 rounded-2xl text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Rating
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            <span className="font-black text-sm text-slate-900">{rating}</span>
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            Status
          </p>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isOnShift ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
            ></span>
            <span
              className={`font-black text-xs ${isOnShift ? "text-emerald-600" : "text-slate-400"}`}
            >
              {isOnShift ? "On Shift" : "Off Duty"}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-center ">
            <span className="font-bold text-xs text-slate-600 truncate ">
              {carer.email}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function AddCarerModal({ onClose, onSuccess }) {
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

      const res = await fetch("/api/carers-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add carer");
      }

      onSuccess();
    } catch (err) {
      console.error("Error adding carer:", err);
      setError(err.message || "Failed to add carer");
    } finally {
      setSaving(false);
    }
  };
  
    const inputClass2 =
      "w-full px-4 py-3 cursor-pointer bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-10 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <UserCheck size={12} />
              New Staff Member
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Add New Carer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
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

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClass}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={inputClass}
                placeholder="e.g., +44 123 456 7890"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className={inputClass2}
            >
              <option value="carer">Carer</option>
              <option value="senior_carer">Senior Carer</option>
              <option value="nurse">Nurse</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-sm text-rose-600 font-bold">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 cursor-pointer bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-4 bg-slate-900 cursor-pointer text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
            >
              {saving ? "Adding..." : "Add Carer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
