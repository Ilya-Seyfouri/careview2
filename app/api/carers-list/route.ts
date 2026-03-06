import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const carers = await prisma.profile.findMany({
      where: { role: "carer" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
      },
      orderBy: { full_name: "asc" },
    });

    return NextResponse.json(carers);
  } catch (err) {
    console.error("Error fetching carers:", err);
    return NextResponse.json(
      { error: "Failed to fetch carers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, phone, role } = body;

    if (!full_name || !email || !phone) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    const newCarer = await prisma.profile.create({
      data: {
        full_name,
        email,
        phone,
        role: role ?? "carer",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action_type: "carer_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: newCarer.id,
      },
    });

    return NextResponse.json(newCarer, { status: 201 });
  } catch (err) {
    console.error("Error adding carer:", err);
    return NextResponse.json({ error: "Failed to add carer" }, { status: 500 });
  }
}