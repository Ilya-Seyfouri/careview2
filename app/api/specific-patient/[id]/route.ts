import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Fetch Patient
    const resident = await prisma.patient.findUnique({
      where: { id },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 },
      );
    }

    // 2. Fetch Visit Logs
    const visitLogs = await prisma.visitLog.findMany({
      where: { patient_id: id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ resident, visitLogs });
  } catch (err) {
    console.error("Error fetching resident:", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
