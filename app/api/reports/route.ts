import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient_id, created_by, title, type, content } = body;

    if (!patient_id || !title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    const newReport = await prisma.report.create({
      data: {
        patient_id,
        created_by,
        title: title.trim(),
        type: type ?? null,
        content: content.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action_type: "report_created",
        actor_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        related_to: patient_id,
      },
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (err) {
    console.error("Error creating report:", err);
    return NextResponse.json(
      { error: "Failed to save report." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // 1. Total completed visits
    const totalVisits = await prisma.schedule.count({
      where: { status: "completed" },
    });

    // 2. All reports with patient name
    const reports = await prisma.report.findMany({
      select: {
        id: true,
        type: true,
        patient_id: true,
        patient: {
          select: { full_name: true },
        },
      },
    });

    const totalReports = reports.length;

    // 3. Group reports by type
    const typeCounts = { falls: 0, medication: 0, nutrition: 0, other: 0 };
    reports.forEach((r) => {
      const t = r.type || "other";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const total = reports.length || 1;
    const reportsByType = [
      {
        label: "Falls",
        key: "falls",
        count: typeCounts.falls,
        color: "#ef4444",
        pct: Math.round((typeCounts.falls / total) * 100),
      },
      {
        label: "Medication",
        key: "medication",
        count: typeCounts.medication,
        color: "#f59e0b",
        pct: Math.round((typeCounts.medication / total) * 100),
      },
      {
        label: "Nutrition",
        key: "nutrition",
        count: typeCounts.nutrition,
        color: "#3b82f6",
        pct: Math.round((typeCounts.nutrition / total) * 100),
      },
      {
        label: "Other",
        key: "other",
        count: typeCounts.other,
        color: "#94a3b8",
        pct: Math.round((typeCounts.other / total) * 100),
      },
    ];

    // 4. Staff visit counts
    const completedSchedules = await prisma.schedule.findMany({
      where: { status: "completed", carer_id: { not: null } },
      select: { carer_id: true },
    });

    const carerMap: Record<string, number> = {};
    completedSchedules.forEach((s) => {
      if (!s.carer_id) return;
      carerMap[s.carer_id] = (carerMap[s.carer_id] || 0) + 1;
    });

    const carerIds = Object.keys(carerMap);
    let staffVisitCounts: { name: string; visits: number }[] = [];

    if (carerIds.length > 0) {
      const carers = await prisma.profile.findMany({
        where: { id: { in: carerIds }, role: "carer" },
        select: { id: true, full_name: true },
      });

      staffVisitCounts = carers
        .map((c) => ({
          id: c.id,
          name: c.full_name || "Unknown",
          shortName: c.full_name
            ? `${c.full_name.split(" ")[0]} ${c.full_name.split(" ").slice(-1)[0]?.[0] || ""}.`
            : "Unknown",
          visits: carerMap[c.id] || 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 3);
    }

    return NextResponse.json({
      totalVisits,
      totalReports,
      reportsByType,
      staffVisitCounts,
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
