"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  AlertCircle,
  Smile,
  Utensils,
  UserCheck,
} from "lucide-react";

export default function VisitLogDetail({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [visitLog, setVisitLog] = useState(null);
  const [resident, setResident] = useState(null);
  const [carer, setCarer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unwrappedParams = use(params);
  const residentId = unwrappedParams.id;
  const logId = unwrappedParams.logId;

  useEffect(() => {
    if (!residentId || !logId) return;
    fetchData();
  }, [residentId, logId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: logData, error: logError } = await supabase
        .from("visit_logs")
        .select("*")
        .eq("id", logId)
        .eq("patient_id", residentId)
        .single();

      if (logError) {
        setError("Visit log not found");
        return;
      }

      setVisitLog(logData);

      // Fetch resident
      const { data: residentData } = await supabase
        .from("patients")
        .select("full_name")
        .eq("id", residentId)
        .single();
      if (residentData) setResident(residentData);

      // Fetch carer name from profiles
      if (logData.carer_id) {
        const { data: carerData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", logData.carer_id)
          .single();
        if (carerData) setCarer(carerData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load visit log");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getMoodConfig = (mood) => {
    switch (mood?.toLowerCase()) {
      case "happy":
        return {
          emoji: "😊",
          label: "Happy",
          color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        };
      case "calm":
        return {
          emoji: "😌",
          label: "Calm",
          color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
        };
      case "anxious":
        return {
          emoji: "😰",
          label: "Anxious",
          color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        };
      case "irritable":
        return {
          emoji: "😤",
          label: "Irritable",
          color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
        };
      default:
        return {
          emoji: "😐",
          label: mood || "Unknown",
          color: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
        };
    }
  };

  const getAppetiteConfig = (appetite) => {
    switch (appetite?.toLowerCase()) {
      case "great":
        return {
          label: "Great",
          dot: "bg-emerald-500",
          color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        };
      case "normal":
        return {
          label: "Normal",
          dot: "bg-amber-500",
          color: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        };
      case "poor":
        return {
          label: "Poor",
          dot: "bg-rose-500",
          color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
        };
      default:
        return {
          label: appetite || "Unknown",
          dot: "bg-slate-400",
          color: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
          <p className="font-black text-xl text-slate-900 tracking-tight">
            Loading visit log...
          </p>
        </div>
      </div>
    );
  }

  if (error || !visitLog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-rose-400 mx-auto mb-6 opacity-20" />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {error || "Visit Log Not Found"}
          </h1>
          <button
            onClick={() => router.push(`/residents/${residentId}`)}
            className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            Back to Resident
          </button>
        </div>
      </div>
    );
  }

  const moodConfig = getMoodConfig(visitLog.mood);
  const appetiteConfig = getAppetiteConfig(visitLog.appetite);

  return (
<motion.section
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
  className="min-h-screen bg-slate-50"
>      <div className="container mx-auto px-6 lg:px-10 py-10">
        {/* Back */}
        <button
          onClick={() => router.push(`/residents/${residentId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span>Back to {resident?.full_name || "Resident"}</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 mb-10">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-violet-600 rounded-[24px] flex items-center justify-center shadow-2xl flex-shrink-0">
              <FileText size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                Visit Log #{logId?.slice(0, 8)}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(visitLog.created_at)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {formatTime(visitLog.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mood + Appetite summary cards */}
            {(visitLog.mood || visitLog.appetite) && (
              <div className="grid grid-cols-2 gap-6">
                {visitLog.mood && (
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Smile size={18} className="text-blue-600" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Mood
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{moodConfig.emoji}</span>
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest ${moodConfig.color}`}
                      >
                        {moodConfig.label}
                      </span>
                    </div>
                  </div>
                )}

                {visitLog.appetite && (
                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Utensils size={18} className="text-amber-600" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Appetite
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full flex-shrink-0 ${appetiteConfig.dot} shadow-md`}
                      />
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest ${appetiteConfig.color}`}
                      >
                        {appetiteConfig.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visit Notes */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                Notes
              </h3>
              <div className="p-4 bg-slate-50/50 rounded-3xl border-2 border-slate-100 border-dashed">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base font-medium">
                  {visitLog.notes || (
                    <span className="italic text-slate-400">
                      No notes recorded for this visit.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-8">
            {/* Visit Information */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                Visit Information
              </h3>
              <div className="space-y-5">
                <MetadataRow
                  label="Resident"
                  value={resident?.full_name || "Unknown"}
                  icon={User}
                />
                <MetadataRow
                  label="Carer"
                  value={carer?.full_name || "Unknown"}
                  icon={UserCheck}
                />
                <MetadataRow
                  label="Date"
                  value={formatDate(visitLog.created_at)}
                  icon={Calendar}
                />
                <MetadataRow
                  label="Time"
                  value={formatTime(visitLog.created_at)}
                  icon={Clock}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MetadataRow({ label, value, icon: Icon }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={12} className="text-blue-500" />}
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          {label}
        </p>
      </div>
      <div className="text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}
