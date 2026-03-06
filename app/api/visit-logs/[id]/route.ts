import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  try {
    const { logId } = await params;
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get("patient_id");

    const log = await prisma.visitLog.findFirst({
      where: {
        id: logId,
        ...(patient_id && { patient_id }),
      },
    });

    if (!log) {
      return NextResponse.json(
        { error: "Visit log not found" },
        { status: 404 },
      );
    }

    const [patient, carer] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: log.patient_id! },
        select: { full_name: true },
      }),
      log.carer_id
        ? prisma.profile.findUnique({
            where: { id: log.carer_id },
            select: { full_name: true },
          })
        : null,
    ]);

    return NextResponse.json({ log, patient, carer });
  } catch (err) {
    console.error("Error fetching visit log:", err);
    return NextResponse.json(
      { error: "Failed to fetch visit log" },
      { status: 500 },
    );
  }
}
