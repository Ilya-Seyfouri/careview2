import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: residentId } = await params;

    const reports = await prisma.report.findMany({
      where: { patient_id: residentId },
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
