"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  List,
  Grid,
  Edit,
  Trash2,
} from "lucide-react";

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
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading schedules...</p>
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
      <section id="schedulelist" className="min-h-screen bg-white/50">
        <div className="container mx-auto">
          <div className="px-6 lg:px-10 pt-10 pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 bg-clip-text text-transparent">
                  Schedules
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewMode === "list"
                    ? `${schedules.length} schedules today`
                    : `${allSchedules.length} schedules this month`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List size={18} />
                    <span className="text-sm font-medium">List</span>
                  </button>
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                      viewMode === "calendar"
                        ? "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid size={18} />
                    <span className="text-sm font-medium">Calendar</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 transition-all active:scale-95"
                  type="button"
                >
                  <span>Add Schedule</span>
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
              <>
                {/* Date Navigation */}
                <div className="bg-white/5 border-2 border-white/10 rounded-lg p-4 backdrop-blur-xl mb-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeDate(-1)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={24} className="text-foreground" />
                    </button>

                    <h2 className="text-xl font-bold text-foreground">
                      {formatDateHeader(selectedDate)}
                    </h2>

                    <button
                      onClick={() => changeDate(1)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronRight size={24} className="text-foreground" />
                    </button>
                  </div>
                </div>

                {/* Schedules List */}
                {filteredSchedules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">No schedules found</p>
                    <p className="text-sm mt-2">No schedules for this date</p>
                  </div>
                ) : (
                  <div className="bg-white/5 border-2 border-white/10 rounded-lg backdrop-blur-xl overflow-hidden">
                    <div className="divide-y divide-white/10">
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
                <div className="bg-white/5 border-2 border-white/10 rounded-lg p-4 backdrop-blur-xl mb-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={24} className="text-foreground" />
                    </button>

                    <h2 className="text-xl font-bold text-foreground">
                      {formatMonthHeader(selectedDate)}
                    </h2>

                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronRight size={24} className="text-foreground" />
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
    <div className="bg-white/5 border-2 border-white/10 rounded-lg backdrop-blur-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-muted-foreground bg-white/5"
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
            className="min-h-[100px] p-2 border-b border-r border-white/5 bg-white/5 opacity-50"
          >
            <div className="text-sm text-muted-foreground">{day}</div>
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
              className={`min-h-[100px] p-2 border-b border-r border-white/5 text-left hover:bg-white/10 transition-colors ${
                today ? "bg-cyan-500/10 border-cyan-500/30" : ""
              }`}
            >
              <div
                className={`text-sm font-semibold mb-2 ${
                  today ? "text-cyan-500" : "text-foreground"
                }`}
              >
                {day}
                {today && (
                  <span className="ml-1 text-xs bg-cyan-500 text-white px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {daySchedules.slice(0, 3).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded truncate border border-cyan-500/30"
                  >
                    {schedule.title}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <div className="text-xs text-muted-foreground">
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
            className="min-h-[100px] p-2 border-b border-r border-white/5 bg-white/5 opacity-50"
          >
            <div className="text-sm text-muted-foreground">{day}</div>
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
          color: "text-green-500",
          icon: "✓",
        };
      case "scheduled":
        return {
          text: "Upcoming",
          color: "text-gray-400",
          icon: "○",
        };
      case "in progress":
        return {
          text: "In Progress",
          color: "text-orange-500",
          icon: "⟳",
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color: "text-red-500",
          icon: "✕",
        };
      default:
        return {
          text: "Unknown",
          color: "text-gray-400",
          icon: "○",
        };
    }
  };

  const statusInfo = getStatusDisplay(schedule.status);

  return (
    <div className="p-6 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-6">
        {/* Time */}
        <div className="w-24 flex-shrink-0">
          <p className="text-lg font-bold text-foreground">
            {formatTime(schedule.start_at)}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Planned
          </p>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {schedule.title || "Untitled Schedule"}
          </h3>

          <div className="flex items-center gap-4 text-sm">
            {/* Patient */}
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {schedule.patient?.full_name || "Unknown"}
              </span>
            </div>

            {/* Carer */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Assignee:</span>
              <span className="text-blue-500 font-medium">
                {schedule.carer?.full_name || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`flex items-center gap-2 ${statusInfo.color}`}>
            <span className="text-lg">{statusInfo.icon}</span>
            <span className="font-medium">{statusInfo.text}</span>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(schedule)}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors group"
            title="Edit schedule"
          >
            <Edit
              size={18}
              className="text-muted-foreground group-hover:text-cyan-400"
            />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
            title="Delete schedule"
          >
            <Trash2
              size={18}
              className="text-muted-foreground group-hover:text-red-400"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddScheduleModal({ onClose, onSuccess, selectedDate }) {
  const supabase = createClient();

  // Format the selected date for the datetime-local input
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
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoadingData(false);
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

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Unable to get current user. Please log in again.");
      }

      const { data, error: insertError } = await supabase
        .from("schedules")
        .insert([
          {
            title: formData.title,
            patient_id: formData.patient_id,
            carer_id: formData.carer_id,
            start_at: formData.start_at,
            end_at: formData.end_at,
            status: formData.status,
            created_by: user.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      console.error("Error adding schedule:", err);
      setError(err.message || "Failed to add schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Add New Schedule
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g., Morning Rounds, Medication Administration"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - Room {patient.room}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Carer *
                </label>
                <select
                  value={formData.carer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, carer_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                >
                  <option value="">Select a carer</option>
                  {carers.map((carer) => (
                    <option key={carer.id} value={carer.id}>
                      {carer.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) =>
                    setFormData({ ...formData, start_at: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) =>
                    setFormData({ ...formData, end_at: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoadingData(false);
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
        })
        .eq("id", schedule.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError(err.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 border-2 border-white/20 rounded-2xl backdrop-blur-xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Edit Schedule</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g., Morning Rounds, Medication Administration"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient *
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - Room {patient.room}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Carer *
                </label>
                <select
                  value={formData.carer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, carer_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                >
                  <option value="">Select a carer</option>
                  {carers.map((carer) => (
                    <option key={carer.id} value={carer.id}>
                      {carer.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) =>
                    setFormData({ ...formData, start_at: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) =>
                    setFormData({ ...formData, end_at: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

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
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
