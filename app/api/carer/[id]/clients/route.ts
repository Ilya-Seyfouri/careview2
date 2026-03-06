import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const assignments = await prisma.patientCarer.findMany({
      where: { carer_id: id },
      select: {
        patient: {
          select: {
            id: true,
            full_name: true,
            room: true,
            status: true,
            dob: true,
            wing: true,
            pulse: true,
            bp: true,
            key_health_indicator: true,
          },
        },
      },
    });

    const clients = assignments.map((a) => a.patient);

    return NextResponse.json(clients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: carer_id } = await params;
    const body = await request.json();
    const { patient_id } = body;

    await prisma.patientCarer.create({
      data: {
        patient_id,
        carer_id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "carer_assigned_to_patient",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error assigning patient:", err);
    return NextResponse.json(
      { error: "Failed to assign patient" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: carer_id } = await params;
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get("patient_id");

    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 },
      );
    }

    await prisma.patientCarer.deleteMany({
      where: {
        carer_id,
        patient_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error unassigning patient:", err);
    return NextResponse.json(
      { error: "Failed to unassign patient" },
      { status: 500 },
    );
  }
}