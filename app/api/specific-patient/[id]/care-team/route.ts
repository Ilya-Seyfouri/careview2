import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: residentId } = await params;

    // Fetch assigned carers
    const carers = await prisma.patientCarer.findMany({
      where: { patient_id: residentId },
      select: {
        id: true,
        assigned_at: true,
        carer_id: true,
        carer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Fetch assigned family
    const family = await prisma.patientFamily.findMany({
      where: { patient_id: residentId },
      select: {
        id: true,
        relationship: true,
        linked_at: true,
        family_id: true,
        family: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Fetch available carers (not already assigned)
    const assignedCarerIds = carers.map((c) => c.carer_id);
    const availableCarers = await prisma.profile.findMany({
      where: {
        role: "carer",
        ...(assignedCarerIds.length > 0 && { id: { notIn: assignedCarerIds } }),
      },
      select: { id: true, full_name: true, email: true, phone: true },
    });

    // Fetch available family (not already linked)
    const assignedFamilyIds = family.map((f) => f.family_id);
    const availableFamily = await prisma.profile.findMany({
      where: {
        role: "family",
        ...(assignedFamilyIds.length > 0 && {
          id: { notIn: assignedFamilyIds },
        }),
      },
      select: { id: true, full_name: true, email: true, phone: true },
    });

    return NextResponse.json({
      carers,
      family,
      availableCarers,
      availableFamily,
    });
  } catch (err) {
    console.error("Error fetching care team:", err);
    return NextResponse.json(
      { error: "Failed to fetch care team" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: residentId } = await params;
    const body = await request.json();
    const { type, profile_id } = body;

    if (type === "carer") {
      await prisma.patientCarer.create({
        data: { patient_id: residentId, carer_id: profile_id },
      });
      await prisma.auditLog.create({
        data: {
          action_type: "carer_assigned_to_patient",
          actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          related_to: residentId,
        },
      });
    } else if (type === "family") {
      await prisma.patientFamily.create({
        data: {
          patient_id: residentId,
          family_id: profile_id,
          relationship: "Family Member",
        },
      });
      await prisma.auditLog.create({
        data: {
          action_type: "family_linked_to_patient",
          actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          related_to: residentId,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error assigning to care team:", err);
    return NextResponse.json({ error: "Failed to assign" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const assignId = searchParams.get("assign_id");

    if (!type || !assignId) {
      return NextResponse.json(
        { error: "type and assign_id are required" },
        { status: 400 },
      );
    }

    if (type === "carer") {
      await prisma.patientCarer.delete({ where: { id: assignId } });
    } else if (type === "family") {
      await prisma.patientFamily.delete({ where: { id: assignId } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing from care team:", err);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
