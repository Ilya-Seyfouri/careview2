import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise< { id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Fetch Carer Profile
    const carer = await prisma.profile.findFirst({
      where: {
        id,
        role: "carer",
      },
    });

    if (!carer) {
      return NextResponse.json({ error: "Carer not found" }, { status: 404 });
    }

    // 2. Fetch Assigned Patients via patient_carers join table
    const patientCarers = await prisma.patientCarer.findMany({
      where: { carer_id: id },
      select: {
        patient: {
          select: {
            id: true,
            full_name: true,
            room: true,
            status: true,
          },
        },
      },
    });

    const assignedPatients = patientCarers
      .map((pc) => pc.patient)
      .filter((p) => p !== null);

    // 3. Fetch Upcoming Schedules
    const upcomingSchedules = await prisma.schedule.findMany({
      where: {
        carer_id: id,
        status: "scheduled",
      },
      include: {
        patient: {
          select: {
            full_name: true,
            room: true,
          },
        },
      },
      orderBy: { start_at: "asc" },
      take: 10,
    });

    return NextResponse.json({ carer, assignedPatients, upcomingSchedules });
  } catch (err) {
    console.error("Error fetching carer:", err);
    return NextResponse.json(
      { error: "Failed to load carer information" },
      { status: 500 },
    );
  }
}
