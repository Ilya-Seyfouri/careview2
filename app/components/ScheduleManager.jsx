"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  List,
  Grid,
  Edit,
  Trash2,
  Plus,
  Activity,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useDemoUser } from "./DemoContext";

export default function ScheduleManager() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]); // For calendar view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"

  useEffect(() => {
    if (viewMode === "list") {
      fetchSchedules();
    } else {
      fetchMonthSchedules();
    }
  }, [selectedDate, viewMode]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      // Get start and end of selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch schedules for the selected date
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(
          "id, title, start_at, end_at, status, patient_id, carer_id, created_at",
        )
        .gte("start_at", startOfDay.toISOString())
        .lte("start_at", endOfDay.toISOString())
        .order("start_at", { ascending: true });

      if (schedulesError) throw schedulesError;

      if (!schedulesData || schedulesData.length === 0) {
        setSchedules([]);
        setLoading(false);
        return;
      }

      // Get unique patient and carer IDs
      const patientIds = [...new Set(schedulesData.map((s) => s.patient_id))];
      const carerIds = [...new Set(schedulesData.map((s) => s.carer_id))];

      // Fetch patient details
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .in("id", patientIds);

      if (patientsError) throw patientsError;

      // Fetch carer details
      const { data: carersData, error: carersError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", carerIds);

      if (carersError) throw carersError;

      // Combine schedules with patient and carer data
      const schedulesWithDetails = schedulesData.map((schedule) => ({
        ...schedule,
        patient:
          patientsData?.find((p) => p.id === schedule.patient_id) || null,
        carer: carersData?.find((c) => c.id === schedule.carer_id) || null,
      }));

      setSchedules(schedulesWithDetails);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthSchedules = async () => {
    try {
      setLoading(true);

      // Get start and end of selected month
      const startOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1,
      );
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0,
      );
      endOfMonth.setHours(23, 59, 59, 999);

      // Fetch schedules for the entire month
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(
          "id, title, start_at, end_at, status, patient_id, carer_id, created_at",
        )
        .gte("start_at", startOfMonth.toISOString())
        .lte("start_at", endOfMonth.toISOString())
        .order("start_at", { ascending: true });

      if (schedulesError) throw schedulesError;

      if (!schedulesData || schedulesData.length === 0) {
        setAllSchedules([]);
        setLoading(false);
        return;
      }

      // Get unique patient and carer IDs
      const patientIds = [...new Set(schedulesData.map((s) => s.patient_id))];
      const carerIds = [...new Set(schedulesData.map((s) => s.carer_id))];

      // Fetch patient details
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .in("id", patientIds);

      if (patientsError) throw patientsError;

      // Fetch carer details
      const { data: carersData, error: carersError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", carerIds);

      if (carersError) throw carersError;

      // Combine schedules with patient and carer data
      const schedulesWithDetails = schedulesData.map((schedule) => ({
        ...schedule,
        patient:
          patientsData?.find((p) => p.id === schedule.patient_id) || null,
        carer: carersData?.find((c) => c.id === schedule.carer_id) || null,
      }));

      setAllSchedules(schedulesWithDetails);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (
      !confirm(
        "Are you sure you want to delete this schedule? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("schedules")
        .delete()
        .eq("id", scheduleId);

      if (deleteError) throw deleteError;

      // Refresh the schedules
      if (viewMode === "list") {
        fetchSchedules();
      } else {
        fetchMonthSchedules();
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
      alert("Failed to delete schedule");
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      schedule.patient?.full_name?.toLowerCase().includes(searchLower) ||
      schedule.carer?.full_name?.toLowerCase().includes(searchLower) ||
      schedule.title?.toLowerCase().includes(searchLower)
    );
  });

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const changeMonth = (months) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + months);
    setSelectedDate(newDate);
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMonthHeader = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Activity size={80} className="mb-6 opacity-10 animate-pulse" />
            <p className="font-black text-xl text-slate-900 tracking-tight">
              Loading schedules...
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
              <p className="text-lg text-red-500 font-bold">Error: {error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="schedulelist" className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-6 lg:px-10 pt-10 pb-6">
          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Calendar size={12} />
              Care Scheduling
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  Care Schedules
                </h2>
                <p className="text-slate-500 text-lg font-medium mt-1">
                  {viewMode === "list"
                    ? `Monitoring ${schedules.length} scheduled tasks today`
                    : `${allSchedules.length} tasks scheduled this month`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="bg-white p-1 rounded-xl ring-1 ring-slate-100 flex shadow-sm">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-slate-50 text-slate-900 shadow-sm font-black"
                        : "text-slate-400 font-bold hover:text-slate-600"
                    }`}
                  >
                    <List size={18} />
                    <span className="text-[10px] uppercase tracking-widest">
                      List
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      viewMode === "calendar"
                        ? "bg-slate-50 text-slate-900 shadow-sm font-black"
                        : "text-slate-400 font-bold hover:text-slate-600"
                    }`}
                  >
                    <Grid size={18} />
                    <span className="text-[10px] uppercase tracking-widest">
                      Calendar
                    </span>
                  </button>
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
                  Create Task
                </button>
              </div>
            </div>
          </div>

          {viewMode === "list" ? (
            <>
              {/* Date Navigation */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 mb-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => changeDate(-1)}
                    className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft size={24} className="text-slate-900" />
                  </button>

                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {formatDateHeader(selectedDate)}
                  </h2>

                  <button
                    onClick={() => changeDate(1)}
                    className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ChevronRight size={24} className="text-slate-900" />
                  </button>
                </div>
              </div>

              {/* Schedules List */}
              {filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <Calendar size={80} className="mb-6 opacity-10" />
                  <p className="font-black text-xl text-slate-900 tracking-tight">
                    No schedules found
                  </p>
                  <p className="text-sm font-bold mt-2 text-slate-400 uppercase tracking-widest">
                    No schedules for this date
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {filteredSchedules.map((schedule) => (
                      <ScheduleRow
                        key={schedule.id}
                        schedule={schedule}
                        onEdit={handleEditSchedule}
                        onDelete={handleDeleteSchedule}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Month Navigation */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 mb-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ChevronLeft size={24} className="text-slate-900" />
                  </button>

                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {formatMonthHeader(selectedDate)}
                  </h2>

                  <button
                    onClick={() => changeMonth(1)}
                    className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <ChevronRight size={24} className="text-slate-900" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <CalendarGrid
                selectedDate={selectedDate}
                schedules={allSchedules}
                onDateClick={(date) => {
                  setSelectedDate(date);
                  setViewMode("list");
                }}
              />
            </>
          )}
        </div>
      </section>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <AddScheduleModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            if (viewMode === "list") {
              fetchSchedules();
            } else {
              fetchMonthSchedules();
            }
          }}
          selectedDate={selectedDate}
        />
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && editingSchedule && (
        <EditScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowEditModal(false);
            setEditingSchedule(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingSchedule(null);
            if (viewMode === "list") {
              fetchSchedules();
            } else {
              fetchMonthSchedules();
            }
          }}
        />
      )}
    </>
  );
}

function CalendarGrid({ selectedDate, schedules, onDateClick }) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get days from previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from(
    { length: firstDay },
    (_, i) => daysInPrevMonth - firstDay + i + 1,
  );

  // Get days for current month
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get days for next month to fill the grid
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const nextMonthDays = Array.from(
    { length: totalCells - firstDay - daysInMonth },
    (_, i) => i + 1,
  );

  const getSchedulesForDay = (day, monthOffset = 0) => {
    const date = new Date(year, month + monthOffset, day);
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.start_at);
      return (
        scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (day, monthOffset = 0) => {
    const today = new Date();
    const date = new Date(year, month + monthOffset, day);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/30"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Previous month days */}
        {prevMonthDays.map((day, index) => (
          <div
            key={`prev-${index}`}
            className="min-h-[100px] p-3 border-b border-r border-slate-50 bg-slate-50/50 opacity-50"
          >
            <div className="text-sm text-slate-400 font-bold">{day}</div>
          </div>
        ))}

        {/* Current month days */}
        {currentMonthDays.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const today = isToday(day);

          return (
            <button
              key={day}
              onClick={() => onDateClick(new Date(year, month, day))}
              className={`min-h-[100px] p-3 border-b border-r border-slate-50 text-left hover:bg-slate-50 transition-colors ${
                today ? "bg-blue-50/50 border-blue-100" : ""
              }`}
            >
              <div
                className={`text-sm font-black mb-2 ${
                  today ? "text-blue-600" : "text-slate-900"
                }`}
              >
                {day}
                {today && (
                  <span className="ml-1.5 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {daySchedules.slice(0, 3).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg truncate border border-blue-100 font-bold"
                  >
                    {schedule.title}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <div className="text-xs text-slate-500 font-bold">
                    +{daySchedules.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* Next month days */}
        {nextMonthDays.map((day, index) => (
          <div
            key={`next-${index}`}
            className="min-h-[100px] p-3 border-b border-r border-slate-50 bg-slate-50/50 opacity-50"
          >
            <div className="text-sm text-slate-400 font-bold">{day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({ schedule, onEdit, onDelete }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          text: "Completed",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          ringColor: "ring-emerald-100",
          icon: CheckCircle2,
        };
      case "scheduled":
        return {
          text: "Upcoming",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          ringColor: "ring-slate-100",
          icon: Clock,
        };
      case "in progress":
        return {
          text: "In Progress",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          ringColor: "ring-amber-100",
          icon: Activity,
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color: "text-rose-600",
          bgColor: "bg-rose-50",
          ringColor: "ring-rose-100",
          icon: X,
        };
      default:
        return {
          text: "Unknown",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          ringColor: "ring-slate-100",
          icon: AlertCircle,
        };
    }
  };

  const statusInfo = getStatusDisplay(schedule.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-8 hover:bg-slate-50/50 transition-colors group/row">
      <div className="flex items-start gap-6">
        {/* Time */}
        <div className="w-24 flex-shrink-0">
          <p className="text-lg font-black text-slate-900">
            {formatTime(schedule.start_at)}
          </p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
            Planned
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight group-hover/row:text-blue-600 transition-colors">
            {schedule.title || "Untitled Schedule"}
          </h3>

          <div className="flex items-center gap-4 text-sm">
            {/* Patient */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                <User size={14} className="text-slate-600" />
              </div>
              <span className="text-slate-600 font-bold">
                {schedule.patient?.full_name || "Unknown"}
              </span>
            </div>

            {/* Carer */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-black uppercase tracking-widest">
                Assignee:
              </span>
              <span className="text-blue-600 font-black">
                {schedule.carer?.full_name || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.ringColor}`}
          >
            <StatusIcon size={14} strokeWidth={3} />
            {statusInfo.text}
          </span>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(schedule)}
            className="p-2 hover:bg-blue-50 rounded-xl transition-colors group/edit"
            title="Edit schedule"
          >
            <Edit
              size={18}
              className="text-slate-400 group-hover/edit:text-blue-600"
            />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-2 hover:bg-rose-50 rounded-xl transition-colors group/delete"
            title="Delete schedule"
          >
            <Trash2
              size={18}
              className="text-slate-400 group-hover/delete:text-rose-600"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddScheduleModal({ onClose, onSuccess, selectedDate }) {
  const supabase = createClient();
  const { demoUser } = useDemoUser();

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T09:00`;
  };

  const [formData, setFormData] = useState({
    title: "",
    patient_id: "",
    carer_id: "",
    start_at: formatDateForInput(selectedDate),
    end_at: formatDateForInput(selectedDate).replace("09:00", "10:00"),
    status: "scheduled",
  });
  const [patients, setPatients] = useState([]);
  const [carers, setCarers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Required tasks state
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchPatientsAndCarers();
  }, []);

  const fetchPatientsAndCarers = async () => {
    try {
      setLoadingData(true);
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .order("full_name", { ascending: true });
      if (patientsError) throw patientsError;

      const { data: carersData, error: carersError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "carer")
        .order("full_name", { ascending: true });
      if (carersError) throw carersError;

      setPatients(patientsData || []);
      setCarers(carersData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTasks((prev) => [...prev, trimmed]);
    setTaskInput("");
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTaskKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.patient_id ||
      !formData.carer_id ||
      !formData.start_at ||
      !formData.end_at
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      setError("End time must be after start time");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (!demoUser) throw new Error("No demo user selected.");

      const { data: newSchedule, error: insertError } = await supabase
        .from("schedules")
        .insert([
          {
            title: formData.title,
            patient_id: formData.patient_id,
            carer_id: formData.carer_id,
            start_at: formData.start_at,
            end_at: formData.end_at,
            status: formData.status,
            required_tasks: tasks.length > 0 ? JSON.stringify(tasks) : null,
            created_by: demoUser.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Audit log: schedule created
      await supabase.from("audit_logs").insert({
        action_type: "schedule_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: formData.patient_id,
        created_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to add schedule");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Calendar size={12} />
              New Schedule
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Add New Schedule
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity size={60} className="mb-4 opacity-10 animate-pulse" />
            <p className="font-black text-lg text-slate-900">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
                placeholder="e.g., Morning Rounds, Medication Administration"
                required
              />
            </div>

            {/* Patient + Carer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} - Room {p.room}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Carer *
                </label>
                <select
                  value={formData.carer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, carer_id: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select a carer</option>
                  {carers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start + End */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) =>
                    setFormData({ ...formData, start_at: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) =>
                    setFormData({ ...formData, end_at: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={inputClass}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Required Tasks */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Required Tasks
                <span className="ml-2 text-xs text-slate-400 font-normal normal-case tracking-normal">
                  (optional — press Enter or + to add)
                </span>
              </label>

              {/* Task input row */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  className={`${inputClass} flex-1`}
                  placeholder="e.g. Morning Medication"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!taskInput.trim()}
                  className="px-6 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-black text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {/* Task chips */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-900 font-medium">
                          {task}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {tasks.length === 0 && (
                <p className="text-xs text-slate-400 italic font-medium">
                  No tasks added yet
                </p>
              )}
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
                {saving ? "Adding..." : "Add Schedule"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EditScheduleModal({ schedule, onClose, onSuccess }) {
  const supabase = createClient();

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Parse existing tasks from JSON string
  const parseExistingTasks = () => {
    try {
      if (!schedule.required_tasks) return [];
      return JSON.parse(schedule.required_tasks);
    } catch {
      return [];
    }
  };

  const [formData, setFormData] = useState({
    title: schedule.title || "",
    patient_id: schedule.patient_id || "",
    carer_id: schedule.carer_id || "",
    start_at: formatDateForInput(schedule.start_at),
    end_at: formatDateForInput(schedule.end_at),
    status: schedule.status || "scheduled",
  });
  const [patients, setPatients] = useState([]);
  const [carers, setCarers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState(parseExistingTasks);

  useEffect(() => {
    fetchPatientsAndCarers();
  }, []);

  const fetchPatientsAndCarers = async () => {
    try {
      setLoadingData(true);
      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, full_name, room")
        .order("full_name");
      const { data: carersData } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "carer")
        .order("full_name");
      setPatients(patientsData || []);
      setCarers(carersData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTasks((prev) => [...prev, trimmed]);
    setTaskInput("");
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTaskKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.patient_id ||
      !formData.carer_id ||
      !formData.start_at ||
      !formData.end_at
    ) {
      setError("Please fill in all required fields");
      return;
    }
    if (new Date(formData.end_at) <= new Date(formData.start_at)) {
      setError("End time must be after start time");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const { error: updateError } = await supabase
        .from("schedules")
        .update({
          title: formData.title,
          patient_id: formData.patient_id,
          carer_id: formData.carer_id,
          start_at: formData.start_at,
          end_at: formData.end_at,
          status: formData.status,
          required_tasks: tasks.length > 0 ? JSON.stringify(tasks) : null,
        })
        .eq("id", schedule.id);
      if (updateError) throw updateError;
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] max-w-2xl w-full p-10 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ring-1 ring-blue-100">
              <Calendar size={12} />
              Edit Schedule
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Edit Schedule
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity size={60} className="mb-4 opacity-10 animate-pulse" />
            <p className="font-black text-lg text-slate-900">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} - Room {p.room}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Carer *
                </label>
                <select
                  value={formData.carer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, carer_id: e.target.value })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select a carer</option>
                  {carers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) =>
                    setFormData({ ...formData, start_at: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) =>
                    setFormData({ ...formData, end_at: e.target.value })
                  }
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={inputClass}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Required Tasks */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Required Tasks
                <span className="ml-2 text-xs text-slate-400 font-normal normal-case tracking-normal">
                  (press Enter or + to add)
                </span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={handleTaskKeyDown}
                  className={`${inputClass} flex-1`}
                  placeholder="e.g. Morning Medication"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!taskInput.trim()}
                  className="px-6 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-black text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-900 font-medium">
                          {task}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">
                  No tasks added yet
                </p>
              )}
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
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
