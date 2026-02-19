import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { patient_name, reasoning } = await request.json();

    if (!patient_name || !reasoning) {
      return NextResponse.json(
        { success: false, error: "Missing patient_name or reasoning" },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a clinical care assistant. Write clear, professional content for care home staff. Be concise and factual. Return ONLY a valid JSON object with no markdown, no code fences, no extra text.",
        },
        {
          role: "user",
          content: `Write a clinical care report for a resident named ${patient_name}.

Based on this clinical reasoning:
${reasoning}

Requirements for title:
- Short, specific and descriptive (e.g. "Elevated BP and Missed Medication — ${patient_name}")
- No more than 10 words

Requirements for content:
- 2 to 4 sentences
- Professional, factual tone
- Written in third person (e.g. "The resident...")
- No bullet points or labels — plain paragraph only

Return ONLY a valid JSON object. No markdown, no explanation, no code fences:
{
  "title": "...",
  "content": "..."
}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      title: parsed.title,
      content: parsed.content,
    });
  } catch (error) {
    console.error("Generate report content error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
