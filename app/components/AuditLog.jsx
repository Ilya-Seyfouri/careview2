"use client";
import { useState, useEffect } from "react";
import {
  FileText,
  ClipboardList,
  Shield,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    fetchAuditLogs();
  }, []);

 const fetchAuditLogs = async () => {
   try {
     setLoading(true);

     const res = await fetch("/api/audit-logs");
     if (!res.ok) throw new Error("Failed to fetch audit logs");
     const data = await res.json();

     setLogs(data);
   } catch (err) {
     console.error("Error fetching audit logs:", err);
     setError(err.message);
   } finally {
     setLoading(false);
   }
 };

  const getActionTypeInfo = (actionType) => {
    const action = actionType?.toLowerCase() || "";

    if (action.includes("patient") || action.includes("resident")) {
      return {
        label: "Patient",
        color: "text-blue-700",
        bgColor: "bg-gradient-to-br from-blue-50 to-blue-100/50",
        borderColor: "border-blue-200/60",
        icon: <UserCheck size={14} />,
        dotColor: "bg-blue-500",
      };
    }
    if (action.includes("carer") || action.includes("family")) {
      return {
        label: "Staff",
        color: "text-emerald-700",
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
        borderColor: "border-emerald-200/60",
        icon: <UserCheck size={14} />,
        dotColor: "bg-emerald-500",
      };
    }
    if (action.includes("schedule") || action.includes("shift")) {
      return {
        label: "Schedule",
        color: "text-purple-700",
        bgColor: "bg-gradient-to-br from-purple-50 to-purple-100/50",
        borderColor: "border-purple-200/60",
        icon: <ClipboardList size={14} />,
        dotColor: "bg-purple-500",
      };
    }
    if (action.includes("emar") || action.includes("medication")) {
      return {
        label: "Medication",
        color: "text-orange-700",
        bgColor: "bg-gradient-to-br from-orange-50 to-orange-100/50",
        borderColor: "border-orange-200/60",
        icon: <FileText size={14} />,
        dotColor: "bg-orange-500",
      };
    }
    if (action.includes("report") || action.includes("handover")) {
      return {
        label: "Report",
        color: "text-cyan-700",
        bgColor: "bg-gradient-to-br from-cyan-50 to-cyan-100/50",
        borderColor: "border-cyan-200/60",
        icon: <FileText size={14} />,
        dotColor: "bg-cyan-500",
      };
    }

    return {
      label: "System",
      color: "text-slate-700",
      bgColor: "bg-gradient-to-br from-slate-50 to-slate-100/50",
      borderColor: "border-slate-200/60",
      icon: <Shield size={14} />,
      dotColor: "bg-slate-500",
    };
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;

    return date.toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatActionType = (actionType) => {
    if (!actionType) return "Unknown Action";
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      getActionTypeInfo(log.action_type).label.toLowerCase() ===
        filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Stats
  const stats = [
    {
      label: "Total Logs",
      value: logs.length.toLocaleString(),
      icon: <FileText size={20} />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      label: "This Week",
      value: logs
        .filter(
          (log) =>
            new Date(log.created_at) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        )
        .length.toLocaleString(),
      icon: <Calendar size={20} />,
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Filtered",
      value: filteredLogs.length.toLocaleString(),
      icon: <Filter size={20} />,
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Background Pattern */}
      <div className="relative container mx-auto px-6 lg:px-10 py-12 max-w-[1600px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          {/* Title Section */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl blur-xl opacity-20" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                  <Shield size={28} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-1">
                  Audit Log
                </h1>
                <p className="text-slate-500">
                  Activity tracking and compliance monitoring
                </p>
              </div>
            </div>

            {/* Export Button */}
           
          </div>

          

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by category, user, or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all text-sm font-medium shadow-sm"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="relative min-w-[200px]">
                <Filter
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-slate-900 transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="patient">Patient</option>
                  <option value="staff">Staff</option>
                  <option value="schedule">Schedule</option>
                  <option value="medication">Medication</option>
                  <option value="report">Report</option>
                  <option value="system">System</option>
                </select>
                <ChevronRight
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden"
          >
            <div className="p-20 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg"
              >
                <Activity size={36} className="text-slate-400" />
              </motion.div>
              <p className="text-xl font-semibold text-slate-900 mb-2">
                Loading audit logs
              </p>
              <p className="text-sm text-slate-500">
                Fetching activity data...
              </p>
            </div>
          </motion.div>
        ) : currentLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl"
          >
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <FileText size={48} className="text-slate-300" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 mb-3">
                No audit logs found
              </p>
              <p className="text-slate-500 max-w-md">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter to see more results"
                  : "No activity has been logged yet"}
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Audit Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-6 px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60">
                <div className="col-span-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Category
                </div>
                <div className="col-span-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Timestamp
                </div>
                <div className="col-span-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  User
                </div>
                <div className="col-span-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Action
                </div>
                <div className="col-span-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Related To
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100/60">
                <AnimatePresence>
                  {currentLogs.map((log, index) => {
                    const actionInfo = getActionTypeInfo(log.action_type);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.03,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        whileHover={{
                          backgroundColor: "rgba(248, 250, 252, 0.8)",
                        }}
                        className="grid grid-cols-12 gap-6 px-8 py-5 transition-colors"
                      >
                        {/* Category */}
                        <div className="col-span-2 flex items-center">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl ${actionInfo.bgColor} border ${actionInfo.borderColor} shadow-sm`}
                          >
                            <span className={actionInfo.color}>
                              {actionInfo.icon}
                            </span>
                            <span
                              className={`font-semibold text-xs ${actionInfo.color}`}
                            >
                              {actionInfo.label}
                            </span>
                          </motion.div>
                        </div>

                        {/* Timestamp */}
                        <div className="col-span-2 flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${actionInfo.dotColor} animate-pulse`}
                          />
                          <span className="text-sm text-slate-600 font-medium">
                            {formatTimestamp(log.created_at)}
                          </span>
                        </div>

                        {/* User */}
                        <div className="col-span-2 flex items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm">
                              {log.actor?.full_name?.charAt(0) || "S"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900">
                                {log.actor?.full_name || "System"}
                              </span>
                              {log.actor?.role && (
                                <span className="text-xs text-slate-500 capitalize font-medium">
                                  {log.actor.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="col-span-3 flex items-center">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatActionType(log.action_type)}
                          </span>
                        </div>

                        {/* Related To */}
                        <div className="col-span-3 flex items-center">
                          {log.patient?.full_name ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                                {log.patient.full_name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">
                                {log.patient.full_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 font-medium">
                              {log.related_to
                                ? `${log.related_to.substring(0, 8)}...`
                                : "—"}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="flex items-center justify-between mt-8"
              >
                <p className="text-sm text-slate-600 font-medium">
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {indexOfFirstLog + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-900">
                    {Math.min(indexOfLastLog, filteredLogs.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900">
                    {filteredLogs.length}
                  </span>{" "}
                  logs
                </p>

                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                    whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                    className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  >
                    <ChevronLeft size={20} className="text-slate-700" />
                  </motion.button>

                  <div className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className="text-sm font-semibold text-slate-900">
                      Page {currentPage}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      of
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {totalPages}
                    </span>
                  </div>

                  <motion.button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    whileHover={{
                      scale: currentPage === totalPages ? 1 : 1.05,
                    }}
                    whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                    className="p-3 bg-white hover:bg-slate-50 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  >
                    <ChevronRight size={20} className="text-slate-700" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
