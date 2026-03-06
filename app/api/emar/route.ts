import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const [emar, patients] = await Promise.all([
      prisma.emar.findMany(),
      prisma.patient.findMany({
        select: {
          id: true,
          full_name: true,
          room: true,
          wing: true,
        },
      }),
    ]);

    return NextResponse.json({ emar, patients });
  } catch (err) {
    console.error("Error fetching emar data:", err);
    return NextResponse.json(
      { error: "Failed to fetch emar data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, medication_name, medication_mg, time_to_take, status } =
      body;

    if (!patient_id || !medication_name || !medication_mg || !time_to_take) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 },
      );
    }

    const newEmar = await prisma.emar.create({
      data: {
        patient_id,
        medication_name,
        medication_mg: parseInt(medication_mg),
        time_to_take,
        status: status ?? "due",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action_type: "emar_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",

        related_to: patient_id,
      },
    });

    return NextResponse.json(newEmar, { status: 201 });
  } catch (err) {
    console.error("Error adding emar:", err);
    return NextResponse.json(
      { error: "Failed to add medication" },
      { status: 500 },
    );
  }
}


export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ids, status, patient_id, recorded_at } = body;

    const whereIds = ids ?? (id ? [id] : []);

    if (whereIds.length === 0) {
      return NextResponse.json({ error: "No id(s) provided" }, { status: 400 });
    }

    await prisma.emar.updateMany({
      where: { id: { in: whereIds } },
      data: {
        status: status ?? "given",
        ...(recorded_at && { recorded_at: new Date(recorded_at) }),
      },
    });

    if (patient_id) {
      await prisma.auditLog.create({
        data: {
          action_type: "emar_administered",
          actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          related_to: patient_id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error administering emar:", err);
    return NextResponse.json(
      { error: "Failed to update medication" },
      { status: 500 },
    );
  }
}
