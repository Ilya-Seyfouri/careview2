import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: familyId } = await params;

    const link = await prisma.patientFamily.findFirst({
      where: { family_id: familyId },
      select: { patient_id: true, relationship: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: "No linked patient found" },
        { status: 404 },
      );
    }

    const { patient_id, relationship } = link;

    const [patient, visitLogs, reports, upcomingSchedules] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patient_id },
      }),

      prisma.visitLog.findMany({
        where: { patient_id },
        orderBy: { created_at: "desc" },
        take: 5,
      }),

      prisma.report.findMany({
        where: { patient_id },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          created_at: true,
          creator: {
            select: { id: true, full_name: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      }),

      prisma.schedule.findMany({
        where: {
          patient_id,
          start_at: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          start_at: true,
          end_at: true,
          status: true,
          carer_id: true,
          created_by: true,
          carer: {
            select: { id: true, full_name: true, email: true, phone: true },
          },
          creator: {
            select: { id: true, full_name: true },
          },
        },
        orderBy: { start_at: "asc" },
        take: 3,
      }),
    ]);

    const carerIds = [
      ...new Set(visitLogs.map((l) => l.carer_id).filter(Boolean)),
    ] as string[];
    let carerNames: Record<string, string> = {};

    if (carerIds.length > 0) {
      const carers = await prisma.profile.findMany({
        where: { id: { in: carerIds } },
        select: { id: true, full_name: true },
      });
      carers.forEach((c) => (carerNames[c.id] = c.full_name));
    }

    return NextResponse.json({
      relationship,
      patient,
      visitLogs,
      carerNames,
      reports,
      upcomingSchedules,
    });
  } catch (err) {
    console.error("Error fetching family dashboard:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}
