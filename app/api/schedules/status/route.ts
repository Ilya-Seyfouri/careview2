import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, patient_id } = body;

    await prisma.schedule.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "schedule_started",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating schedule status:", err);
    return NextResponse.json(
      { error: "Failed to update schedule status" },
      { status: 500 },
    );
  }
}
