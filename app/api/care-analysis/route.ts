import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const session = await prisma.careAnalysisSession.findFirst({
      orderBy: { created_at: "desc" },
    });

    if (!session) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: session });
  } catch (err) {
    console.error("Error fetching latest analysis:", err);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { priority_list, created_by } = await request.json();

    await prisma.careAnalysisSession.create({
      data: {
        created_by,
        priority_list,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Error saving analysis session:", err);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 },
    );
  }
}