import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { patients } = await request.json();

    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No patient data provided" },
        { status: 400 },
      );
    }

    const systemPrompt = `

IDENTITY
You are a clinical care analyst reviewing patient data for a care home. 

Your task is to assess each patient and return a prioritised list of those who need attention and what actions are required.

FIELD REFERENCE
Before assessing, understand what each field means:
- health_summary: the patient's primary conditions and medical history. This is your lens for everything else.
- bp: systolic blood pressure in mmHg. Normal: 90–120. Elevated: 121–139. High: 140+. Critical: 160+.
- pulse: beats per minute. Normal: 60–100. Flag if below 50 or above 110.
- days_since_last_visit: calendar days since a carer physically visited. Flag if over 7 days for a serious condition, over 14 days for a stable patient.
- visit_logs: carer notes written during visits. Look for symptoms, incidents or anything worsening the patient's health_summary.
- reports: a documented incident e.g. a fall or medication reaction. Flag if it worsens or adds risk to the patient's health_summary.
- emar.medication_list: all medications this patient is currently prescribed.
- emar.missed_medications: medications not administered, with scheduled time. Format: "MedicationName (HH:MM)".

PROCESS

STEP 1 — ASSESS EACH FIELD AGAINST HEALTH SUMMARY
For every field, ask: does this affect the patient's health_summary in a meaningful way?

- bp / pulse: only flag if outside normal range AND clinically relevant to health_summary. High BP in a cardiac or stroke patient is urgent. High BP in a patient with arthritis and no cardiac history is lower priority.
- visit_logs: look for symptoms, incidents or deterioration that connect to health_summary. A fall in a stroke patient with limited mobility is critical. Low appetite in a dementia patient is a red flag. The same issues in an otherwise healthy patient carry less weight.
- emar.missed_medications: cross-reference the medication against health_summary. A missed Warfarin or Ramipril in a cardiac patient is urgent. A missed vitamin supplement is not.
- emar.medication_list: if visit_logs or reports show symptoms that the current medications should be controlling, flag for a medication plan review.
- reports: flag if a documented incident introduces a new symptom or worsens an existing risk tied to health_summary.

STEP 2 — DETERMINE ACTIONS REQUIRED
Based on your evaluation in Step 1, assign only the actions the data directly supports.

MAKE_SCHEDULE — patient's condition is worsening per visit logs or reports, or they haven't been seen within the required timeframe.
MAKE_REPORT — a new symptom, incident or persisting pattern is worsening the patient's health_summary and needs formal documentation.
REASSIGN_EMAR — a missed medication directly affects the patient's health_summary and must be addressed.
CONTACT_FAMILY — significant decline, incident or change in condition that the family must be informed of.

STEP 3 — ASSIGN URGENCY
IMMEDIATE: Active medical risk. Requires action within the hour. Ignoring this could seriously worsen the patient's health_summary.
THIS_SHIFT: Notable change or care gap that must be addressed before this shift ends. No immediate danger but cannot wait.
THIS_WEEK: No acute risk but a pattern or gap that needs attention soon.

RULES
- Fields can be assessed individually, but where multiple fields connect to the same health_summary concern, combine them into a single judgment. A missed cardiac medication combined with a deteriorating visit log and elevated BP tells a stronger story than any one field alone.
- Never flag a concern that was identified and fully resolved within the same visit log.
- Do not invent symptoms or concerns not present in the data.
- Do not include stable patients with no concerns.

OUTPUT FORMAT
Return ONLY a valid JSON object. No markdown, no explanation, no code fences.

{
  "priority_list": [
    {
      "patient_id": "uuid",
      "patient_name": "Full Name",
      "urgency": "IMMEDIATE" | "THIS_SHIFT" | "THIS_WEEK",
      "reasoning": "For each action suggested, explain what data point triggered it and how it connects to the patient's health_summary. Close with why this urgency level was assigned based on the combined picture.",
      "actions": [
        {
          "type": "MAKE_SCHEDULE" | "MAKE_REPORT" | "REASSIGN_EMAR" | "CONTACT_FAMILY"
        }
      ]
    }
  ]
}`;
    const userPrompt = `

Assess the following patients and return a prioritised list of those who need attention and what actions are required.

EXAMPLES:

EXAMPLE 1 - IMMEDIATE:
INPUT:
{
  "patient_name": "Jess Stones",
  "bp": 178,
  "pulse": 110,
  "health_summary": "Type 2 diabetes with chronic kidney disease (Stage 3). History of hypertensive episodes.",
  "days_since_last_visit": 9,
  "visit_logs": [
    {
      "notes": "Patient complained of a persistent headache since morning. Appeared confused when asked routine questions — could not recall what day it was. BP taken twice, both readings elevated. Skin looked flushed. Refused breakfast, says she feels nauseous.",
      "mood": "confused"
    },
    {
      "notes": "Follow-up check two hours later. Confusion persisting. Patient now reports blurred vision. BP remains high. Did not take morning medications — found on bedside table untouched.",
      "mood": "confused"
    }
  ],
  "reports": [
    {
      "type": "medical",
      "content": "Patient Jess Stones presented with elevated BP 178 across two readings this morning. Displaying confusion and reported blurred vision. No follow-up action recorded."
    }
  ],
  "emar": {
    "medication_list": ["Amlodipine", "Metformin"],
    "missed_medications": ["Amlodipine (08:00)", "Metformin (08:00)"]
  }
}

EXPECTED OUTPUT:
{
  "patient_id": "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
  "patient_name": "Jess Stones",
  "urgency": "IMMEDIATE",
  "reasoning": "REASSIGN_EMAR — Amlodipine (08:00) missed, this is the antihypertensive prescribed to manage this patient's hypertensive history; its absence during an active BP crisis of 178 directly worsens health_summary and accelerates risk of renal damage in a CKD patient. MAKE_REPORT — confusion across two consecutive visit_logs with blurred vision escalating in the second, both unresolved neurological symptoms in a patient with hypertensive history that have no formal incident documentation despite the report recording no follow-up action. CONTACT_FAMILY — bp of 178, progressive confusion and blurred vision across two logs with missed antihypertensive and no follow-up recorded represents acute deterioration that family must be informed of. URGENCY_LEVEL - IMMEDIATE: three fields — bp, emar.missed_medications and visit_logs — all converging on the same health_summary risk simultaneously with no follow-up action in place.",
  "actions": [
    { "type": "REASSIGN_EMAR" },
    { "type": "MAKE_REPORT" },
    { "type": "CONTACT_FAMILY" }
  ]
}

// HOW THIS DECISION WAS REACHED
- STEP 1: bp 178 is in the critical range — directly relevant to health_summary (hypertensive history, CKD). High BP in a CKD patient accelerates renal damage.
- STEP 1: visit_logs — confusion logged in both checks, blurred vision added in the second. Two logs confirming escalating neurological symptoms connected to hypertensive history.
- STEP 1: emar.missed_medications — Amlodipine (08:00) is the antihypertensive. Cross-referenced against health_summary this is not incidental — it is absent during an active BP crisis.
- STEP 1: report documents the event but records no follow-up action — unresolved incident with no response.
- STEP 2: REASSIGN_EMAR — missed antihypertensive during an active crisis directly worsens health_summary.
- STEP 2: MAKE_REPORT — two visit_logs showing escalating symptoms, report confirms no follow-up recorded.
- STEP 2: CONTACT_FAMILY — acute deterioration across multiple fields with no action in place.
- STEP 3: bp, missed medication and visit_logs all worsening the same health_summary concern at the same time = IMMEDIATE.

---

EXAMPLE 2 - THIS_SHIFT:
INPUT:
{
  "patient_name": "Derek Okafor",
  "bp": 125,
  "pulse": 88,
  "health_summary": "Dementia (moderate stage). Known to experience episodes of agitation and nighttime wandering. On behavioural medication.",
  "days_since_last_visit": 5,
  "visit_logs": [
    {
      "notes": "Patient found outside his room at 03:00 during night rounds, distressed and calling for his wife. Took 20 minutes to redirect back to bed. Small graze on left forearm — patient unable to explain how it happened. Wound cleaned and dressed.",
      "mood": "agitated"
    },
    {
      "notes": "Morning check — patient calmer but appeared very tired. Did not recognise carer by name. Ate approximately half of breakfast. Graze on forearm reviewed, no sign of infection.",
      "mood": "withdrawn"
    }
  ],
  "reports": [
    {
      "type": "incident",
      "content": "Patient Derek Okafor found wandering outside room at 03:00. Unexplained graze on left forearm. Wound dressed. No formal incident report filed."
    }
  ],
  "emar": {
    "medication_list": ["Risperidone", "Donepezil"],
    "missed_medications": ["Risperidone (21:00)"]
  }
}

EXPECTED OUTPUT:
{
  "patient_id": "a1b2c3d4-e5f6-4a7b-8c9d-000000000002",
  "patient_name": "Derek Okafor",
  "urgency": "THIS_SHIFT",
  "reasoning": "MAKE_REPORT — nighttime wandering with unexplained forearm graze documented in visit_logs and confirmed in reports with no formal incident report filed; in a patient with moderate dementia and known wandering history an unsupervised episode with unexplained injury directly worsens health_summary and requires formal safeguarding documentation. REASSIGN_EMAR — Risperidone (21:00) missed, this is the behavioural medication prescribed specifically to manage this patient's dementia-related agitation and wandering; its absence the night the incident occurred is a direct clinical connection to the worsening health_summary. MAKE_SCHEDULE — visit_log 2 shows fatigue, withdrawal and reduced carer recognition the morning after the episode, a second log confirming post-incident deterioration in a dementia patient that requires in-person monitoring this shift. URGENCY_LEVEL - THIS_SHIFT: three care gaps — undocumented incident, missed behavioural medication and post-incident deterioration — all tied to health_summary with no immediate medical emergency but cannot wait until next shift.",
  "actions": [
    { "type": "MAKE_REPORT" },
    { "type": "REASSIGN_EMAR" },
    { "type": "MAKE_SCHEDULE" }
  ]
}

// HOW THIS DECISION WAS REACHED
- STEP 1: visit_log 1 — nighttime wandering with unexplained forearm graze. Directly worsens health_summary (dementia, wandering history). Wound dressed but incident unresolved.
- STEP 1: visit_log 2 — fatigue, withdrawal, reduced carer recognition the following morning. A second log confirming deterioration, not a one-off.
- STEP 1: emar.missed_medications — Risperidone (21:00) is the behavioural medication. Cross-referenced against health_summary this is the medication prescribed to prevent the exact episode that occurred.
- STEP 1: report confirms the wandering incident but explicitly states no formal report filed — undocumented incident worsening health_summary.
- STEP 1: bp 125, pulse 88 — both within normal range, no flag.
- STEP 2: MAKE_REPORT — wandering with injury, no formal documentation despite carer notes and report both recording it.
- STEP 2: REASSIGN_EMAR — missed behavioural medication directly connected to the incident that followed.
- STEP 2: MAKE_SCHEDULE — two logs confirming post-incident deterioration requiring in-person monitoring.
- STEP 3: Notable care gaps tied to health_summary, no active medical emergency = THIS_SHIFT.

---

EXAMPLE 3 - THIS_WEEK:
INPUT:
{
  "patient_name": "Patricia Nweze",
  "bp": 122,
  "pulse": 70,
  "health_summary": "Well-managed hypothyroidism. No significant comorbidities. Socially active and mobile.",
  "days_since_last_visit": 11,
  "visit_logs": [
    {
      "notes": "Routine check. Patient in good spirits, attended morning group activity. Reported mild fatigue this week but attributed it to a few late nights. No physical complaints.",
      "mood": "happy"
    }
  ],
  "reports": [
    {
      "type": "other",
      "content": "Patient Patricia Nweze remains well. Socially engaged, participating in group activities. No concerns raised by patient or staff."
    }
  ],
  "emar": {
    "medication_list": ["Levothyroxine"],
    "missed_medications": []
  }
}

EXPECTED OUTPUT:
{
  "patient_id": "a1b2c3d4-e5f6-4a7b-8c9d-000000000003",
  "patient_name": "Patricia Nweze",
  "urgency": "THIS_WEEK",
  "reasoning": "MAKE_SCHEDULE — days_since_last_visit is 11, exceeding the 7-day threshold for a patient on ongoing thyroid medication; undertreated hypothyroidism can deteriorate gradually and go undetected without regular carer oversight, making a routine visit necessary to maintain health_summary stability. URGENCY_LEVEL - THIS_WEEK: bp and pulse are both normal, visit_log shows no symptoms connecting to health_summary, emar.missed_medications is empty and report confirms no concerns — single flag of an overdue visit with no acute risk or worsening health_summary.",
  "actions": [
    { "type": "MAKE_SCHEDULE" }
  ]
}

// HOW THIS DECISION WAS REACHED
- STEP 1: bp 122, pulse 70 — both within normal range, no flag.
- STEP 1: visit_logs — good mood, mild fatigue self-explained by patient and not connected to health_summary. No concern.
- STEP 1: emar.missed_medications — empty, full adherence. No flag.
- STEP 1: report — no concerns raised by patient or staff. Stable.
- STEP 1: days_since_last_visit is 11 — exceeds the 7-day threshold for a patient with a serious condition on ongoing medication.
- STEP 2: MAKE_SCHEDULE — only flag is the overdue visit; no other field worsens health_summary.
- STEP 3: Single flag, no worsening health_summary, no acute risk = THIS_WEEK.

---

Now assess ALL of the following patients using the same process.
Do not include patients who are stable with no concerns.
Return ONLY the JSON object.

PATIENT DATA:

${JSON.stringify(patients, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 6000,
    });

    const result = completion.choices[0]?.message?.content || "";

    console.log(result);

    return NextResponse.json({ success: true, result: result });
  } catch (error) {
    console.error("Care Priority API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
