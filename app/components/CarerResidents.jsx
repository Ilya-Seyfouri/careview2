"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Phone,
  Mail,
  MessageSquare,
  X,
  ChevronRight,
  Heart,
  Activity,
} from "lucide-react";
import { useDemoUser } from "./DemoContext";

const DEMO_CARER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export default function MyClients() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [contactModal, setContactModal] = useState(null);

  useEffect(() => {
    fetchMyClients();
  }, []);

  const fetchMyClients = async () => {
    try {
      setLoading(true);

      // 1. Get patient IDs assigned to this carer
      const { data: assignments, error: assignError } = await supabase
        .from("patient_carers")
        .select("patient_id")
        .eq("carer_id", DEMO_CARER_ID);

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) {
        setClients([]);
        return;
      }

      const patientIds = assignments.map((a) => a.patient_id);

      // 2. Fetch patient details including vitals
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select(
          "id, full_name, room, status, dob, wing, pulse, bp, key_health_indicator",
        )
        .in("id", patientIds);

      if (patientsError) throw patientsError;

      // 3. Fetch family members via patient_family → profiles
      const { data: familyLinks, error: famError } = await supabase
        .from("patient_family")
        .select(
          `
          patient_id,
          relationship,
          profiles:family_id (
            id,
            full_name,
            phone,
            email,
            role
          )
        `,
        )
        .in("patient_id", patientIds);

      if (famError) throw famError;

      // 4. Merge family into each patient
      const merged = (patients || []).map((patient) => {
        const family = (familyLinks || [])
          .filter((f) => f.patient_id === patient.id)
          .map((f) => ({ ...f.profiles, relationship: f.relationship }));
        return { ...patient, family };
      });

      setClients(merged);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filteredClients = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stableCount = clients.filter((c) => c.status === "Stable").length;
  const attentionCount = clients.filter((c) => c.status === "Attention").length;
  const criticalCount = clients.filter((c) => c.status === "Critical").length;
  const isLoading = userLoading || loading;

  return (
    <>
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                My Clients
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading
                  ? "Loading..."
                  : `${clients.length} assigned · ${stableCount} stable${criticalCount > 0 ? ` · ${criticalCount} critical` : ""}`}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
            </div>
          </div>

          {/* ── Status pills ── */}
          {!isLoading && clients.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              <StatusPill color="green" label="Stable" count={stableCount} />
              {attentionCount > 0 && (
                <StatusPill
                  color="yellow"
                  label="Attention"
                  count={attentionCount}
                />
              )}
              {criticalCount > 0 && (
                <StatusPill
                  color="red"
                  label="Critical"
                  count={criticalCount}
                  pulse
                />
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 animate-pulse h-80"
                />
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!isLoading && filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center mb-4">
                <Users className="text-muted-foreground" size={28} />
              </div>
              <p className="text-foreground font-medium mb-1">
                No clients found
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? "Try a different search term"
                  : "You have no assigned clients yet"}
              </p>
            </div>
          )}

          {/* ── Cards ── */}
          {!isLoading && filteredClients.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  calculateAge={calculateAge}
                  onViewProfile={() =>
                    router.push(`/carer/myclients/${client.id}`)
                  }
                  onContactFamily={() =>
                    setContactModal({ patient: client, family: client.family })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {contactModal && (
        <ContactFamilyModal
          patient={contactModal.patient}
          family={contactModal.family}
          onClose={() => setContactModal(null)}
        />
      )}
    </>
  );
}

/* ─── Status Pill ────────────────────────────────────────────────── */
function StatusPill({ color, label, count, pulse }) {
  const colors = {
    green: "bg-green-500/10 border-green-500/20 text-green-500",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
  };
  const dots = {
    green: "bg-green-400",
    yellow: "bg-yellow-400",
    red: "bg-red-400",
  };
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${colors[color]}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${dots[color]} ${pulse ? "animate-pulse" : ""}`}
      />
      {count} {label}
    </div>
  );
}

/* ─── Client Card ─────────────────────────────────────────────────── */
function ClientCard({ client, calculateAge, onViewProfile, onContactFamily }) {
  const statusConfig = {
    Stable: {
      dot: "bg-green-400",
      badge: "bg-green-500/15 text-green-400 border-green-500/25",
    },
    Attention: {
      dot: "bg-yellow-400",
      badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    },
    Critical: {
      dot: "bg-red-400 animate-pulse",
      badge: "bg-red-500/15 text-red-400 border-red-500/25",
    },
  };
  const cfg = statusConfig[client.status] || statusConfig["Stable"];
  const age = calculateAge(client.dob);
  const primaryFamily = client.family?.[0];
  const hasFamilyContact = client.family?.length > 0;

  return (
    <div className="bg-white/5 border-2 border-white/10 rounded-2xl backdrop-blur-xl hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        {/* ── Avatar + Name + Status ── */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/30">
              {client.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[hsl(var(--background))] ${cfg.dot}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg leading-tight truncate">
              {client.full_name || "Unknown"}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}
              >
                {client.status || "Unknown"}
              </span>
              {client.room && (
                <span className="text-xs text-muted-foreground">
                  Room {client.room}
                </span>
              )}
              {age && (
                <span className="text-xs text-muted-foreground">Age {age}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Vitals ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Pulse */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Heart size={14} className="text-red-400" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Pulse
            </p>
            <p className="text-base font-bold text-foreground">
              {client.pulse ? `${client.pulse} bpm` : "—"}
            </p>
          </div>

          {/* BP */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1.5">
              <Activity size={14} className="text-cyan-400" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              BP
            </p>
            <p className="text-base font-bold text-foreground">
              {client.bp ? `${client.bp}` : "—"}
            </p>
          </div>
        </div>

        {/* ── Family Contact Preview ── */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 flex-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Family Contact
          </p>
          {hasFamilyContact ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-rose-500/20">
                {primaryFamily?.full_name?.charAt(0)?.toUpperCase() || "F"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {primaryFamily?.full_name || "Family Member"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {primaryFamily?.relationship
                    ? `${primaryFamily.relationship}${primaryFamily.phone ? ` · ${primaryFamily.phone}` : ""}`
                    : primaryFamily?.phone ||
                      primaryFamily?.email ||
                      "No contact details"}
                </p>
              </div>
              {client.family.length > 1 && (
                <span className="text-xs text-muted-foreground bg-white/10 rounded-full px-2 py-0.5 flex-shrink-0">
                  +{client.family.length - 1}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No contacts on record
            </p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onContactFamily}
            disabled={!hasFamilyContact}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-foreground hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MessageSquare size={14} />
            Contact Family
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:to-cyan-700 transition-all active:scale-95"
          >
            View
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Contact Family Modal ───────────────────────────────────────── */
function ContactFamilyModal({ patient, family, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-md w-full p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Family Contacts
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              For{" "}
              <span className="text-foreground font-medium">
                {patient.full_name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={22} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {family.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No emergency contacts on record
            </p>
          ) : (
            family.map((member) => (
              <div
                key={member.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
                    {member.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {member.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.relationship || "Family member"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-1">
                  {member.phone ? (
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone size={14} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="text-sm text-foreground group-hover:text-cyan-400 transition-colors">
                          {member.phone}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 opacity-40">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Phone size={14} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No phone on record
                      </p>
                    </div>
                  )}
                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={14} className="text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm text-foreground truncate group-hover:text-cyan-400 transition-colors">
                          {member.email}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 opacity-40">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Mail size={14} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No email on record
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-white/5 border border-white/10 text-foreground rounded-xl hover:bg-white/10 transition-all font-semibold active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
