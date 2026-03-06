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

    const [client, visitLogs, reports, carerLinks] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patient_id },
      }),

      prisma.visitLog.findMany({
        where: { patient_id },
        orderBy: { created_at: "desc" },
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
            select: { id: true, full_name: true, role: true },
          },
        },
        orderBy: { created_at: "desc" },
      }),

      prisma.patientCarer.findMany({
        where: { patient_id },
        select: {
          id: true,
          assigned_at: true,
          carer_id: true,
          carer: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }),
    ]);

    if (!client) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 },
      );
    }

    // Resolve carer names from visit logs
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

    const assignedCarers = carerLinks.map((l) => ({
      ...l.carer,
      assigned_at: l.assigned_at,
    }));

    return NextResponse.json({
      relationship,
      client,
      visitLogs,
      carerNames,
      reports,
      assignedCarers,
    });
  } catch (err) {
    console.error("Error fetching family resident:", err);
    return NextResponse.json(
      { error: "Failed to load resident details" },
      { status: 500 },
    );
  }
}
