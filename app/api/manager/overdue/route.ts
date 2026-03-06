import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const [schedules, emars] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          status: { in: ["scheduled", "in_progress"] },
          end_at: { lt: now },
        },
        select: {
          id: true,
          title: true,
          patient_id: true,
          carer_id: true,
          start_at: true,
          end_at: true,
          status: true,
          required_tasks: true,
        },
        orderBy: { end_at: "asc" },
      }),

      prisma.emar.findMany({
        where: { status: "missed" },
        select: {
          id: true,
          patient_id: true,
          medication_name: true,
          medication_mg: true,
          time_to_take: true,
          status: true,
        },
        orderBy: { time_to_take: "asc" },
      }),
    ]);

    const patientIds = [
      ...new Set(
        [
          ...schedules.map((s) => s.patient_id),
          ...emars.map((e) => e.patient_id),
        ].filter(Boolean),
      ),
    ] as string[];

    let patients: Record<string, any> = {};
    if (patientIds.length > 0) {
      const pats = await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, full_name: true, room: true, wing: true },
      });
      pats.forEach((p) => (patients[p.id] = p));
    }

    return NextResponse.json({ schedules, emars, patients });
  } catch (err) {
    console.error("Error fetching overdue data:", err);
    return NextResponse.json(
      { error: "Failed to fetch overdue data" },
      { status: 500 },
    );
  }
}
