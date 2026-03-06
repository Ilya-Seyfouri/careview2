import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const familyMembers = await prisma.profile.findMany({
      where: { role: "family" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        created_at: true,
        patient_family: {
          select: {
            relationship: true,
            linked_at: true,
            patient: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: { full_name: "asc" },
    });

    // Shape the data to match original structure
    const shaped = familyMembers.map((family) => ({
      ...family,
      assignedPatients: family.patient_family.map((pf) => ({
        ...pf.patient,
        relationship: pf.relationship,
        linked_at: pf.linked_at,
      })),
      patient_family: undefined,
    }));

    return NextResponse.json(shaped);
  } catch (err) {
    console.error("Error fetching family members:", err);
    return NextResponse.json(
      { error: "Failed to fetch family members" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone } = body;

    if (!full_name || !email || !phone) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    const newFamily = await prisma.profile.create({
      data: {
        full_name,
        email,
        phone,
        role: "family",
      },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "family_member_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: newFamily.id,
      },
    });

    return NextResponse.json(newFamily, { status: 201 });
  } catch (err) {
    console.error("Error adding family member:", err);
    return NextResponse.json(
      { error: "Failed to add family member" },
      { status: 500 },
    );
  }
}