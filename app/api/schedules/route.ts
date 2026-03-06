import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    if (!date && !month) {
      return NextResponse.json(
        { error: "Date or month is required" },
        { status: 400 },
      );
    }

    let startRange: Date;
    let endRange: Date;

    if (month) {
      const parsed = new Date(month);
      startRange = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      startRange.setHours(0, 0, 0, 0);
      endRange = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);
      endRange.setHours(23, 59, 59, 999);
    } else {
      startRange = new Date(date!);
      startRange.setHours(0, 0, 0, 0);
      endRange = new Date(date!);
      endRange.setHours(23, 59, 59, 999);
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        start_at: {
          gte: startRange,
          lte: endRange,
        },
      },
      select: {
        id: true,
        title: true,
        start_at: true,
        end_at: true,
        status: true,
        patient_id: true,
        carer_id: true,
        created_at: true,
        patient: {
          select: {
            id: true,
            full_name: true,
            room: true,
          },
        },
        carer: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: { start_at: "asc" },
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      patient_id,
      carer_id,
      start_at,
      end_at,
      status,
      required_tasks,
      created_by,
    } = body;

    if (!title || !patient_id || !carer_id || !start_at || !end_at) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    if (new Date(end_at) <= new Date(start_at)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        title,
        patient_id,
        carer_id,
        start_at: new Date(start_at),
        end_at: new Date(end_at),
        status: status ?? "scheduled",
        required_tasks: required_tasks ?? null,
        created_by: created_by ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "schedule_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (err) {
    console.error("Error creating schedule:", err);
    return NextResponse.json(
      { error: "Failed to add schedule" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      patient_id,
      carer_id,
      start_at,
      end_at,
      status,
      required_tasks,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    if (!title || !patient_id || !carer_id || !start_at || !end_at) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    if (new Date(end_at) <= new Date(start_at)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 },
      );
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        title,
        patient_id,
        carer_id,
        start_at: new Date(start_at),
        end_at: new Date(end_at),
        status,
        required_tasks: required_tasks ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating schedule:", err);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 },
    );
  }
}