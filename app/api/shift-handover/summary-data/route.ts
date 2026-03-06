import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const [visitLogs, reports] = await Promise.all([
      prisma.visitLog.findMany({
        orderBy: { created_at: "desc" },
        take: 3,
        select: {
          id: true,
          notes: true,
          appetite: true,
          mood: true,
          patient_id: true,
          created_at: true,
          patient: {
            select: { full_name: true, health_summary: true },
          },
        },
      }),

      prisma.report.findMany({
        orderBy: { created_at: "desc" },
        take: 3,
        select: {
          id: true,
          content: true,
          type: true,
          patient_id: true,
          created_at: true,
          patient: {
            select: { full_name: true, health_summary: true },
          },
        },
      }),
    ]);

    const formattedVisitLogs = visitLogs.map((log, index) => ({
      visit: index + 1,
      patient_id: log.patient_id,
      patient_name: log.patient?.full_name || "Unknown",
      health_summary: log.patient?.health_summary || "Not available",
      notes: log.notes || "No notes recorded",
      appetite: log.appetite || "Not recorded",
      mood: log.mood || "Not recorded",
    }));

    const formattedReports = reports.map((report, index) => ({
      report: index + 1,
      patient_id: report.patient_id,
      patient_name: report.patient?.full_name || "Unknown",
      health_summary: report.patient?.health_summary || "Not available",
      type: report.type || "General",
      content: report.content || "No content",
    }));

    return NextResponse.json({
      visitLogs: formattedVisitLogs,
      reports: formattedReports,
    });
  } catch (err) {
    console.error("Error fetching summary data:", err);
    return NextResponse.json(
      { error: "Failed to fetch summary data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { visitLogIds, reportIds } = await request.json();

    const [visitLogs, reports] = await Promise.all([
      prisma.visitLog.findMany({
        where: { id: { in: visitLogIds } },
        select: {
          id: true,
          notes: true,
          appetite: true,
          mood: true,
          patient_id: true,
          created_at: true,
          patient: {
            select: { full_name: true, health_summary: true },
          },
        },
      }),

      prisma.report.findMany({
        where: { id: { in: reportIds } },
        select: {
          id: true,
          content: true,
          type: true,
          patient_id: true,
          created_at: true,
          patient: {
            select: { full_name: true, health_summary: true },
          },
        },
      }),
    ]);

    const formattedVisitLogs = visitLogs.map((log, index) => ({
      visit: index + 1,
      patient_id: log.patient_id,
      patient_name: log.patient?.full_name || "Unknown",
      health_summary: log.patient?.health_summary || "Not available",
      notes: log.notes || "No notes recorded",
      appetite: log.appetite || "Not recorded",
      mood: log.mood || "Not recorded",
    }));

    const formattedReports = reports.map((report, index) => ({
      report: index + 1,
      patient_id: report.patient_id,
      patient_name: report.patient?.full_name || "Unknown",
      health_summary: report.patient?.health_summary || "Not available",
      type: report.type || "General",
      content: report.content || "No content",
    }));

    return NextResponse.json({
      visitLogs: formattedVisitLogs,
      reports: formattedReports,
    });
  } catch (err) {
    console.error("Error fetching test summary data:", err);
    return NextResponse.json(
      { error: "Failed to fetch test data" },
      { status: 500 },
    );
  }
}
