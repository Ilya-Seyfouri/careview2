import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        actor_id: true,
        action_type: true,
        related_to: true,
        created_at: true,
        actor: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    // Fetch patients for related_to ids
    const relatedIds = [
      ...new Set(logs.map((l) => l.related_to).filter(Boolean)),
    ] as string[];

    let patientsMap: Record<string, { id: string; full_name: string }> = {};

    if (relatedIds.length > 0) {
      const patients = await prisma.patient.findMany({
        where: { id: { in: relatedIds } },
        select: { id: true, full_name: true },
      });
      patients.forEach((p) => (patientsMap[p.id] = p));
    }

    const shaped = logs.map((log) => ({
      ...log,
      patient: log.related_to ? (patientsMap[log.related_to] ?? null) : null,
    }));

    return NextResponse.json(shaped);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
