import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const completed = await prisma.completedCareAction.findMany({
      select: { patient_id: true, action_type: true },
    });

    return NextResponse.json({ data: completed });
  } catch (err) {
    console.error("Error fetching completed actions:", err);
    return NextResponse.json(
      { error: "Failed to fetch completed actions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { patient_id, action_type, completed_by } = await request.json();

    await prisma.completedCareAction.create({
      data: {
        patient_id,
        action_type,
        completed_by,
        completed_at: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error completing action:", err);
    return NextResponse.json(
      { error: "Failed to complete action" },
      { status: 500 },
    );
  }
}