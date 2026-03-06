import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, carer_id, schedule_id, notes, appetite, mood } = body;

    await prisma.visitLog.create({
      data: {
        patient_id,
        carer_id,
        schedule_id,
        notes: notes.trim(),
        appetite,
        mood,
      },
    });

    await prisma.schedule.update({
      where: { id: schedule_id },
      data: { status: "completed" },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "schedule_completed",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error submitting visit log:", err);
    return NextResponse.json(
      { error: "Failed to submit visit log" },
      { status: 500 },
    );
  }
}
