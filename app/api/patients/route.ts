import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const patients = await prisma.patient.findMany();
    return NextResponse.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, dob, room, status, wing, key_health_indicator } = body;

    if (!full_name || !dob || !room) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    const newPatient = await prisma.patient.create({
      data: {
        full_name,
        dob: new Date(dob),
        room,
        status,
        wing,
        key_health_indicator,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action_type: "patient_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",

        related_to: newPatient.id,
      },
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (err) {
    console.error("Error adding patient:", err);
    return NextResponse.json(
      { error: "Failed to add resident" },
      { status: 500 },
    );
  }
}
