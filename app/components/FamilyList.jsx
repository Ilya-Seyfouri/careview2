"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Heart,
  Search,
  X,
  Plus,
  UserCheck,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 4;

export default function FamilyList() {
  const supabase = createClient();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filteredFamilyMembers.length / ITEMS_PER_PAGE);
  const paginatedFamilyMembers = filteredFamilyMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
            <p className="font-black text-xl text-slate-900 tracking-tight">
              Loading family members...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">Error: {error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-6">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <UserCheck size={12} />
              Extended Care Network
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Family Relations
            </h2>
            <p className="text-slate-500 text-lg font-medium mt-1">
              {familyMembers.length} family members
              <span className="text-slate-900 font-bold">
              </span>
            </p>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Search Bar */}
            <div className="p-8 border-b border-slate-50 flex flex-wrap gap-6 items-center justify-between bg-slate-50/20">
              <div className="relative max-w-sm w-full">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search family member..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 group"
                type="button"
              >
                <Plus
                  size={20}
                  strokeWidth={3}
                  className="group-hover:rotate-90 transition-transform"
                />
                Invite Member
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
                <p className="font-black text-xl text-slate-900 tracking-tight">
                  Loading family members...
                </p>
              </div>
            ) : filteredFamilyMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <User className="text-slate-300 mb-4 opacity-20" size={80} />
                <p className="font-black text-xl text-slate-900 tracking-tight">
                  No family members found
                </p>
                <p className="text-sm font-bold mt-2 text-slate-400 uppercase tracking-widest">
                  {searchQuery
                    ? `No family members match "${searchQuery}"`
                    : "Family members will appear here once they are added"}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-10 py-6">Family Member Identity</th>
                        <th className="px-10 py-6">Primary Relation</th>
                        <th className="px-10 py-6">Linked Residents</th>
                        <th className="px-10 py-6">Email</th>
                        <th className="px-10 py-6">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedFamilyMembers.map((family) => (
                        <tr
                          key={family.id}
                          className="hover:bg-slate-50/50 transition-all cursor-pointer group/row"
                        >
                          {/* Family Member Identity */}
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-black text-xl shadow-md group-hover/row:scale-105 transition-transform duration-300 ring-4 ring-white">
                                  {getInitials(family.full_name)}
                                </div>
                              </div>
                              <div>
                                <p className="font-black text-lg text-slate-900 tracking-tight group-hover/row:text-blue-600 transition-colors">
                                  {family.full_name}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Primary Relation */}
                          <td className="px-10 py-6">
                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover/row:bg-blue-50 group-hover/row:text-blue-600 transition-colors">
                              {family.assignedPatients.length > 0
                                ? family.assignedPatients[0].relationship
                                : "N/A"}
                            </span>
                          </td>

                          {/* Linked Residents */}
                          <td className="px-10 py-6">
                            {family.assignedPatients.length === 0 ? (
                              <span className="text-sm text-slate-400 font-bold">
                                No residents
                              </span>
                            ) : family.assignedPatients.length === 1 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 ring-1 ring-blue-100">
                                  <Heart size={12} fill="currentColor" />
                                  {family.assignedPatients[0].full_name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 ring-1 ring-blue-100">
                                  <Heart size={12} fill="currentColor" />
                                  {family.assignedPatients[0].full_name}
                                </span>
                                <span className="text-xs text-slate-400 font-bold flex items-center">
                                  +{family.assignedPatients.length - 1} more
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-10 py-6 text-sm text-slate-500 font-bold">
                            {family.email || "Not provided"}
                          </td>

                          {/* Phone */}
                          <td className="px-10 py-6 text-sm text-slate-500 font-bold">
                            {family.phone || "Not provided"}
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
                      filteredFamilyMembers.length,
                    )}
                    –
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredFamilyMembers.length,
                    )}{" "}
                    of {filteredFamilyMembers.length} family members
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Page
                    </button>
                  </div>
                </div>
              </>
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

function AddFamilyMemberModal({ onClose, onSuccess }) {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [createdFamilyId, setCreatedFamilyId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    patient_id: "",
    relationship: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (step === 2) {
      fetchPatients();
    }
  }, [step]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const handleStep1Submit = async (e) => {
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
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.from("audit_logs").insert({
        action_type: "family_member_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: data.id,
        created_at: new Date().toISOString(),
      });

      setCreatedFamilyId(data.id);
      setStep(2);
    } catch (err) {
      console.error("Error adding family member:", err);
      setError(err.message || "Failed to add family member");
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.relationship) {
      setError("Please select a resident and relationship");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: linkError } = await supabase
        .from("patient_family")
        .insert([
          {
            patient_id: formData.patient_id,
            family_id: createdFamilyId,
            relationship: formData.relationship,
            linked_at: new Date().toISOString(),
          },
        ]);

      if (linkError) throw linkError;

      await supabase.from("audit_logs").insert({
        action_type: "family_linked_to_patient",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: formData.patient_id,
        created_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (err) {
      console.error("Error linking family member:", err);
      setError(err.message || "Failed to link family member");
    } finally {
      setSaving(false);
    }
  };

  const handleSkipLinking = () => {
    onSuccess();
  };

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
              {step === 1 ? "New Family Member" : "Link to Resident"}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {step === 1 ? "Add New Family Member" : "Link to Resident"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {step === 1
                ? "Step 1 of 2: Enter family member details"
                : "Step 2 of 2: Link to a resident (optional)"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Step 1: Create Family Member */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
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
                {saving ? "Creating..." : "Next: Link to Resident"}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Link to Patient */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-emerald-600 font-bold">
                ✓ Family member "{formData.full_name}" created successfully!
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Select Resident
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">-- Select a resident --</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}{" "}
                    {patient.room ? `(Room ${patient.room})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Relationship
              </label>
              <select
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                className={inputClass}
              >
                <option value="">-- Select relationship --</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Parent">Parent</option>
                <option value="Grandchild">Grandchild</option>
                <option value="Other Family">Other Family</option>
                <option value="Friend">Friend</option>
                <option value="Legal Guardian">Legal Guardian</option>
              </select>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <p className="text-sm text-rose-600 font-bold">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSkipLinking}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest"
                disabled={saving}
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={
                  saving || !formData.patient_id || !formData.relationship
                }
                className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
              >
                {saving ? "Linking..." : "Complete"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
