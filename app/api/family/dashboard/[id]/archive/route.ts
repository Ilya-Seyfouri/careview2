import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: familyId } = await params;

    // Get linked patient
    const link = await prisma.patientFamily.findFirst({
      where: { family_id: familyId },
      select: { patient_id: true },
    });

    if (!link) {
      return NextResponse.json(
        { error: "No linked patient found" },
        { status: 404 },
      );
    }

    const { patient_id } = link;

    const [logs, reports] = await Promise.all([
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
            select: { id: true, full_name: true },
          },
        },
        orderBy: { created_at: "desc" },
      }),
    ]);

    // Resolve carer names
    const carerIds = [
      ...new Set(logs.map((l) => l.carer_id).filter(Boolean)),
    ] as string[];
    let carerNames: Record<string, string> = {};

    if (carerIds.length > 0) {
      const carers = await prisma.profile.findMany({
        where: { id: { in: carerIds } },
        select: { id: true, full_name: true },
      });
      carers.forEach((c) => (carerNames[c.id] = c.full_name));
    }

    return NextResponse.json({ logs, reports, carerNames });
  } catch (err) {
    console.error("Error fetching archive:", err);
    return NextResponse.json(
      { error: "Failed to fetch archive" },
      { status: 500 },
    );
  }
}
