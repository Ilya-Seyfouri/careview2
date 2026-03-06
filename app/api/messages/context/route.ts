import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carer_id = searchParams.get("carer_id");
    const family_id = searchParams.get("family_id");

    const profiles = await prisma.profile.findMany({
      where: { id: { in: [carer_id!, family_id!] } },
      select: { id: true, full_name: true, role: true },
    });

    const carerPatients = await prisma.patientCarer.findMany({
      where: { carer_id: carer_id! },
      select: { patient_id: true },
    });

    const familyPatients = await prisma.patientFamily.findMany({
      where: { family_id: family_id! },
      select: { patient_id: true },
    });

    const carerIds = new Set(carerPatients.map((p) => p.patient_id));
    const sharedId = familyPatients.find((p) =>
      carerIds.has(p.patient_id),
    )?.patient_id;

    let patient = null;
    if (sharedId) {
      patient = await prisma.patient.findUnique({
        where: { id: sharedId },
        select: { id: true, full_name: true, room: true, wing: true },
      });
    }

    const profileMap: Record<string, any> = {};
    profiles.forEach((p) => (profileMap[p.id] = p));

    return NextResponse.json({ profiles: profileMap, patient });
  } catch (err) {
    console.error("Error fetching message context:", err);
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 },
    );
  }
}
