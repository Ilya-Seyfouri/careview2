import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, family_id, relationship } = body;

    if (!patient_id || !family_id || !relationship) {
      return NextResponse.json(
        { error: "Please select a resident and relationship" },
        { status: 400 },
      );
    }

    await prisma.patientFamily.create({
      data: {
        patient_id,
        family_id,
        relationship,
      },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "family_linked_to_patient",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error linking family member:", err);
    return NextResponse.json(
      { error: "Failed to link family member" },
      { status: 500 },
    );
  }
}
