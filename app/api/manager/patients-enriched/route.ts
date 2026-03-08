import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { TEST_VISIT_LOG_IDS, TEST_REPORT_IDS } from "../../../lib/testDataIds";



const daysSince = (date: Date | null | undefined): number | string => {
  if (!date) return "No visit on record";
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        full_name: true,
        bp: true,
        pulse: true,
        health_summary: true,
        key_health_indicator: true,
      },
    });

    const enriched = await Promise.all(
      patients.map(async (patient) => {
        const [visitLogs, reports, lastSchedule, emar] = await Promise.all([
          prisma.visitLog.findMany({
            where: {
              patient_id: patient.id,
              id: { notIn: TEST_VISIT_LOG_IDS, },
            },
            orderBy: { created_at: "desc" },
            take: 2,
            select: {
              notes: true,
              appetite: true,
              mood: true,
              created_at: true,
            },
          }),

          prisma.report.findMany({
            where: { patient_id: patient.id, id: { notIn: TEST_REPORT_IDS } },
            orderBy: { created_at: "desc" },
            take: 2,
            select: { type: true, content: true, created_at: true },
          }),

          prisma.schedule.findFirst({
            where: {
              patient_id: patient.id,
              status: "completed",
            },
            orderBy: { start_at: "desc" },
            select: { start_at: true },
          }),

          prisma.emar.findMany({
            where: { patient_id: patient.id },
            select: {
              medication_name: true,
              medication_mg: true,
              time_to_take: true,
              status: true,
            },
          }),
        ]);

        return {
          patient_id: patient.id,
          patient_name: patient.full_name,
          bp: patient.bp,
          pulse: patient.pulse,
          health_summary: patient.health_summary,
          days_since_last_visit: daysSince(lastSchedule?.start_at),
          visit_logs: visitLogs.map((l) => ({
            notes: l.notes,
            appetite: l.appetite,
            mood: l.mood,
          })),
          reports: reports.map((r) => ({
            type: r.type,
            content: r.content,
          })),
          emar: {
            missed_count: emar.filter((e) => e.status === "missed").length,
            medication_list: emar.map((e) => e.medication_name).filter(Boolean),
            missed_medications: emar
              .filter((e) => e.status === "missed")
              .map((e) => `${e.medication_name} (${e.time_to_take})`),
          },
        };
      }),
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("Error fetching enriched patients:", err);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}
