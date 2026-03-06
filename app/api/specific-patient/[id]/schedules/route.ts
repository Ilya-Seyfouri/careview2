import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: residentId } = await params;

    const schedules = await prisma.schedule.findMany({
      where: { patient_id: residentId },
      select: {
        id: true,
        start_at: true,
        end_at: true,
        status: true,
        created_at: true,
        title: true,
        carer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        creator: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { start_at: "desc" },
    });

    return NextResponse.json(schedules);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}
