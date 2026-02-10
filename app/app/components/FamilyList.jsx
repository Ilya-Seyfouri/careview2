"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { User, Mail, Phone, Heart, Search, X } from "lucide-react";

export default function FamilyList() {
  const supabase = createClient();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);

      // Fetch all family members from profiles
      const { data: familyData, error: familyError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .eq("role", "family")
        .order("full_name", { ascending: true });

      if (familyError) throw familyError;

      // For each family member, fetch their assigned patients
      const familyWithPatients = await Promise.all(
        familyData.map(async (family) => {
          const { data: patientFamilyData, error: patientFamilyError } =
            await supabase
              .from("patient_family")
              .select("relationship, patient_id, linked_at")
              .eq("family_id", family.id);

          if (patientFamilyError) {
            console.error("Error fetching patient family:", patientFamilyError);
            return { ...family, assignedPatients: [] };
          }

          // Fetch patient details
          if (patientFamilyData && patientFamilyData.length > 0) {
            const patientIds = patientFamilyData.map((pf) => pf.patient_id);

            const { data: patientsData, error: patientsError } = await supabase
              .from("patients")
              .select("id, full_name")
              .in("id", patientIds);

            if (patientsError) {
              console.error("Error fetching patients:", patientsError);
              return { ...family, assignedPatients: [] };
            }

            // Combine patient data with relationship
            const assignedPatients = patientFamilyData.map((pf) => ({
              ...patientsData.find((p) => p.id === pf.patient_id),
              relationship: pf.relationship,
              linked_at: pf.linked_at,
            }));

            return { ...family, assignedPatients };
          }

          return { ...family, assignedPatients: [] };
        }),
      );

      setFamilyMembers(familyWithPatients);
    } catch (err) {
      console.error("Error fetching family members:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFamilyMembers = familyMembers.filter((family) =>
    family.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading family members...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-red-500">Error: {error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto">
          <div className="px-6 lg:px-10 pt-10 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                  Family Members
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {familyMembers.length} family members active
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                type="button"
              >
                <span>Add Family Member</span>
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
                  placeholder="Search family members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Family Members Table */}
            {filteredFamilyMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <User size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No family members found</p>
                <p className="text-sm mt-2">
                  {searchQuery
                    ? `No family members match "${searchQuery}"`
                    : "Family members will appear here once they are added"}
                </p>
              </div>
            ) : (
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-3">Family Member</div>
                  <div className="col-span-2">Relationship</div>
                  <div className="col-span-3">Assigned Residents</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-2">Phone</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/10">
                  {filteredFamilyMembers.map((family) => (
                    <FamilyMemberRow key={family.id} family={family} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add Family Member Modal */}
      {showAddModal && (
        <AddFamilyMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchFamilyMembers();
          }}
        />
      )}
    </>
  );
}

function FamilyMemberRow({ family }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get primary relationship (from first assigned patient)
  const primaryRelationship =
    family.assignedPatients.length > 0
      ? family.assignedPatients[0].relationship
      : "N/A";

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
      {/* Family Member Info */}
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
          {getInitials(family.full_name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">
            {family.full_name}
          </p>
        </div>
      </div>

      {/* Relationship */}
      <div className="col-span-2 flex items-center">
        <span className="text-sm text-foreground">{primaryRelationship}</span>
      </div>

      {/* Assigned Residents */}
      <div className="col-span-3 flex items-center">
        {family.assignedPatients.length === 0 ? (
          <span className="text-sm text-muted-foreground">No residents</span>
        ) : family.assignedPatients.length === 1 ? (
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-cyan-500" />
            <span className="text-sm text-cyan-500">
              {family.assignedPatients[0].full_name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-cyan-500" />
            <span className="text-sm text-cyan-500">
              {family.assignedPatients[0].full_name}
            </span>
            <span className="text-xs text-muted-foreground">
              +{family.assignedPatients.length - 1} more
            </span>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="col-span-2 flex items-center">
        <span className="text-sm text-muted-foreground truncate">
          {family.email || "Not provided"}
        </span>
      </div>

      {/* Phone */}
      <div className="col-span-2 flex items-center">
        <span className="text-sm text-muted-foreground">
          {family.phone || "Not provided"}
        </span>
      </div>
    </div>
  );
}

function AddFamilyMemberModal({ onClose, onSuccess }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
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
            role: "family",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      console.error("Error adding family member:", err);
      setError(err.message || "Failed to add family member");
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
            Add New Family Member
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
              {saving ? "Adding..." : "Add Family Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
