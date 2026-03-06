import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carer_id = searchParams.get("carer_id");
    const family_id = searchParams.get("family_id");

    const messages = await prisma.message.findMany({
      where: { carer_id, family_id },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, sender_id, carer_id, family_id } = body;

    const message = await prisma.message.create({
      data: { content, sender_id, carer_id, family_id },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    console.error("Error sending message:", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
