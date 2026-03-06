import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;

    // 1. Fetch Patient
    const client = await prisma.patient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 2. Fetch Visit Logs
    const visitLogs = await prisma.visitLog.findMany({
      where: { patient_id: clientId },
      orderBy: { created_at: "desc" },
    });

    // 3. Fetch Reports with creator profile
    const reports = await prisma.report.findMany({
      where: { patient_id: clientId },
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // 4. Fetch Family Members
    const familyLinks = await prisma.patientFamily.findMany({
      where: { patient_id: clientId },
      select: {
        relationship: true,
        family: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const familyMembers = familyLinks.map((f) => ({
      ...f.family,
      relationship: f.relationship,
    }));

    return NextResponse.json({ client, visitLogs, reports, familyMembers });
  } catch (err) {
    console.error("Error fetching client:", err);
    return NextResponse.json(
      { error: "Failed to load client" },
      { status: 500 },
    );
  }
}
