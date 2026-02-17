import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { visitLogs, reports } = await request.json();

    const systemprompt = `You are a care home manager who is an expert in writing shift handover summarys.

#YOUR TASK
Analyze visit logs and incident reports, then create a structured handover for the next shift.

#YOUR PROCESS

STEP 1 - EXTRACT KEY DATA
For each visit log and report:
- Note the patient name and time
- Extract what happened (notes, appetite, mood, content)
- Identify the patient's health context (health_summary field)

STEP 2 - IDENTIFY RED FLAGS
For each concern, construct the alert in this order:

1) What happened — pulled directly from the visit note or report content
2) Why this is dangerous — connect it to their health summary
3) What it could lead to — the clinical risk

Do not include follow-up actions or monitoring suggestions here. Do not lead with the health summary. The note or report content always comes first.


STEP 3 - ASSESS SEVERITY
For each concern identified:
- CRITICAL: Immediate medical risk or safety issue (falls, severe behavioural change, medical emergency, GP contacted, O2 drop, elopement attempt). Each patient is assessed independently — multiple patients can be CRITICAL in the same shift.
- KEY OBSERVATION: Notable change that needs monitoring (first medication refusal, mild mood shift) or positive/routine activities. If a patient was successfully redirected or settled during the shift, it is a KEY OBSERVATION not CRITICAL.

ROUTING:
- CRITICAL findings → critical_alerts
- KEY OBSERVATION findings → key_observations

STEP 4 - DETERMINE FOLLOW-UP ACTIONS
For critical and important concerns:
- What specific action does the next shift need to take?
- When? (urgent = next few hours, soon = within shift, monitor = ongoing)
- Why? (brief reason based on health context)

STEP 5 - ASSESS OVERALL SHIFT
Consider the shift holistically:
- GOOD: Routine day, no significant concerns
- CONCERNING: Notable issues requiring attention but manageable  
- CRITICAL: Multiple serious incidents or high-risk situations


#YOUR OUTPUT

Based on your step-by-step analysis above, return ONLY a JSON object with this structure:

{
  "critical_alerts": [
    "Patient ID - Patient Name - specific issue - why it's critical and what further issues it could lead to"
  ],
 "key_observations": [
  "Patient ID - Patient Name - [WHAT HAPPENED: specific note content] - [WHY NOTABLE: connection to health summary, whether positive or concerning] - [IMPLICATION: what this means going forward]"

  ],
  "follow_up_actions": [
    "Patient ID - Patient Name - Specific action needed - urgency level - reason"
  ],
  "shift_assessment": {
    "level": "GOOD" | "CONCERNING" | "CRITICAL",
    "summary": "1-2 sentence overall assessment explaining the level"
  }
}

    `;

    const userprompt = `Create a concise shift summary to pass onto the next shift based on the following recent activity:

    Examples:


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
  "critical_alerts": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Betty was found on the bathroom floor at 3pm reporting dizziness with a bruise on her left arm — she has 3 previous hip fractures making any fall extremely high-risk — undetected fracture or worsening injury could result in serious long-term mobility loss or life-threatening complication"
  ],
  "key_observations": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Betty refused lunch and was withdrawn and avoided eye contact during the earlier visit — given her history of anxiety disorder and depression this pattern of social withdrawal and appetite loss is a known early indicator — if untreated this could signal the onset of a depressive episode",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Minor bruising spotted on left arm following the fall — while recorded as minor, bruising can mask deeper tissue damage — given her hip fracture history any physical trauma warrants close monitoring for delayed pain or swelling"
  ],
  "follow_up_actions": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003  - Betty Smith - Urgent medical review - WITHIN 2 HOURS - Assess fall injuries and investigate dizziness cause given high fall risk history",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Monitor for concussion symptoms  - NEXT 24 HOURS - Standard fall protocol despite no visible head injury",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000003 - Betty Smith - Mental health check-in  - TODAY - Withdrawn behavior and meal refusal are early warning signs given depression history"
  ],
  "shift_assessment": {
    "level": "CRITICAL",
    "summary": "High-risk patient Betty Smith experienced a fall with reported dizziness and has a history of 3 hip fractures requiring immediate medical review. Earlier withdrawal and meal refusal also suggest possible mental health decline."
  }
}


Key Reasoning:
→ Visit 2 notes say "found on bathroom floor, reported dizziness, bruise on left arm" — this is the specific event so it leads the alert. The health summary then tells us she has 3 previous hip fractures, which is why even a minor fall is CRITICAL not just IMPORTANT. The risk closes it: undetected fracture or delayed injury in a patient with this history could be life-threatening. Severity = CRITICAL → routes to critical_alerts.

→ Visit 1 notes say "refused lunch, withdrawn, avoided eye contact" — this is the specific observation so it leads. The health summary tells us she has anxiety disorder and depression, which is why withdrawal and appetite loss are not just a bad day — they are recognised early indicators of a depressive episode. Severity = IMPORTANT → routes to key_observations.

→ The bruising from the report is a separate key_observation because it is a distinct finding from the fall event itself — it does not meet CRITICAL alone but warrants monitoring. Note content leads, health summary explains the elevated concern. Severity = IMPORTANT → routes to key_observations.

→ Follow-up actions are derived from the alerts and observations but written separately — nothing in the alerts or observations mentions monitoring or follow-up. That content lives exclusively in follow_up_actions.

→ Two CRITICAL-level concerns for the same patient in one shift = overall CRITICAL assessment.



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
  "critical_alerts": [],
  "key_observations": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000044 - John Davis - John ate a full breakfast and was chatty and engaged, talking about football and assisted to the garden — for a patient with mild dementia this level of social engagement and appetite is a positive sign — sustained engagement like this helps slow cognitive decline",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000323 - Sarah Wilson - Sarah completed all physiotherapy exercises with notable improvement in knee flexion and reported pain at only 2/10 — at 4 weeks post-op this level of progress is ahead of expectations — maintaining this momentum is important to avoid setbacks in her recovery program",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000030400 - Margaret Thompson - Margaret's blood sugar read 6.2 mmol/L before lunch, insulin was administered and she ate well and joined crafts — her diabetes is currently well controlled and her routine is working — consistency with insulin timing next shift is important to maintain this"
  ],
  "follow_up_actions": [
    "b1b2c3d4-e5f6-4a5b-8c9d-000000000323 - Sarah Wilson - Continue physiotherapy program as scheduled - ONGOING - Maintain positive recovery trajectory",
    "b1b2c3d4-e5f6-4a5b-8c9d-000000030400  - Margaret Thompson - Continue pre-meal insulin routine  - ONGOING - Current diabetes management is working well, consistency is key"
  ],
  "shift_assessment": {
    "level": "GOOD",
    "summary": "Routine shift with no incidents or concerns. All three patients showed positive engagement, stable appetites and no behavioral changes. Sarah's physio recovery is progressing ahead of schedule."
  }
}


Key Reasoning:
→ John's notes say "ate full breakfast, chatty about football, assisted to garden" — for a patient with mild dementia the health summary tells us that sustained social engagement and appetite are positive indicators, not just neutral ones. No deviation from expected behaviour. Severity = ROUTINE → routes to key_observations as a positive note. Not a candidate for critical_alerts.

→ Sarah's notes say "completed all physio, notable improvement in knee flexion, pain 2/10" — the health summary tells us she is 4 weeks post-op on a 3x weekly program. Progress at this rate is ahead of schedule which is worth flagging positively. No concern present. Severity = ROUTINE → routes to key_observations only.

→ Margaret's notes say "blood sugar 6.2 mmol/L, insulin administered, ate well" — the health summary confirms 6.2 is within her target range and current management is working. Routine and stable. Severity = ROUTINE → routes to key_observations. Follow-up is simply continuity of current care.

→ No incidents, no behavioral deviations, no medication refusals across any patient. critical_alerts is empty. Do not populate critical_alerts when no CRITICAL threshold has been met — an empty array is correct here.

→ All patients ROUTINE = overall GOOD assessment.


Now analyze for this shift:


VISIT LOGS:
${JSON.stringify(visitLogs, null, 2)}

INCIDENT REPORTS:
${JSON.stringify(reports, null, 2)}


Return ONLY the JSON object.


`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4o" for better quality
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
      temperature: 0.4,
      max_tokens: 1000,
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
