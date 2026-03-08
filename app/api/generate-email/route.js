import OpenAI from "openai";
import { NextResponse } from "next/server";


export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { patient_name, family_name, reasoning } = await request.json();

    if (!patient_name || !family_name || !reasoning) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing patient_name, family_name or reasoning",
        },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a care home manager writing to a resident's family member. Write warm, professional and reassuring emails. Return ONLY a valid JSON object with no markdown, no code fences, no extra text.",
        },
        {
          role: "user",
          content: `Write an email to ${family_name}, family member of care home resident ${patient_name}.

Based on this clinical reasoning:
${reasoning}

Requirements for subject:
- Clear and professional (e.g. "Update Regarding ${patient_name} — Greenview Care Home")
- No more than 12 words

Requirements for body:
- Start with "Dear ${family_name},"
- 2 to 3 short paragraphs
- Warm but professional tone
- No clinical jargon
- End with an invitation to call or visit
- Sign off as "The Care Team at Greenview Care Home"

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.:
{
  "subject": "...",
  "body": "..."
}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      subject: parsed.subject,
      body: parsed.body,
    });
  } catch (error) {
    console.error("Generate email content error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
