import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const [patientCount, overdueSchedules, missedEmar, carers, latestHandover] =
      await Promise.all([
        prisma.patient.count(),

        prisma.schedule.findMany({
          where: {
            status: { in: ["scheduled", "in_progress"] },
            end_at: { lt: now },
          },
          select: { id: true },
        }),

        prisma.emar.findMany({
          where: { status: "missed" },
          select: { id: true },
        }),

        prisma.profile.findMany({
          where: { role: "carer" },
          select: { id: true, status: true },
        }),

        prisma.shiftHandover.findFirst({
          orderBy: { created_at: "desc" },
        }),
      ]);

    const overdueTasks = overdueSchedules.length + missedEmar.length;

    const staffStatus = {
      active: carers.filter((c) => c.status === "active").length,
      break: carers.filter((c) => c.status === "break").length,
      scheduled: carers.filter((c) => c.status === "scheduled").length,
    };

    // Fetch handover batch + patients + author
    let handoverEntries: any[] = [];
    let handoverPatients: Record<string, any> = {};
    let handoverAuthor = null;

    if (latestHandover) {
      const batchStart = new Date(
        new Date(latestHandover.created_at!).getTime() - 2 * 60 * 1000,
      );

      const batchRows = await prisma.shiftHandover.findMany({
        where: {
          shift_type: latestHandover.shift_type,
          created_by: latestHandover.created_by,
          created_at: { gte: batchStart },
        },
        orderBy: { created_at: "asc" },
      });

      handoverEntries = batchRows;

      const patIds = [
        ...new Set(batchRows.map((r) => r.patient_id).filter(Boolean)),
      ] as string[];

      if (patIds.length > 0) {
        const patients = await prisma.patient.findMany({
          where: { id: { in: patIds } },
          select: { id: true, full_name: true, room: true, wing: true },
        });
        patients.forEach((p) => (handoverPatients[p.id] = p));
      }

      if (latestHandover.created_by) {
        handoverAuthor = await prisma.profile.findUnique({
          where: { id: latestHandover.created_by },
          select: { id: true, full_name: true, role: true },
        });
      }
    }

    return NextResponse.json({
      occupancy: patientCount,
      overdueTasks,
      staffStatus,
      latestHandover,
      handoverEntries,
      handoverPatients,
      handoverAuthor,
    });
  } catch (err) {
    console.error("Error fetching manager dashboard:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
