"use client";
import { createClient } from "../lib/supabase/client";
import { useState, useEffect } from "react";
import {
  FileText,
  ClipboardList,
  Shield,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

export default function AuditLog() {
  const supabase = createClient();
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

      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      if (!logsData || logsData.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      // Get unique actor IDs
      const actorIds = [...new Set(logsData.map((log) => log.actor_id))];

      // Fetch actor details from profiles
      const { data: actorsData, error: actorsError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("id", actorIds);

      if (actorsError) throw actorsError;

      // Combine logs with actor data
      const logsWithDetails = logsData.map((log) => ({
        ...log,
        actor: actorsData?.find((a) => a.id === log.actor_id) || null,
      }));

      setLogs(logsWithDetails);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeInfo = (entityType) => {
    switch (entityType?.toLowerCase()) {
      case "system":
        return {
          label: "SYSTEM",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          icon: <FileText size={16} />,
        };
      case "task":
        return {
          label: "TASK",
          color: "text-green-600",
          bgColor: "bg-green-50",
          icon: <ClipboardList size={16} />,
        };
      case "security":
        return {
          label: "SECURITY",
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          icon: <Shield size={16} />,
        };
      case "access":
        return {
          label: "ACCESS",
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          icon: <UserCheck size={16} />,
        };
      case "alert":
        return {
          label: "ALERT",
          color: "text-red-600",
          bgColor: "bg-red-50",
          icon: <AlertTriangle size={16} />,
        };
      default:
        return {
          label: entityType?.toUpperCase() || "UNKNOWN",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          icon: <FileText size={16} />,
        };
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      log.entity_type?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading) {
    return (
      <section className="min-h-screen bg-white/50">
        <div className="container mx-auto px-6 lg:px-10 py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading audit logs...</p>
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
    <section id="auditlog" className="min-h-screen bg-white/50">
      <div className="container mx-auto px-6 lg:px-10 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Audit Log</h1>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg focus:outline-none focus:border-cyan-500 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/5 border-2 border-white/10 rounded-lg focus:outline-none focus:border-cyan-500 text-foreground"
            >
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="task">Task</option>
              <option value="security">Security</option>
              <option value="access">Access</option>
              <option value="alert">Alert</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        {currentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm mt-2">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your filters"
                : "No logs available"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600 uppercase tracking-wider">
                <div className="col-span-2">Event Type</div>
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">User</div>
                <div className="col-span-3">Action</div>
                <div className="col-span-3">Related To</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {currentLogs.map((log) => {
                  const eventInfo = getEventTypeInfo(log.entity_type);
                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Event Type */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-md ${eventInfo.bgColor}`}
                        >
                          <span className={eventInfo.color}>
                            {eventInfo.icon}
                          </span>
                          <span
                            className={`font-semibold text-xs ${eventInfo.color}`}
                          >
                            {eventInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-gray-600">
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>

                      {/* User */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {log.actor?.full_name || "System"}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="col-span-3 flex items-center">
                        <span className="text-sm text-gray-900">
                          {log.action || "Unknown Action"}
                        </span>
                      </div>

                      {/* Related To */}
                      <div className="col-span-3 flex items-center">
                        <span className="text-sm text-gray-600">
                          {log.entity_id || "N/A"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {indexOfFirstLog + 1} to{" "}
                  {Math.min(indexOfLastLog, filteredLogs.length)} of{" "}
                  {filteredLogs.length} logs
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} className="text-foreground" />
                  </button>

                  <span className="text-sm text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} className="text-foreground" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
