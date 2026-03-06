import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get the handover to find its created_at
    const handover = await prisma.shiftHandover.findUnique({
      where: { id },
      select: { created_at: true },
    });

    if (!handover) {
      return NextResponse.json(
        { error: "Handover not found" },
        { status: 404 },
      );
    }

    // Get all handovers from the same created_at (the full group)
    const handoverGroup = await prisma.shiftHandover.findMany({
      where: { created_at: handover.created_at },
      select: {
        id: true,
        shift_type: true,
        notes: true,
        patient_notes: true,
        created_at: true,
        created_by: true,
        patient: {
          select: { id: true, full_name: true, room: true, wing: true },
        },
      },
      orderBy: { patient_id: "asc" },
    });

    // Get creator info
    const createdBy = handoverGroup[0]?.created_by;
    let creator = null;
    if (createdBy) {
      creator = await prisma.profile.findUnique({
        where: { id: createdBy },
        select: { id: true, full_name: true, role: true },
      });
    }

    return NextResponse.json({
      items: handoverGroup,
      creator,
      shiftType: handoverGroup[0]?.shift_type,
      generalNotes: handoverGroup[0]?.notes,
      createdAt: handoverGroup[0]?.created_at,
    });
  } catch (err) {
    console.error("Error fetching handover details:", err);
    return NextResponse.json(
      { error: "Failed to fetch handover details" },
      { status: 500 },
    );
  }
}
