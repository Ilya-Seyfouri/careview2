"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Heart,
  Activity,
  Thermometer,
  Wind,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Share2,
  CheckSquare,
  Utensils,
  Smile,
  MapPin,
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
        .select("*")
        .eq("id", residentId)
        .single();
      if (residentData) setResident(residentData);

      // Fetch carer name from profiles
      if (logData.carer_id) {
        const { data: carerData } = await supabase
          .from("profiles")
          .select("full_name, role")
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

  // Parse required tasks from schedule if stored
  const parsedTasks = (() => {
    try {
      if (!visitLog?.required_tasks) return [];
      return JSON.parse(visitLog.required_tasks);
    } catch {
      return [];
    }
  })();

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
    <section className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 lg:px-10 py-10">
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-violet-600 rounded-[24px] flex items-center justify-center shadow-2xl flex-shrink-0">
                <FileText size={36} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                  Visit Log
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
                  {resident && (
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      {resident.full_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm font-bold">
                <Download size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">
                  Export
                </span>
              </button>
              <button className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm font-bold">
                <Share2 size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">
                  Share
                </span>
              </button>
              <button className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg font-bold">
                <Edit size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">
                  Edit
                </span>
              </button>
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
                      <span className="text-5xl">{moodConfig.emoji}</span>
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

            {/* Visit Notes / Observations */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                Observations
              </h3>
              <div className="p-8 bg-slate-50/50 rounded-3xl border-2 border-slate-100 border-dashed">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base font-medium">
                  {visitLog.notes || (
                    <span className="italic text-slate-400">
                      No notes recorded for this visit.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Required Tasks */}
            {parsedTasks.length > 0 && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CheckSquare size={20} className="text-emerald-600" />
                  </div>
                  Required Tasks
                </h3>
                <div className="space-y-3">
                  {parsedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-[20px]"
                    >
                      <CheckSquare
                        size={20}
                        className="text-emerald-600 flex-shrink-0"
                        strokeWidth={2.5}
                      />
                      <span className="text-base text-slate-900 font-medium">
                        {task}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals (if present) */}
            {(visitLog.blood_pressure ||
              visitLog.temperature ||
              visitLog.heart_rate ||
              visitLog.oxygen_level) && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <Activity size={20} className="text-rose-600" />
                  </div>
                  Vital Signs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {visitLog.blood_pressure && (
                    <VitalCard
                      icon={Heart}
                      label="Blood Pressure"
                      value={visitLog.blood_pressure}
                      unit="mmHg"
                      color="text-rose-600"
                      bgColor="bg-rose-50"
                      ringColor="ring-rose-100"
                    />
                  )}
                  {visitLog.temperature && (
                    <VitalCard
                      icon={Thermometer}
                      label="Temperature"
                      value={visitLog.temperature}
                      unit="°C"
                      color="text-orange-600"
                      bgColor="bg-orange-50"
                      ringColor="ring-orange-100"
                    />
                  )}
                  {visitLog.heart_rate && (
                    <VitalCard
                      icon={Activity}
                      label="Heart Rate"
                      value={visitLog.heart_rate}
                      unit="bpm"
                      color="text-pink-600"
                      bgColor="bg-pink-50"
                      ringColor="ring-pink-100"
                    />
                  )}
                  {visitLog.oxygen_level && (
                    <VitalCard
                      icon={Wind}
                      label="Oxygen Level"
                      value={visitLog.oxygen_level}
                      unit="%"
                      color="text-blue-600"
                      bgColor="bg-blue-50"
                      ringColor="ring-blue-100"
                    />
                  )}
                </div>
              </div>
            )}
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
                  label="Date"
                  value={formatDate(visitLog.created_at)}
                  icon={Calendar}
                />
                <MetadataRow
                  label="Time"
                  value={formatTime(visitLog.created_at)}
                  icon={Clock}
                />
                {carer && (
                  <MetadataRow
                    label="Carer"
                    value={carer.full_name}
                    icon={UserCheck}
                  />
                )}
                {visitLog.mood && (
                  <MetadataRow
                    label="Mood"
                    value={
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${moodConfig.color}`}
                      >
                        {moodConfig.emoji} {moodConfig.label}
                      </span>
                    }
                    icon={Smile}
                  />
                )}
                {visitLog.appetite && (
                  <MetadataRow
                    label="Appetite"
                    value={
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${appetiteConfig.color}`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${appetiteConfig.dot}`}
                        />
                        {appetiteConfig.label}
                      </span>
                    }
                    icon={Utensils}
                  />
                )}
              </div>
            </div>

            {/* Resident Quick Info */}
            {resident && (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                  Resident
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {resident.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-black text-lg text-slate-900 tracking-tight">
                      {resident.full_name}
                    </p>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                      <MapPin size={14} />
                      Room {resident.room || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/residents/${residentId}`)}
                  className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                >
                  View Full Profile
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">
                Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all text-left flex items-center gap-3 font-bold">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Edit size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm">Edit Visit Log</span>
                </button>
                <button className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all text-left flex items-center gap-3 font-bold">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Download size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-sm">Download PDF</span>
                </button>
                <button className="w-full px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 hover:bg-rose-100 transition-all text-left flex items-center gap-3 font-bold">
                  <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center">
                    <Trash2 size={16} className="text-rose-600" />
                  </div>
                  <span className="text-sm">Delete Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bgColor,
  ringColor,
}) {
  return (
    <div
      className={`${bgColor} rounded-[24px] p-6 ring-1 ${ringColor} shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className={color} strokeWidth={2.5} />
        <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className={`text-3xl font-black ${color} tracking-tight`}>
        {value}
        <span className="text-lg text-slate-500 font-bold ml-2">{unit}</span>
      </p>
    </div>
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
