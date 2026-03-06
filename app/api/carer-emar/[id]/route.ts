import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: carerId } = await params;

    // 1. Get assigned patient IDs
    const assignments = await prisma.patientCarer.findMany({
      where: { carer_id: carerId },
      select: { patient_id: true },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ emar: [], patients: {} });
    }

    const patientIds = assignments.map((a) => a.patient_id);

    // 2. Fetch patients
    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: {
        id: true,
        full_name: true,
        room: true,
        wing: true,
      },
    });

    const patMap: Record<string, any> = {};
    patients.forEach((p) => (patMap[p.id] = p));

    // 3. Fetch EMAR for assigned patients
    const emar = await prisma.emar.findMany({
      where: { patient_id: { in: patientIds } },
    });

    return NextResponse.json({ emar, patients: patMap });
  } catch (err) {
    console.error("Error fetching carer EMAR:", err);
    return NextResponse.json(
      { error: "Failed to fetch EMAR data" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: carerId } = await params;
    const body = await request.json();
    const { id, patient_id } = body;

    const updated = await prisma.emar.update({
      where: { id },
      data: { status: "given" },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "emar_administered",
        actor_id: carerId,
        related_to: patient_id,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error administering EMAR:", err);
    return NextResponse.json(
      { error: "Failed to administer medication" },
      { status: 500 },
    );
  }
}
