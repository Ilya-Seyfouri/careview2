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
  Droplet,
  Wind,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Share2,
} from "lucide-react";

export default function VisitLogDetail({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [visitLog, setVisitLog] = useState(null);
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Unwrap the params Promise for Next.js 15
  const unwrappedParams = use(params);
  const residentId = unwrappedParams.id;
  const logId = unwrappedParams.logId;

  useEffect(() => {
    if (!residentId || !logId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch visit log
        const { data: logData, error: logError } = await supabase
          .from("visit_logs")
          .select("*")
          .eq("id", logId)
          .eq("patient_id", residentId)
          .single();

        if (logError) {
          console.error(logError);
          setError("Visit log not found");
          return;
        }

        setVisitLog(logData);

        // Fetch resident info
        const { data: residentData, error: residentError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", residentId)
          .single();

        if (residentError) {
          console.error(residentError);
        } else {
          setResident(residentData);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load visit log");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [residentId, logId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading visit log...</p>
        </div>
      </div>
    );
  }

  if (error || !visitLog) {
    return (
      <div className="min-h-screen bg-white/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Visit Log Not Found"}
          </h1>
          <button
            onClick={() => router.push(`/residents/${residentId}`)}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
          >
            Back to Resident
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white/50">
      <div className="container mx-auto px-6 lg:px-10 py-10">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/residents/${residentId}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back to {resident?.full_name || "Resident"}</span>
        </button>

        {/* Header */}
        <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Visit Log #{logId.substring(0, 8)}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all flex items-center gap-2">
                <Edit size={18} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Visit Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visit Notes */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText size={20} className="text-cyan-500" />
                Visit Notes
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {visitLog.notes || "No notes recorded for this visit."}
                </p>
              </div>
            </div>

            {/* Vitals Section (if you have vitals data) */}
            {(visitLog.blood_pressure ||
              visitLog.temperature ||
              visitLog.heart_rate ||
              visitLog.oxygen_level) && (
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-cyan-500" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visitLog.blood_pressure && (
                    <VitalCard
                      icon={Heart}
                      label="Blood Pressure"
                      value={visitLog.blood_pressure}
                      unit="mmHg"
                      color="text-red-400"
                    />
                  )}
                  {visitLog.temperature && (
                    <VitalCard
                      icon={Thermometer}
                      label="Temperature"
                      value={visitLog.temperature}
                      unit="°F"
                      color="text-orange-400"
                    />
                  )}
                  {visitLog.heart_rate && (
                    <VitalCard
                      icon={Activity}
                      label="Heart Rate"
                      value={visitLog.heart_rate}
                      unit="bpm"
                      color="text-pink-400"
                    />
                  )}
                  {visitLog.oxygen_level && (
                    <VitalCard
                      icon={Wind}
                      label="Oxygen Level"
                      value={visitLog.oxygen_level}
                      unit="%"
                      color="text-blue-400"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Observations */}
            {visitLog.observations && (
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle size={20} className="text-cyan-500" />
                  Observations
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {visitLog.observations}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Metadata & Resident Info */}
          <div className="space-y-6">
            {/* Visit Metadata */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Visit Information
              </h3>
              <div className="space-y-4">
                <MetadataRow
                  label="Visit ID"
                  value={`#${logId.substring(0, 8)}`}
                />
                <MetadataRow
                  label="Date"
                  value={formatDate(visitLog.created_at)}
                />
                <MetadataRow
                  label="Time"
                  value={formatTime(visitLog.created_at)}
                />
                {visitLog.carer_id && (
                  <MetadataRow label="Carer ID" value={visitLog.carer_id} />
                )}
                {visitLog.schedule_id && (
                  <MetadataRow
                    label="Schedule ID"
                    value={visitLog.schedule_id}
                  />
                )}
              </div>
            </div>

            {/* Resident Quick Info */}
            {resident && (
              <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Resident
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-500/30">
                    {resident.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {resident.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Room {resident.room || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/residents/${residentId}`)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                >
                  View Full Profile
                </button>
              </div>
            )}

            {/* Actions Card */}
            <div className="bg-white/5 border-2 border-white/10 rounded-lg overflow-hidden backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all text-left flex items-center gap-3">
                  <Edit size={18} className="text-cyan-500" />
                  <span>Edit Visit Log</span>
                </button>
                <button className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-foreground hover:bg-white/10 transition-all text-left flex items-center gap-3">
                  <Download size={18} className="text-cyan-500" />
                  <span>Download PDF</span>
                </button>
                <button className="w-full px-4 py-2 bg-white/5 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-left flex items-center gap-3">
                  <Trash2 size={18} />
                  <span>Delete Log</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper Components
function VitalCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {value}
        <span className="text-lg text-muted-foreground ml-1">{unit}</span>
      </p>
    </div>
  );
}

function MetadataRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
