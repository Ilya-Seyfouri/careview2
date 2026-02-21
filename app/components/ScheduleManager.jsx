"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const modalContentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

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

  if (error) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
        <div className="container mx-auto px-6 lg:px-10 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={32} className="text-rose-500" />
              </div>
              <p className="text-lg text-rose-600 font-semibold mb-1">
                Error Loading Schedules
              </p>
              <p className="text-sm text-slate-500 font-normal">{error}</p>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <motion.section
        id="schedulelist"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50"
      >
        <div className="container mx-auto px-6 lg:px-10 pt-12 pb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4 border border-blue-100/50"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
              />
              Care Scheduling
            </motion.div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <h2 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">
                  Schedules
                </h2>
                <p className="text-slate-600 text-lg font-medium">
                  {viewMode === "list"
                    ? `${schedules.length} scheduled tasks today`
                    : `${allSchedules.length} tasks scheduled this month`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="bg-white p-1 rounded-xl border border-slate-200/60 flex shadow-sm">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-2  cursor-pointer px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-slate-50 text-slate-900 shadow-sm font-semibold"
                        : "text-slate-500 font-medium hover:text-slate-700"
                    }`}
                  >
                    <List size={18} />
                    <span className="text-xs">List</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewMode("calendar")}
                    className={`flex items-center gap-2 px-4  cursor-pointer py-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === "calendar"
                        ? "bg-slate-50 text-slate-900 shadow-sm font-semibold"
                        : "text-slate-500 font-medium hover:text-slate-700"
                    }`}
                  >
                    <Grid size={18} />
                    <span className="text-xs">Calendar</span>
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="group bg-slate-900 cursor-pointer hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl flex items-center gap-2.5 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                  type="button"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </motion.div>
                  Create Task
                </motion.button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Date Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <motion.button
                      whileHover={{ scale: 1.1, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changeDate(-1)}
                      className="w-10 h-10 hover:bg-slate-100 cursor-pointer rounded-xl transition-all duration-200 flex items-center justify-center group"
                    >
                      <ChevronLeft
                        size={20}
                        className="text-slate-600 group-hover:text-slate-900 transition-colors"
                      />
                    </motion.button>

                    <motion.h2
                      key={selectedDate.toISOString()}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-semibold text-slate-900 tracking-tight"
                    >
                      {formatDateHeader(selectedDate)}
                    </motion.h2>

                    <motion.button
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changeDate(1)}
                      className="w-10 h-10 hover:bg-slate-100 cursor-pointer rounded-xl transition-all duration-200 flex items-center justify-center group"
                    >
                      <ChevronRight
                        size={20}
                        className="text-slate-600 group-hover:text-slate-900 transition-colors"
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Schedules List */}
                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden min-h-[600px]">
                    <div className="divide-y divide-slate-100">
                      {[1, 2, 3].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </div>
                  </div>
                ) : filteredSchedules.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-24 text-slate-300 min-h-[600px]"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15, delay: 0.1 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-6"
                    >
                      <Calendar size={40} className="text-slate-300" />
                    </motion.div>
                    <p className="font-semibold text-xl text-slate-900 mb-1">
                      No schedules found
                    </p>
                    <p className="text-sm font-normal text-slate-500">
                      No schedules for this date
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden min-h-[600px]"
                  >
                    <div className="divide-y divide-slate-100">
                      {filteredSchedules.map((schedule, index) => (
                        <motion.div key={schedule.id} variants={itemVariants}>
                          <ScheduleRow
                            schedule={schedule}
                            onEdit={handleEditSchedule}
                            onDelete={handleDeleteSchedule}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Month Navigation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <motion.button
                      whileHover={{ scale: 1.1, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changeMonth(-1)}
                      className="w-10 h-10 hover:bg-slate-100 cursor-pointer rounded-xl transition-all duration-200 flex items-center justify-center group"
                    >
                      <ChevronLeft
                        size={20}
                        className="text-slate-600 group-hover:text-slate-900 transition-colors"
                      />
                    </motion.button>

                    <motion.h2
                      key={selectedDate.toISOString()}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-semibold text-slate-900 tracking-tight"
                    >
                      {formatMonthHeader(selectedDate)}
                    </motion.h2>

                    <motion.button
                      whileHover={{ scale: 1.1, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changeMonth(1)}
                      className="w-10 h-10 hover:bg-slate-100  cursor-pointer rounded-xl transition-all duration-200 flex items-center justify-center group"
                    >
                      <ChevronRight
                        size={20}
                        className="text-slate-600 group-hover:text-slate-900 transition-colors"
                      />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Calendar Grid */}
                {loading ? (
                  <div className="bg-white rounded-2xl  border border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden p-8">
                    <div className="flex items-center justify-center py-24">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Activity size={40} className="text-slate-300" />
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <CalendarGrid
                    selectedDate={selectedDate}
                    schedules={allSchedules}
                    onDateClick={(date) => {
                      setSelectedDate(date);
                      setViewMode("list");
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Add Schedule Modal */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Edit Schedule Modal */}
      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
}

function SkeletonRow() {
  return (
    <div className="p-8 animate-pulse">
      <div className="flex items-start gap-6">
        <div className="w-24 flex-shrink-0">
          <div className="h-6 bg-slate-200 rounded mb-2" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-slate-200 rounded w-64 mb-3" />
          <div className="flex items-center gap-5">
            <div className="h-4 bg-slate-100 rounded w-32" />
            <div className="h-4 bg-slate-100 rounded w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 bg-slate-100 rounded-xl w-24" />
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50 overflow-hidden"
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100/30"
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Previous month days */}
        {prevMonthDays.map((day, index) => (
          <div
            key={`prev-${index}`}
            className="min-h-[120px] p-3 border-b border-r  border-slate-100 bg-slate-50/50 opacity-50"
          >
            <div className="text-sm text-slate-400 font-medium">{day}</div>
          </div>
        ))}

        {/* Current month days */}
        {currentMonthDays.map((day, index) => {
          const daySchedules = getSchedulesForDay(day);
          const today = isToday(day);

          return (
            <motion.button
              key={day}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(248, 250, 252, 0.8)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDateClick(new Date(year, month, day))}
              className={`min-h-[120px] cursor-pointer p-3 border-b border-r border-slate-100 text-left transition-all duration-200 group ${
                today
                  ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100"
                  : ""
              }`}
            >
              <div
                className={`text-sm font-semibold mb-2 ${
                  today ? "text-blue-600" : "text-slate-900"
                }`}
              >
                {day}
                {today && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="ml-2 text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                  >
                    Today
                  </motion.span>
                )}
              </div>

              <div className="space-y-1.5">
                <AnimatePresence>
                  {daySchedules.slice(0, 3).map((schedule, idx) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1.5 rounded-lg truncate border border-blue-100 font-medium hover:shadow-sm transition-shadow"
                    >
                      {schedule.title}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {daySchedules.length > 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-500 font-medium pl-1"
                  >
                    +{daySchedules.length - 3} more
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Next month days */}
        {nextMonthDays.map((day, index) => (
          <div
            key={`next-${index}`}
            className="min-h-[120px] p-3 border-b border-r border-slate-100 bg-slate-50/50 opacity-50"
          >
            <div className="text-sm text-slate-400 font-medium">{day}</div>
          </div>
        ))}
      </div>
    </motion.div>
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
          color: "text-emerald-700",
          bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
          borderColor: "border-emerald-200",
          icon: CheckCircle2,
        };
      case "scheduled":
        return {
          text: "Upcoming",
          color: "text-slate-700",
          bgColor: "bg-gradient-to-br from-slate-50 to-slate-100",
          borderColor: "border-slate-200",
          icon: Clock,
        };
      case "in progress":
        return {
          text: "In Progress",
          color: "text-amber-700",
          bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
          borderColor: "border-amber-200",
          icon: Activity,
        };
      case "cancelled":
        return {
          text: "Cancelled",
          color: "text-rose-700",
          bgColor: "bg-gradient-to-br from-rose-50 to-red-50",
          borderColor: "border-rose-200",
          icon: X,
        };
      default:
        return {
          text: "Unknown",
          color: "text-slate-700",
          bgColor: "bg-gradient-to-br from-slate-50 to-slate-100",
          borderColor: "border-slate-200",
          icon: AlertCircle,
        };
    }
  };

  const statusInfo = getStatusDisplay(schedule.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-8 hover:bg-slate-50/50 transition-all duration-200 group/row">
      <div className="flex items-start gap-6">
        {/* Time */}
        <div className="w-24 flex-shrink-0">
          <p className="text-lg font-semibold text-slate-900">
            {formatTime(schedule.start_at)}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
            Planned
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight group-hover/row:text-blue-600 transition-colors">
            {schedule.title || "Untitled Schedule"}
          </h3>

          <div className="flex items-center gap-5 text-sm">
            {/* Patient */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                <User size={14} className="text-slate-600" />
              </div>
              <span className="text-slate-700 font-medium">
                {schedule.patient?.full_name || "Unknown"}
              </span>
            </div>

            {/* Carer */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Assignee:
              </span>
              <span className="text-blue-600 font-semibold">
                {schedule.carer?.full_name || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}
          >
            <StatusIcon size={14} strokeWidth={2.5} />
            {statusInfo.text}
          </motion.span>

          {/* Edit Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(schedule)}
            className="p-2 hover:bg-blue-50 cursor-pointer rounded-lg transition-all duration-200 group/edit"
            title="Edit schedule"
          >
            <Edit
              size={18}
              className="text-slate-400 group-hover/edit:text-blue-600 transition-colors"
            />
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(schedule.id)}
            className="p-2 hover:bg-rose-50 cursor-pointer rounded-lg transition-all duration-200 group/delete"
            title="Delete schedule"
          >
            <Trash2
              size={18}
              className="text-slate-400 group-hover/delete:text-rose-600 transition-colors"
            />
          </motion.button>
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

  const inputClass2 =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm";

  const inputClass =
    "w-full px-4 py-3 bg-white cursor-pointer border border-slate-200 rounded-xl text-slate-800 font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm";

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-10 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 border border-blue-100/50">
              <Calendar size={12} />
              New Schedule
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Add New Schedule
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors flex items-center justify-center group"
          >
            <X
              size={20}
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={inputClass2}
              placeholder="e.g. Morning Rounds, Medication Administration"
              required
            />
          </div>

          {/* Patient + Carer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                <option value="" className="">
                  Select a patient
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} - Room {p.room}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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

          {/* Required Tasks */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Required Tasks
              <span className="ml-2 text-xs text-slate-400 font-normal normal-case tracking-normal">
                (optional)
              </span>
            </label>

            {/* Task input row */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={handleTaskKeyDown}
                className={`${inputClass2} flex-1`}
                placeholder="e.g. Morning Medication"
              />
              <motion.button
                type="button"
                onClick={handleAddTask}
                disabled={!taskInput.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-3 bg-gradient-to-br cursor-pointer from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </motion.button>
            </div>

            {/* Task chips */}
            <AnimatePresence>
              {tasks.length > 0 && (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group/task hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                        <span className="text-sm text-slate-900 font-normal">
                          {task}
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-slate-400 cursor-pointer hover:text-rose-600 transition-colors p-1 opacity-0 group-hover/task:opacity-100"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {tasks.length === 0 && (
              <p className="text-xs text-slate-400 italic font-normal">
                No tasks added yet
              </p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-4"
              >
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              disabled={saving}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 px-6 py-3.5 cursor-pointer bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex-1 px-6 py-3.5 bg-slate-900 cursor-pointer text-white rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? "Adding..." : "Add Schedule"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
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

  const inputClass2 =
    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm";

  const inputClass =
    "w-full px-4 py-3 bg-white cursor-pointer border border-slate-200 rounded-xl text-slate-800 font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm";

  return (
    <motion.div
      variants={modalOverlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full p-10 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-3 border border-blue-100/50">
              <Calendar size={12} />
              Edit Schedule
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Edit Schedule
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 cursor-pointer hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center group"
          >
            <X
              size={20}
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          </motion.button>
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Activity size={48} className="mb-4 text-slate-200" />
            </motion.div>
            <p className="font-semibold text-lg text-slate-900">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass2}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
              <div className="">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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

            <div className="">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                  className={`${inputClass2} flex-1`}
                  placeholder="e.g. Morning Medication"
                />
                <motion.button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!taskInput.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-3 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </motion.button>
              </div>
              <AnimatePresence>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group/task hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                          <span className="text-sm text-slate-900 font-normal">
                            {task}
                          </span>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveTask(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-slate-400 cursor-pointer hover:text-rose-600 transition-colors p-1 opacity-0 group-hover/task:opacity-100"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-normal">
                    No tasks added yet
                  </p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-4"
                >
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                disabled={saving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 px-6 py-3.5 bg-slate-100 cursor-pointer text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold text-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex-1 px-6 py-3.5 bg-slate-900 cursor-pointer text-white rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
