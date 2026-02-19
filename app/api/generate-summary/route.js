import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { visitLogs, reports } = await request.json();

    const systemprompt = `You are a care home manager writing a shift handover summary for the incoming team.

#YOUR TASK
Summarise what happened this shift so the next team knows what occurred. You are reporting facts, not analysing them. Do not explain why something is concerning or suggest follow-up actions — that is handled separately.

#YOUR PROCESS

STEP 1 - EXTRACT KEY EVENTS
For each visit log and report:
- Note the patient name, patient ID, and time (if available)
- Extract what happened: incidents, mood, appetite, behaviours, key observations

STEP 2 - CATEGORISE EVENTS

CRITICAL INCIDENTS — Events involving immediate safety or medical concern:
- Falls, injuries, medical emergencies
- Significant vital sign abnormalities
- Elopement attempts or serious behavioural episodes
- GP/paramedic contacted during shift
- O2 drops, seizures, loss of consciousness

NOTABLE OBSERVATIONS — Anything the next shift should be aware of:
- Changes in mood, appetite, or behaviour
- Medication refusals
- Positive progress or engagement worth continuing
- Routine care completed without issue (brief mention only)

If a concern was identified and fully resolved within the same shift (e.g. patient redirected and settled), it is a NOTABLE OBSERVATION, not a CRITICAL INCIDENT.

STEP 3 - ASSESS OVERALL SHIFT
- GOOD: Routine shift, no significant concerns
- CONCERNING: Notable issues occurred but were managed
- CRITICAL: Serious incidents requiring urgent attention from the next shift

#YOUR OUTPUT

Return ONLY a JSON object with this structure:

{
  "critical_incidents": [
    "Patient ID - Patient Name - What happened (specific, factual, concise)"
  ],
  "notable_observations": [
    "Patient ID - Patient Name - What happened (specific, factual, concise)"
  ],
  "shift_assessment": {
    "level": "GOOD" | "CONCERNING" | "CRITICAL",
    "summary": "1-2 sentence summary of the shift"
  }
}`;

    const userprompt = `Summarise the following shift activity for handover to the next team.

EXAMPLES:

EXAMPLE 1 - CRITICAL SHIFT:

Input:
VISIT LOGS:
[
  {
    "visit": 1,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000000003",
    "patient_name": "Betty Smith",
    "health_summary": "Anxiety disorder, depression history, 3 previous hip fractures, high fall risk",
    "notes": "Refused lunch, seemed withdrawn, avoided eye contact",
    "appetite": "Poor - refused meal",
    "mood": "Anxious and withdrawn"
  },
  {
    "visit": 2,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000000003",
    "patient_name": "Betty Smith",
    "health_summary": "Anxiety disorder, depression history, 3 previous hip fractures, high fall risk",
    "notes": "Found on bathroom floor at 3pm. Reported dizziness. Small bruise on left arm. Vitals stable.",
    "appetite": "Not recorded",
    "mood": "Shaken but responsive"
  }
]

INCIDENT REPORTS:
[
  {
    "report": 1,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000000003",
    "patient_name": "Betty Smith",
    "health_summary": "Anxiety disorder, depression history, 3 previous hip fractures, high fall risk",
    "type": "Fall",
    "content": "Fall in bathroom at 3pm. Reported dizziness. Minor bruising on arm. No head injury. Alert and oriented."
  }
]

Output:
{
  "critical_incidents": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Found on bathroom floor at 3pm reporting dizziness, bruise on left arm, no head injury, vitals stable"
  ],
  "notable_observations": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Refused lunch earlier in the shift, appeared withdrawn and avoided eye contact",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Minor bruising on left forearm noted post-fall, wound reviewed, no infection signs"
  ],
  "shift_assessment": {
    "level": "CRITICAL",
    "summary": "Betty Smith had a fall at 3pm with reported dizziness and bruising. She had also refused lunch and was withdrawn earlier in the shift."
  }
}


EXAMPLE 2 - GOOD SHIFT:

Input:
VISIT LOGS:
[
  {
    "visit": 1,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000000044",
    "patient_name": "John Davis",
    "health_summary": "Mild dementia, usually social and engaged. Moderate mobility, uses walking stick.",
    "notes": "Ate full breakfast. Very chatty about football. Assisted to garden. Good spirits.",
    "appetite": "Good - ate full meal",
    "mood": "Happy and engaged"
  },
  {
    "visit": 2,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000000323",
    "patient_name": "Sarah Wilson",
    "health_summary": "Recovering from knee surgery (4 weeks post-op). On physiotherapy program 3x weekly.",
    "notes": "Completed all physio exercises. Notable improvement in knee flexion. Pain level 2/10. Motivated.",
    "appetite": "Good",
    "mood": "Positive and motivated"
  },
  {
    "visit": 3,
    "patient_id": "b1b2c3d4-e5f6-4a5b-8c9d-000000030400",
    "patient_name": "Margaret Thompson",
    "health_summary": "Type 2 diabetes, well-controlled. Requires insulin before meals.",
    "notes": "Blood sugar 6.2 mmol/L before lunch (in range). Insulin administered. Ate well. Participated in crafts.",
    "appetite": "Good - ate full lunch",
    "mood": "Content and focused"
  }
]

Output:
{
  "critical_incidents": [],
  "notable_observations": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000044 - John Davis - Ate full breakfast, chatty and engaged, assisted to garden",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000323 - Sarah Wilson - Completed all physio exercises, notable improvement in knee flexion, pain 2/10",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000030400 - Margaret Thompson - Blood sugar 6.2 mmol/L (in range), insulin administered, ate well"
  ],
  "shift_assessment": {
    "level": "GOOD",
    "summary": "Routine shift with no incidents. All patients showed positive engagement and stable conditions."
  }
}


Now summarise this shift:

VISIT LOGS:
${JSON.stringify(visitLogs, null, 2)}

INCIDENT REPORTS:
${JSON.stringify(reports, null, 2)}

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.`;


    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemprompt,
        },
        {
          role: "user",
          content: userprompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const summary =
      completion.choices[0]?.message?.content || "Unable to generate summary";

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
