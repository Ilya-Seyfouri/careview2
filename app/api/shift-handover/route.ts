import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const role = searchParams.get("role");

    // Get patients — filtered by carer assignment or all if manager
    let patients;
    if (role === "carer" && user_id) {
      const assignments = await prisma.patientCarer.findMany({
        where: { carer_id: user_id },
        select: { patient_id: true },
      });
      const patientIds = assignments.map((a) => a.patient_id);
      patients = await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, full_name: true, room: true, wing: true },
      });
    } else {
      patients = await prisma.patient.findMany({
        select: { id: true, full_name: true, room: true, wing: true },
      });
    }

    // Get past handovers — deduped by created_at, last 5 unique
    const past = await prisma.shiftHandover.findMany({
      orderBy: { created_at: "desc" },
      take: 25,
      select: { id: true, shift_type: true, created_at: true },
    });

    const seen = new Set();
    const pastHandovers = past
      .filter((h) => {
        const key = h.created_at?.toISOString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);

    return NextResponse.json({ patients, pastHandovers });
  } catch (err) {
    console.error("Error fetching shift handover data:", err);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { redFlags, shiftType, generalNotes, actor_id } = body;

    const shiftTypeMap: Record<string, string> = {
      "AM->PM": "AM_PM",
      "PM->AM": "PM_AM",
    };

    const rows = redFlags.map((flag: any) => ({
      patient_id: flag.patient_id,
      shift_type: shiftTypeMap[shiftType] ?? shiftType,
      notes: generalNotes || null,
      patient_notes: flag.patient_notes || null,
      created_by: actor_id,
    }));

    const insertedHandovers = await prisma.shiftHandover.createManyAndReturn({
      data: rows,
    });

    await prisma.auditLog.createMany({
      data: insertedHandovers.map((h) => ({
        action_type: "shift_handover_created",
        actor_id,
        related_to: h.patient_id,
      })),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error saving handover:", err);
    return NextResponse.json(
      { error: "Failed to save handover" },
      { status: 500 },
    );
  }
}
