"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, MapPin, Heart, Activity, ArrowUpRight } from "lucide-react";
import { useDemoUser } from "./DemoContext";

const DEMO_CARER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export default function MyClients() {
  const supabase = createClient();
  const router = useRouter();
  const { demoUser, loading: userLoading } = useDemoUser();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

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

      setClients(patients || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = userLoading || loading;

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 pt-10 pb-10">
        {/* ── Header ── */}
        <div className="mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            My Clients
          </h2>
          <p className="text-slate-500 text-lg font-medium">
            {isLoading
              ? "Loading..."
              : `${clients.length} assigned resident${clients.length !== 1 ? "s" : ""} under your care`}
          </p>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-[32px] p-8 animate-pulse h-80"
              />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[32px]">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Users className="text-slate-300" size={28} />
            </div>
            <p className="font-black text-slate-900 mb-1 tracking-tight">
              No clients found
            </p>
            <p className="text-sm text-slate-400 font-medium">
              You have no assigned clients yet
            </p>
          </div>
        )}

        {/* ── Cards ── */}
        {!isLoading && clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Client Card ─────────────────────────────────────────────────── */
function ClientCard({ client }) {
  const router = useRouter();

  const statusConfig = {
    Stable: {
      badge: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
      dot: "bg-emerald-500",
    },
    Attention: {
      badge: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      dot: "bg-amber-500",
    },
    Critical: {
      badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
      dot: "bg-rose-500 animate-pulse",
    },
  };

  const cfg = statusConfig[client.status] || statusConfig["Stable"];

  const handleClick = () => {
    router.push(`/carer/myclients/${client.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden group hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all cursor-pointer relative"
    >
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-2xl font-black ring-4 ring-slate-50 shadow-md group-hover:scale-105 transition-all">
          {client.full_name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <h3 className="font-black text-xl text-slate-900 tracking-tight">
            {client.full_name || "Unknown"}
          </h3>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
            {client.status || "Unknown"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 bg-slate-50/50 rounded-2xl text-center group-hover:bg-slate-50 transition-colors">
          <Heart
            size={20}
            strokeWidth={3}
            className="mx-auto text-rose-500 mb-2"
          />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
            Pulse
          </p>
          <p className="font-black text-slate-900 text-lg">
            {client.pulse || "—"}{" "}
            {client.pulse && (
              <span className="text-xs text-slate-400">bpm</span>
            )}
          </p>
        </div>
        <div className="p-5 bg-slate-50/50 rounded-2xl text-center group-hover:bg-slate-50 transition-colors">
          <Activity
            size={20}
            strokeWidth={3}
            className="mx-auto text-blue-500 mb-2"
          />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
            BP (SYS)
          </p>
          <p className="font-black text-slate-900 text-lg">
            {client.bp || "—"}{" "}
            {client.bp && <span className="text-xs text-slate-400">avg</span>}
          </p>
        </div>
      </div>

      <button className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center justify-center gap-2 group/btn">
        <MapPin size={16} strokeWidth={3} />
        Room {client.room || "—"}
        <ArrowUpRight
          size={14}
          strokeWidth={3}
          className="group-hover/btn:translate-x-1 transition-transform"
        />
      </button>
    </div>
  );
}
