"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { useDemoUser } from "./DemoContext";
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  Plus,
  X,
  ChevronRight,
  FileText,
  Activity,
  User,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const SHIFT_TYPES = [
  { value: "AM->PM", label: "AM to PM Transition" },
  { value: "PM->AM", label: "PM to AM Transition" },
];

const TEST_DATA = {
  GOOD: {
    visitLogIds: [
      "00000000-0000-0000-0000-000000999100",
      "00000000-0000-0000-0000-000000999101",
      "00000000-0000-0000-0000-000000999102",
    ],
    reportIds: [
      "00000000-0000-0000-0000-000000999103",
      "00000000-0000-0000-0000-000000999104",
      "00000000-0000-0000-0000-000000999105",
    ],
  },
  INTERMEDIATE: {
    visitLogIds: [
      "00000000-0000-0000-0000-000000999106",
      "00000000-0000-0000-0000-000000999107",
      "00000000-0000-0000-0000-000000999108",
    ],
    reportIds: [
      "00000000-0000-0000-0000-000000999109",
      "00000000-0000-0000-0000-000000999110",
      "00000000-0000-0000-0000-000000999111",
    ],
  },
  CRITICAL: {
    visitLogIds: [
      "00000000-0000-0000-0000-000000999112",
      "00000000-0000-0000-0000-000000999113",
      "00000000-0000-0000-0000-000000999114",
    ],
    reportIds: [
      "00000000-0000-0000-0000-000000999115",
      "00000000-0000-0000-0000-000000999116",
      "00000000-0000-0000-0000-000000999117",
    ],
  },
};

// NEW: returns colour tokens for flag cards based on shift assessment level
const getFlagStyles = (level) => {
  switch (level) {
    case "GOOD":
      return {
        cardBg: "bg-green-50/50 border-green-100/50",
        avatar: "bg-green-100 text-green-600",
        name: "text-green-900",
        notes: "text-green-700",
        emptyNote: "text-green-400",
        removeHover: "hover:bg-green-100",
        removeIcon: "text-green-400",
        headerIcon: "bg-green-50",
        headerIconColor: "text-green-500",
        roomBadge: "bg-green-100 text-green-700",
      };
    case "CONCERNING":
      return {
        cardBg: "bg-yellow-50/50 border-yellow-100/50",
        avatar: "bg-yellow-100 text-yellow-600",
        name: "text-yellow-900",
        notes: "text-yellow-700",
        emptyNote: "text-yellow-400",
        removeHover: "hover:bg-yellow-100",
        removeIcon: "text-yellow-400",
        headerIcon: "bg-yellow-50",
        headerIconColor: "text-yellow-500",
        roomBadge: "bg-yellow-100 text-yellow-700",
      };
    case "CRITICAL":
    default:
      return {
        cardBg: "bg-red-50/50 border-red-100/50",
        avatar: "bg-red-100 text-red-600",
        name: "text-red-900",
        notes: "text-red-700",
        emptyNote: "text-red-400",
        removeHover: "hover:bg-red-100",
        removeIcon: "text-red-400",
        headerIcon: "bg-red-50",
        headerIconColor: "text-red-500",
        roomBadge: "bg-red-100 text-red-700",
      };
  }
};

export default function ShiftHandover() {
  const supabase = createClient();
  const { demoUser, loading: userLoading } = useDemoUser();
  const [patients, setPatients] = useState([]);
  const [pastHandovers, setPastHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [shiftAssessment, setShiftAssessment] = useState(null);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [handoverDetails, setHandoverDetails] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [shiftType, setShiftType] = useState("AM->PM");
  const [shiftSummary, setShiftSummary] = useState("");
  const [followUps, setFollowUps] = useState([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [redFlags, setRedFlags] = useState([]);
  const [newFlag, setNewFlag] = useState({ patient_id: "", patient_notes: "" });
  const [addingFlag, setAddingFlag] = useState(false);

  useEffect(() => {
    if (demoUser?.id) fetchData(demoUser);
  }, [demoUser]);

  const fetchData = async (user) => {
    try {
      setLoading(true);
      let patientIds = null;
      if (user.role === "carer") {
        const { data: assignments } = await supabase
          .from("patient_carers")
          .select("patient_id")
          .eq("carer_id", user.id);
        patientIds = (assignments || []).map((a) => a.patient_id);
      }
      let patQuery = supabase
        .from("patients")
        .select("id, full_name, room, wing");
      if (patientIds !== null) patQuery = patQuery.in("id", patientIds);
      const { data: pats } = await patQuery;
      setPatients(pats || []);
      const { data: past } = await supabase
        .from("shift_handovers")
        .select("id, shift_type, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      // Deduplicate by created_at — multiple rows per handover (one per patient flag)
      const seen = new Set();
      const dedupedPast = (past || [])
        .filter((h) => {
          if (seen.has(h.created_at)) return false;
          seen.add(h.created_at);
          return true;
        })
        .slice(0, 5);
      setPastHandovers(dedupedPast);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHandoverDetails = async (handoverId, createdAt) => {
    try {
      setHandoverLoading(true);
      const { data: handoverGroup, error: handoverError } = await supabase
        .from("shift_handovers")
        .select(
          `
          id,
          shift_type,
          notes,
          patient_notes,
          created_at,
          created_by,
          patient:patient_id (id, full_name, room, wing)
        `,
        )
        .eq("created_at", createdAt)
        .order("patient_id", { ascending: true });
      if (handoverError) throw handoverError;
      const createdBy = handoverGroup?.[0]?.created_by;
      let creatorInfo = null;
      if (createdBy) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", createdBy)
          .single();
        creatorInfo = creator;
      }
      setHandoverDetails({
        items: handoverGroup || [],
        creator: creatorInfo,
        shiftType: handoverGroup?.[0]?.shift_type,
        generalNotes: handoverGroup?.[0]?.notes,
        createdAt: handoverGroup?.[0]?.created_at,
      });
    } catch (err) {
      console.error("Error fetching handover details:", err);
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleOpenHandover = (handover) => {
    setSelectedHandover(handover);
    fetchHandoverDetails(handover.id, handover.created_at);
  };

  const handleAddFlag = () => {
    if (!newFlag.patient_id) return;
    setRedFlags((prev) => [...prev, { ...newFlag }]);
    setNewFlag({ patient_id: "", patient_notes: "" });
    setAddingFlag(false);
  };

  const handleRemoveFlag = (idx) => {
    setRedFlags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);
    if (redFlags.length === 0) {
      setError("Please add at least one resident red flag before saving.");
      return;
    }
    try {
      setSaving(true);
      const rows = redFlags.map((flag) => ({
        patient_id: flag.patient_id,
        shift_type: shiftType,
        notes: generalNotes || null,
        patient_notes: flag.patient_notes || null,
        created_by: demoUser.id,
      }));
      const { data: insertedHandovers, error: insertError } = await supabase
        .from("shift_handovers")
        .insert(rows)
        .select();
      if (insertError) throw insertError;
      const actorId =
        demoUser.role === "carer"
          ? "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          : "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      const auditLogs = insertedHandovers.map((handover) => ({
        action_type: "shift_handover_created",
        actor_id: actorId,
        related_to: handover.patient_id,
        created_at: new Date().toISOString(),
      }));
      await supabase.from("audit_logs").insert(auditLogs);
      setSaved(true);
      setTimeout(() => {
        setGeneralNotes("");
        setRedFlags([]);
        setFollowUps([]); // CHANGE: clear follow ups on publish
        setShiftSummary(""); // CHANGE: clear shift summary on publish
        setShiftAssessment(null);
        setSaved(false);
        fetchData(demoUser);
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save handover");
    } finally {
      setSaving(false);
    }
  };

  const sortedPatients = [...patients].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );
  const flaggedPatientIds = redFlags.map((f) => f.patient_id);
  const availablePatients = sortedPatients.filter(
    (p) => !flaggedPatientIds.includes(p.id),
  );
  const getPatient = (id) => patients.find((p) => p.id === id);

  const completionSteps = [
    { label: "Shift direction set", done: !!shiftType },
    { label: "General observations", done: generalNotes.trim().length > 0 },
    { label: "Resident flags added", done: redFlags.length > 0 },
  ];
  const completionPct = Math.round(
    (completionSteps.filter((s) => s.done).length / completionSteps.length) *
      100,
  );

  const isLoading = userLoading || loading;

  const [loadingAISummary, setLoadingAISummary] = useState(false);

  const generateAIShiftSummary = async () => {
    try {
      setLoadingAISummary(true);
      setRedFlags([]); // CHANGE: clear before generating
      setFollowUps([]); // CHANGE: clear before generating
      setShiftSummary(""); // clear before generating
      setShiftAssessment(null); // clear before generating

      const { data: visitLogs } = await supabase
        .from("visit_logs")
        .select(
          `id, notes, appetite, mood, patient_id, created_at, patients (full_name, health_summary)`,
        )
        .order("created_at", { ascending: false })
        .limit(3);
      const { data: reports } = await supabase
        .from("reports")
        .select(
          `id, content, type, patient_id, created_at, patients (full_name, health_summary)`,
        )
        .order("created_at", { ascending: false })
        .limit(3);
      const patientIdMap = {};
      const formattedVisitLogs = (visitLogs || []).map((log, index) => {
        const patientName = log.patients?.full_name || "Unknown";
        patientIdMap[patientName] = log.patient_id;
        return {
          visit: index + 1,
          patient_name: patientName,
          health_summary: log.patients?.health_summary || "Not available",
          notes: log.notes || "No notes recorded",
          appetite: log.appetite || "Not recorded",
          mood: log.mood || "Not recorded",
        };
      });
      const formattedReports = (reports || []).map((report, index) => {
        const patientName = report.patients?.full_name || "Unknown";
        patientIdMap[patientName] = report.patient_id;
        return {
          report: index + 1,
          patient_name: patientName,
          health_summary: report.patients?.health_summary || "Not available",
          type: report.type || "General",
          content: report.content || "No content",
        };
      });
      console.log("=== VISIT LOGS ===");
      formattedVisitLogs.forEach((log, i) => {
        console.log(`\nVisit Log ${i + 1}:`, log);
      });
      console.log("\n=== REPORTS ===");
      formattedReports.forEach((report, i) => {
        console.log(`\nReport ${i + 1}:`, report);
      });
      console.log("\n=== PATIENT ID MAP ===");
      console.log(patientIdMap);
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitLogs: formattedVisitLogs,
          reports: formattedReports,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const result = await response.json();
      console.log(result);
      if (result.success && result.summary) {
        const summary = JSON.parse(result.summary);
        const patientNotesMap = {};
        if (summary.critical_alerts) {
          summary.critical_alerts.forEach((alert) => {
            const parts = alert.split(" - ");
            console.log(alert);
            const patientName = parts[0];
            const patientId = patientIdMap[patientName];
            console.log("Looking for:", patientName);
            console.log("Found ID:", patientId);
            if (patientId) {
              if (!patientNotesMap[patientId]) {
                patientNotesMap[patientId] = [];
              }
              const alertWithoutName = parts.slice(1).join(" - ");
              console.log(alertWithoutName);
              patientNotesMap[patientId].push(`🚨 ${alertWithoutName}`);
            }
          });
        }
        if (summary.key_observations) {
          summary.key_observations.forEach((obs) => {
            console.log(summary.key_observations);
            const parts = obs.split(" - ");
            const patientName = parts[0];
            const patientId = patientIdMap[patientName];
            console.log("Looking for:", patientName);
            console.log("Found ID:", patientId);
            if (patientId) {
              if (!patientNotesMap[patientId]) {
                patientNotesMap[patientId] = [];
              }
              const noteWithoutName = parts.slice(1).join(" - ");
              console.log("hi" + noteWithoutName);
              patientNotesMap[patientId].push(`📋 ${noteWithoutName}`);
            }
          });
        }
        const newFlags = Object.keys(patientNotesMap).map((patientId) => ({
          patient_id: patientId,
          patient_notes: patientNotesMap[patientId].join("\n\n"),
        }));
        setRedFlags(newFlags);
        let notesText = "";
        if (summary.shift_assessment) {
          setShiftSummary(summary.shift_assessment.summary);
          setShiftAssessment(summary.shift_assessment);
          notesText += "SHIFT SUMMARY:\n\n";
          notesText += summary.shift_assessment.summary;
          notesText += "\n\n";
        }
        if (summary.follow_up_actions?.length > 0) {
          setFollowUps(summary.follow_up_actions);
          notesText += "FOLLOW-UPS:\n\n";
          summary.follow_up_actions.forEach((action, i) => {
            notesText += `${i + 1}. ${action}\n\n`;
          });
        }
        setGeneralNotes(notesText);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to generate AI summary. Please try again.");
    } finally {
      setLoadingAISummary(false);
    }
  };

  const generateTestSummary = async (testMode) => {
    try {
      setLoadingAISummary(true);
      setShiftSummary(""); // clear before generating
      setShiftAssessment(null); // clear before generating
      setRedFlags([]); // CHANGE: clear before generating
      setFollowUps([]); // CHANGE: clear before generating

      const testIds = TEST_DATA[testMode];
      const { data: visitLogs } = await supabase
        .from("visit_logs")
        .select(
          `id, notes, appetite, mood, patient_id, created_at, patients (full_name, health_summary)`,
        )
        .in("id", testIds.visitLogIds);
      const { data: reports } = await supabase
        .from("reports")
        .select(
          `id, content, type, patient_id, created_at, patients (full_name, health_summary)`,
        )
        .in("id", testIds.reportIds);
      const patientIdMap = {};
      const formattedVisitLogs = (visitLogs || []).map((log, index) => {
        const patientName = log.patients?.full_name || "Unknown";
        patientIdMap[patientName] = log.patient_id;
        return {
          visit: index + 1,
          patient_name: patientName,
          health_summary: log.patients?.health_summary || "Not available",
          notes: log.notes || "No notes recorded",
          appetite: log.appetite || "Not recorded",
          mood: log.mood || "Not recorded",
        };
      });
      const formattedReports = (reports || []).map((report, index) => {
        const patientName = report.patients?.full_name || "Unknown";
        patientIdMap[patientName] = report.patient_id;
        return {
          report: index + 1,
          patient_name: patientName,
          health_summary: report.patients?.health_summary || "Not available",
          type: report.type || "General",
          content: report.content || "No content",
        };
      });
      console.log(`=== USING ${testMode} TEST DATA ===`);
      console.log("=== VISIT LOGS ===");
      formattedVisitLogs.forEach((log, i) => {
        console.log(`\nVisit Log ${i + 1}:`, log);
      });
      console.log("\n=== REPORTS ===");
      formattedReports.forEach((report, i) => {
        console.log(`\nReport ${i + 1}:`, report);
      });
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitLogs: formattedVisitLogs,
          reports: formattedReports,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const result = await response.json();
      console.log(result);
      if (result.success && result.summary) {
        const summary = JSON.parse(result.summary);
        const patientNotesMap = {};
        if (summary.critical_alerts) {
          summary.critical_alerts.forEach((alert) => {
            const parts = alert.split(" - ");
            const patientName = parts[0];
            const patientId = patientIdMap[patientName];
            if (patientId) {
              if (!patientNotesMap[patientId]) {
                patientNotesMap[patientId] = [];
              }
              const alertWithoutName = parts.slice(1).join(" - ");
              patientNotesMap[patientId].push(`🚨 ${alertWithoutName}`);
            }
          });
        }
        if (summary.key_observations) {
          summary.key_observations.forEach((obs) => {
            const parts = obs.split(" - ");
            const patientName = parts[0];
            const patientId = patientIdMap[patientName];
            if (patientId) {
              if (!patientNotesMap[patientId]) {
                patientNotesMap[patientId] = [];
              }
              const noteWithoutName = parts.slice(1).join(" - ");
              patientNotesMap[patientId].push(`📋 ${noteWithoutName}`);
            }
          });
        }
        const newFlags = Object.keys(patientNotesMap).map((patientId) => ({
          patient_id: patientId,
          patient_notes: patientNotesMap[patientId].join("\n\n"),
        }));
        setRedFlags(newFlags);
        let notesText = "";
        if (summary.shift_assessment) {
          setShiftSummary(summary.shift_assessment.summary);
          setShiftAssessment(summary.shift_assessment);
          notesText += "SHIFT SUMMARY:\n\n";
          notesText += summary.shift_assessment.summary;
          notesText += "\n\n";
        }
        if (summary.follow_up_actions?.length > 0) {
          setFollowUps(summary.follow_up_actions);
          notesText += "FOLLOW-UPS:\n\n";
          summary.follow_up_actions.forEach((action, i) => {
            notesText += `${i + 1}. ${action}\n\n`;
          });
        }
        setGeneralNotes(notesText);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to generate AI summary. Please try again.");
    } finally {
      setLoadingAISummary(false);
    }
  };

  const getAssessmentIcon = (level) => {
    if (!level) return null;
    switch (level) {
      case "GOOD":
        return <CheckCircle size={18} className="text-green-600" />;
      case "CONCERNING":
        return <AlertTriangle size={18} className="text-yellow-600" />;
      case "CRITICAL":
        return <XCircle size={18} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getAssessmentColor = (level) => {
    switch (level) {
      case "GOOD":
        return "bg-green-50 border-green-200";
      case "CONCERNING":
        return "bg-yellow-50 border-yellow-200";
      case "CRITICAL":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  // NEW: derive flag styles from current assessment level
  const flagStyles = getFlagStyles(shiftAssessment?.level);

  return (
    <>
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 ring-1 ring-blue-100">
              <FileText size={10} />
              Care Transition
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Shift Handover
                </h2>
                <p className="text-slate-500 text-base font-medium mt-1">
                  Communication between AM and PM shifts
                </p>
              </div>
              <button
                onClick={() => handleSubmit("published")}
                disabled={saving || saved || isLoading}
                className="bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send size={16} />
                {saving
                  ? "Publishing..."
                  : saved
                    ? "Published!"
                    : "Publish Handover"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
              <p className="font-black text-xl text-slate-900 tracking-tight">
                Loading...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Shift Direction */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <ArrowRight size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Shift Direction
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Required
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {SHIFT_TYPES.map((shift) => (
                      <button
                        key={shift.value}
                        onClick={() => setShiftType(shift.value)}
                        className={`py-3 px-4 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center gap-2 ${
                          shiftType === shift.value
                            ? "bg-blue-50 border-blue-400 text-blue-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-black">
                          {shift.value === "AM->PM" ? "AM" : "PM"}
                        </span>
                        <ArrowRight size={14} />
                        <span className="font-black">
                          {shift.value === "AM->PM" ? "PM" : "AM"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Generate Button */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        AI Summary Generator
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Analyze shift data automatically
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={generateAIShiftSummary}
                    disabled={loadingAISummary}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                  >
                    {loadingAISummary ? (
                      <>
                        <Activity size={14} className="animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate AI Summary
                      </>
                    )}
                  </button>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Test Modes
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => generateTestSummary("GOOD")}
                        disabled={loadingAISummary}
                        className="py-2 px-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all disabled:opacity-50 active:scale-95"
                      >
                        🟢 Good
                      </button>
                      <button
                        onClick={() => generateTestSummary("INTERMEDIATE")}
                        disabled={loadingAISummary}
                        className="py-2 px-3 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-yellow-100 transition-all disabled:opacity-50 active:scale-95"
                      >
                        🟡 Concerning
                      </button>
                      <button
                        onClick={() => generateTestSummary("CRITICAL")}
                        disabled={loadingAISummary}
                        className="py-2 px-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 active:scale-95"
                      >
                        🔴 Critical
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shift Assessment Banner */}
                {shiftAssessment && (
                  <div
                    className={`mt-4 p-4 border-2 rounded-xl ${getAssessmentColor(shiftAssessment.level)}`}
                  >
                    <div className="flex items-center gap-2">
                      {getAssessmentIcon(shiftAssessment.level)}
                      <span className="text-md font-bold uppercase tracking-widest text-black">
                        Shift Assessment: {shiftAssessment.level}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shift Summary */}
                {shiftSummary && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Shift Summary
                    </p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {shiftSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resident Red Flags - CHANGE: header icon + cards use flagStyles */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-9 h-9 ${flagStyles.headerIcon} rounded-xl flex items-center justify-center`}
                    >
                      <AlertCircle
                        size={18}
                        className={flagStyles.headerIconColor}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Resident Red Flags
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Per-resident concerns
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {redFlags.map((flag, idx) => {
                      const patient = getPatient(flag.patient_id);
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-4 ${flagStyles.cardBg} border rounded-xl group`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full ${flagStyles.avatar} flex items-center justify-center text-xs font-black flex-shrink-0`}
                          >
                            {patient?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-black ${flagStyles.name}`}
                            >
                              {patient?.full_name} — Room {patient?.room}
                            </p>
                            <p
                              className={`text-xs ${flagStyles.notes} font-medium mt-1 leading-relaxed whitespace-pre-wrap`}
                            >
                              {flag.patient_notes || (
                                <span
                                  className={`italic ${flagStyles.emptyNote}`}
                                >
                                  No notes added
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFlag(idx)}
                            className={`p-1.5 rounded-lg ${flagStyles.removeHover} transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0`}
                          >
                            <X size={14} className={flagStyles.removeIcon} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {addingFlag ? (
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Select Resident
                        </label>
                        <select
                          value={newFlag.patient_id}
                          onChange={(e) =>
                            setNewFlag({
                              ...newFlag,
                              patient_id: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                        >
                          <option value="">Choose a resident...</option>
                          {availablePatients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.full_name} — Room {p.room} ({p.wing})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Patient Notes
                        </label>
                        <textarea
                          rows={2}
                          value={newFlag.patient_notes}
                          onChange={(e) =>
                            setNewFlag({
                              ...newFlag,
                              patient_notes: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                          placeholder="e.g. Refused morning meds, breathing slightly laboured..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAddingFlag(false);
                            setNewFlag({ patient_id: "", patient_notes: "" });
                          }}
                          className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFlag}
                          disabled={!newFlag.patient_id}
                          className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-40 uppercase tracking-widest"
                        >
                          Add Flag
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingFlag(true)}
                      disabled={availablePatients.length === 0}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-black hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <Plus size={14} />
                      Add New Flag
                    </button>
                  )}
                </div>

                {/* Follow Ups */}
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Follow Ups
                      </p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        Shift assessment, summary & follow-ups
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {followUps.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Follow-up Actions
                        </p>
                        <div className="space-y-3">
                          {followUps.map((action, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl"
                            >
                              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600 flex-shrink-0">
                                {i + 1}
                              </div>
                              <p className="text-sm text-blue-900 font-medium leading-relaxed flex-1">
                                {action}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!shiftAssessment &&
                      !shiftSummary &&
                      followUps.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-xs text-slate-400 font-medium italic">
                            Generate AI summary to populate observations and
                            follow-ups
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle
                      size={16}
                      className="text-rose-500 flex-shrink-0"
                    />
                    <p className="text-sm text-rose-600 font-bold">{error}</p>
                  </div>
                )}
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="space-y-5">
                <div className="bg-slate-900 rounded-[28px] p-6 shadow-2xl shadow-slate-200">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock size={16} className="text-blue-400" />
                    <h3 className="text-base font-black text-white">
                      Handover Details
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Date
                      </span>
                      <span className="text-sm font-black text-white">
                        {new Date().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Shift
                      </span>
                      <span className="text-sm font-black text-blue-400">
                        {SHIFT_TYPES.find((s) => s.value === shiftType)?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Author
                      </span>
                      <span className="text-sm font-black text-white">
                        {demoUser?.full_name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Flags
                      </span>
                      <span className="text-sm font-black text-white">
                        {redFlags.length} resident
                        {redFlags.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-700/60">
                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-3">
                      Completion Status
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-white w-8 text-right">
                        {completionPct}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {completionSteps.map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${done ? "bg-blue-400" : "bg-slate-600"}`}
                          />
                          <span
                            className={`text-xs font-medium transition-colors ${done ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
                  <h3 className="text-sm font-black text-slate-900 mb-5">
                    Past Handovers
                  </h3>
                  {pastHandovers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3 font-medium">
                      No past handovers found
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {pastHandovers.map((h) => (
                        <div
                          key={h.id}
                          onClick={() => handleOpenHandover(h)}
                          className="flex items-center justify-between py-3 group cursor-pointer"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {new Date(h.created_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                              {h.shift_type === "AM->PM"
                                ? "AM Shift"
                                : "PM Shift"}
                            </p>
                          </div>
                          <ChevronRight
                            size={14}
                            className="text-slate-300 group-hover:text-slate-600 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {selectedHandover && (
        <HandoverModal
          handover={selectedHandover}
          details={handoverDetails}
          loading={handoverLoading}
          onClose={() => {
            setSelectedHandover(null);
            setHandoverDetails(null);
          }}
        />
      )}
    </>
  );
}

function HandoverModal({ handover, details, loading, onClose }) {
  const fmt = (d) =>
    new Date(d).toLocaleString("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const shiftLabel =
    details?.shiftType === "AM->PM"
      ? "AM to PM Transition"
      : "PM to AM Transition";

  const parseGeneralNotes = (notes) => {
    if (!notes) return { shiftSummary: "", followUps: [], shiftLevel: null };
    const summaryMatch = notes.match(
      /SHIFT SUMMARY:\n\n([\s\S]*?)(?=\n\nFOLLOW-UPS:|$)/,
    );
    const followUpsMatch = notes.match(/FOLLOW-UPS:\n\n([\s\S]*)/);
    const shiftSummary = summaryMatch ? summaryMatch[1].trim() : "";
    const followUpsText = followUpsMatch ? followUpsMatch[1].trim() : "";
    const followUps = followUpsText
      ? followUpsText
          .split(/\n\n/)
          .map((item) => item.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
      : [];
    let shiftLevel = null;
    if (
      shiftSummary.toLowerCase().includes("critical") ||
      shiftSummary.toLowerCase().includes("severe")
    ) {
      shiftLevel = "CRITICAL";
    } else if (
      shiftSummary.toLowerCase().includes("concerning") ||
      shiftSummary.toLowerCase().includes("notable issues")
    ) {
      shiftLevel = "CONCERNING";
    } else if (
      shiftSummary.toLowerCase().includes("routine") ||
      shiftSummary.toLowerCase().includes("stable")
    ) {
      shiftLevel = "GOOD";
    }
    return { shiftSummary, followUps, shiftLevel };
  };

  const { shiftSummary, followUps, shiftLevel } = parseGeneralNotes(
    details?.generalNotes,
  );

  const getAssessmentIcon = (level) => {
    if (!level) return null;
    switch (level) {
      case "GOOD":
        return <CheckCircle size={18} className="text-green-600" />;
      case "CONCERNING":
        return <AlertTriangle size={18} className="text-yellow-600" />;
      case "CRITICAL":
        return <XCircle size={18} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getAssessmentColor = (level) => {
    switch (level) {
      case "GOOD":
        return "bg-green-50 border-green-200";
      case "CONCERNING":
        return "bg-yellow-50 border-yellow-200";
      case "CRITICAL":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  // NEW: derive flag styles from parsed shift level
  const flagStyles = getFlagStyles(shiftLevel);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] max-w-3xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Shift Handover
              </h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {handover?.created_at && fmt(handover.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-5 animate-pulse h-24"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ArrowRight size={12} className="text-blue-400" />
                    Shift Type
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {shiftLabel}
                  </p>
                </div>
                {details?.creator && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <User size={12} className="text-blue-400" />
                      Created By
                    </p>
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      {details.creator.full_name}
                    </p>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-red-400" />
                    Red Flags
                  </p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {details?.items?.length || 0} Resident
                    {details?.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {shiftLevel && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Shift Assessment
                  </p>
                  <div
                    className={`p-4 border-2 rounded-xl ${getAssessmentColor(shiftLevel)}`}
                  >
                    <div className="flex items-center gap-2">
                      {getAssessmentIcon(shiftLevel)}
                      <span className="text-sm font-bold uppercase tracking-widest text-slate-900">
                        {shiftLevel}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {shiftSummary && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Shift Summary
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {shiftSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* Resident Red Flags - CHANGE: cards use flagStyles */}
              {details?.items && details.items.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Resident Red Flags
                  </p>
                  <div className="space-y-3">
                    {details.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-5 ${flagStyles.cardBg} border rounded-2xl`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full ${flagStyles.avatar} flex items-center justify-center text-sm font-black flex-shrink-0`}
                        >
                          {item.patient?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p
                              className={`text-base font-black ${flagStyles.name}`}
                            >
                              {item.patient?.full_name}
                            </p>
                            <span
                              className={`text-[9px] px-2 py-0.5 ${flagStyles.roomBadge} rounded-full font-black uppercase tracking-widest`}
                            >
                              Room {item.patient?.room}
                            </span>
                          </div>
                          {item.patient_notes ? (
                            <p
                              className={`text-sm ${flagStyles.notes} font-medium leading-relaxed whitespace-pre-wrap`}
                            >
                              {item.patient_notes}
                            </p>
                          ) : (
                            <p
                              className={`text-sm ${flagStyles.emptyNote} italic`}
                            >
                              No specific notes recorded
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {followUps.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Follow-up Actions
                  </p>
                  <div className="space-y-3">
                    {followUps.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-black text-blue-600 flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-blue-900 font-medium leading-relaxed flex-1">
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!details?.items?.length &&
                !shiftSummary &&
                followUps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FileText size={48} className="mb-3 opacity-20" />
                    <p className="font-bold text-sm">No details available</p>
                  </div>
                )}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
