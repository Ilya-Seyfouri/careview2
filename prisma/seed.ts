import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── TIME HELPERS ─────────────────────────────────────────────────────────────

  const now = new Date();

  const daysAgo = (n: number, h = 0, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const today = (h: number, m = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const daysAhead = (n: number, h = 9, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // ─── PROFILES ────────────────────────────────────────────────────────────────

  const manager = await prisma.profile.upsert({
    where: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: {},
    create: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "manager",
      full_name: "Sarah Mitchell",
      email: "sarah.mitchell@careview.com",
      phone: "07700 900001",
    },
  });

  const carer1 = await prisma.profile.upsert({
    where: { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
    update: {},
    create: {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      role: "carer",
      full_name: "Jordan Reed",
      email: "jordan.reed@careview.com",
      phone: "07700 900002",
    },
  });

  const carer2 = await prisma.profile.upsert({
    where: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" },
    update: {},
    create: {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      role: "carer",
      full_name: "Priya Sharma",
      email: "priya.sharma@careview.com",
      phone: "07700 900003",
    },
  });

  const family1 = await prisma.profile.upsert({
    where: { id: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
    update: {},
    create: {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      role: "family",
      full_name: "James Thompson",
      email: "james.thompson@gmail.com",
      phone: "07700 900004",
    },
  });

  const family2 = await prisma.profile.upsert({
    where: { id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" },
    update: {},
    create: {
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      role: "family",
      full_name: "Linda Okafor",
      email: "linda.okafor@gmail.com",
      phone: "07700 900005",
    },
  });

  console.log("✅ Profiles created");

  // ─── PATIENTS ────────────────────────────────────────────────────────────────
  // Designed to trigger distinct AI responses:
  // Margaret  → IMMEDIATE  (BP 178, missed antihypertensive, confusion + blurred vision in logs)
  // Derek     → THIS_SHIFT (wandering + unexplained graze, missed Risperidone, no formal report)
  // Patricia  → THIS_WEEK  (last visit 11 days ago, otherwise stable)
  // Betty     → IMMEDIATE  (fall today, high fall risk history, withdrawal earlier in shift)
  // Arthur    → no flag    (stable Parkinson's, all meds given, routine visit today)

  const patient1 = await prisma.patient.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      full_name: "Margaret Thompson",
      dob: new Date("1942-03-15"),
      room: "12A",
      wing: "North",
      status: "attention",
      language: "English",
      blood: "A+",
      health_summary:
        "Type 2 diabetes with chronic kidney disease (Stage 3). History of hypertensive episodes. On Amlodipine and Metformin.",
      pulse: 110,
      bp: 178,
      key_health_indicator:
        "Blood pressure critical — hypertensive history with CKD",
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: {},
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      full_name: "Derek Okafor",
      dob: new Date("1938-07-22"),
      room: "08B",
      wing: "South",
      status: "attention",
      language: "English",
      blood: "O+",
      health_summary:
        "Dementia (moderate stage). Known to experience episodes of agitation and nighttime wandering. On Risperidone and Donepezil for behavioural management.",
      pulse: 88,
      bp: 125,
      key_health_indicator: "Wandering risk — missed behavioural medication",
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { id: "33333333-3333-3333-3333-333333333333" },
    update: {},
    create: {
      id: "33333333-3333-3333-3333-333333333333",
      full_name: "Patricia Nweze",
      dob: new Date("1950-11-08"),
      room: "04C",
      wing: "East",
      status: "stable",
      language: "English",
      blood: "B+",
      health_summary:
        "Well-managed hypothyroidism. No significant comorbidities. Socially active and mobile. On Levothyroxine.",
      pulse: 70,
      bp: 122,
      key_health_indicator: "Stable — routine monitoring required",
    },
  });

  const patient4 = await prisma.patient.upsert({
    where: { id: "44444444-4444-4444-4444-444444444444" },
    update: {},
    create: {
      id: "44444444-4444-4444-4444-444444444444",
      full_name: "Betty Collins",
      dob: new Date("1945-05-30"),
      room: "15A",
      wing: "North",
      status: "critical",
      language: "English",
      blood: "AB-",
      health_summary:
        "Anxiety disorder, depression history, 3 previous hip fractures, high fall risk. On Sertraline and calcium supplements.",
      pulse: 95,
      bp: 145,
      key_health_indicator: "High fall risk — recent injury",
    },
  });

  const patient5 = await prisma.patient.upsert({
    where: { id: "55555555-5555-5555-5555-555555555555" },
    update: {},
    create: {
      id: "55555555-5555-5555-5555-555555555555",
      full_name: "Arthur Singh",
      dob: new Date("1936-09-14"),
      room: "07B",
      wing: "South",
      status: "stable",
      language: "Punjabi",
      blood: "O-",
      health_summary:
        "Parkinson's disease (early stage). Mild tremors affecting mobility. On Levodopa. No cognitive impairment.",
      pulse: 72,
      bp: 118,
      key_health_indicator: "Mobility monitoring — Parkinson's tremors",
    },
  });

  console.log("✅ Patients created");

  // ─── PATIENT CARERS ──────────────────────────────────────────────────────────

  await prisma.patientCarer.createMany({
    skipDuplicates: true,
    data: [
      { patient_id: patient1.id, carer_id: carer1.id },
      { patient_id: patient2.id, carer_id: carer1.id },
      { patient_id: patient3.id, carer_id: carer2.id },
      { patient_id: patient4.id, carer_id: carer1.id },
      { patient_id: patient5.id, carer_id: carer2.id },
    ],
  });

  // ─── PATIENT FAMILY ───────────────────────────────────────────────────────────

  await prisma.patientFamily.createMany({
    skipDuplicates: true,
    data: [
      { patient_id: patient1.id, family_id: family1.id, relationship: "Son" },
      {
        patient_id: patient2.id,
        family_id: family2.id,
        relationship: "Daughter",
      },
    ],
  });

  console.log("✅ Patient assignments created");

  // ─── EMAR ────────────────────────────────────────────────────────────────────

  await prisma.emar.createMany({
    skipDuplicates: true,
    data: [
      // Margaret — missed both critical morning meds
      {
        patient_id: patient1.id,
        medication_name: "Amlodipine",
        medication_mg: 5,
        time_to_take: "08:00",
        status: "missed",
      },
      {
        patient_id: patient1.id,
        medication_name: "Metformin",
        medication_mg: 500,
        time_to_take: "08:00",
        status: "missed",
      },
      {
        patient_id: patient1.id,
        medication_name: "Metformin",
        medication_mg: 500,
        time_to_take: "18:00",
        status: "due",
      },

      // Derek — missed behavioural med the night of the wandering incident
      {
        patient_id: patient2.id,
        medication_name: "Risperidone",
        medication_mg: 1,
        time_to_take: "21:00",
        status: "missed",
      },
      {
        patient_id: patient2.id,
        medication_name: "Donepezil",
        medication_mg: 10,
        time_to_take: "08:00",
        status: "given",
      },

      // Patricia — fully compliant
      {
        patient_id: patient3.id,
        medication_name: "Levothyroxine",
        medication_mg: 50,
        time_to_take: "07:00",
        status: "given",
      },

      // Betty — morning given, afternoon due
      {
        patient_id: patient4.id,
        medication_name: "Sertraline",
        medication_mg: 50,
        time_to_take: "08:00",
        status: "given",
      },
      {
        patient_id: patient4.id,
        medication_name: "Calcium Carbonate",
        medication_mg: 500,
        time_to_take: "12:00",
        status: "due",
      },

      // Arthur — all on time
      {
        patient_id: patient5.id,
        medication_name: "Levodopa",
        medication_mg: 100,
        time_to_take: "08:00",
        status: "given",
      },
      {
        patient_id: patient5.id,
        medication_name: "Levodopa",
        medication_mg: 100,
        time_to_take: "14:00",
        status: "due",
      },
    ],
  });

  console.log("✅ EMAR created");

  // ─── SCHEDULES ────────────────────────────────────────────────────────────────

  const schedule1 = await prisma.schedule.create({
    data: {
      patient_id: patient1.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: today(9),
      end_at: today(10),
      status: "completed",
      title: "Morning Care Visit",
      required_tasks: JSON.stringify([
        "Blood pressure check",
        "Medication administration",
        "Personal care",
      ]),
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      patient_id: patient2.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: today(10),
      end_at: today(11),
      status: "completed",
      title: "Morning Care Visit",
      required_tasks: JSON.stringify([
        "Medication check",
        "Mood assessment",
        "Mobility assistance",
      ]),
    },
  });

  const schedule3 = await prisma.schedule.create({
    data: {
      patient_id: patient4.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: today(12),
      end_at: today(13),
      status: "completed",
      title: "Afternoon Check",
      required_tasks: JSON.stringify([
        "Fall risk assessment",
        "Wound check",
        "Vital signs",
      ]),
    },
  });

  await prisma.schedule.create({
    data: {
      patient_id: patient3.id,
      carer_id: carer2.id,
      created_by: manager.id,
      start_at: daysAhead(1, 9),
      end_at: daysAhead(1, 10),
      status: "scheduled",
      title: "Routine Morning Visit",
      required_tasks: JSON.stringify(["Medication check", "General wellbeing"]),
    },
  });

  await prisma.schedule.create({
    data: {
      patient_id: patient5.id,
      carer_id: carer2.id,
      created_by: manager.id,
      start_at: daysAhead(1, 11),
      end_at: daysAhead(1, 12),
      status: "scheduled",
      title: "Mobility Assessment",
      required_tasks: JSON.stringify([
        "Tremor assessment",
        "Levodopa check",
        "Mobility exercises",
      ]),
    },
  });

  await prisma.schedule.create({
    data: {
      patient_id: patient1.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: daysAhead(1, 8),
      end_at: daysAhead(1, 9),
      status: "scheduled",
      title: "Urgent BP Follow-up",
      required_tasks: JSON.stringify([
        "Blood pressure monitoring",
        "Medication compliance check",
      ]),
    },
  });

  await prisma.schedule.create({
    data: {
      patient_id: patient2.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: daysAhead(7, 9),
      end_at: daysAhead(7, 10),
      status: "scheduled",
      title: "Weekly Care Review",
      required_tasks: JSON.stringify([
        "Behavioural assessment",
        "Medication review",
        "Family update",
      ]),
    },
  });

  // Patricia's last completed visit — 11 days ago, triggers THIS_WEEK in AI
  const schedule8 = await prisma.schedule.create({
    data: {
      patient_id: patient3.id,
      carer_id: carer2.id,
      created_by: manager.id,
      start_at: daysAgo(11, 9),
      end_at: daysAgo(11, 10),
      status: "completed",
      title: "Routine Visit",
      required_tasks: JSON.stringify(["Medication check", "General wellbeing"]),
    },
  });

  console.log("✅ Schedules created");

  // ─── VISIT LOGS ───────────────────────────────────────────────────────────────
  // All logs use TODAY's timestamps so the shift summariser has data to work with.
  // Patricia's log is 11 days ago — her overdue visit is the AI trigger.

  await prisma.visitLog.createMany({
    data: [
      // Margaret — BP crisis building across two checks today
      {
        schedule_id: schedule1.id,
        patient_id: patient1.id,
        carer_id: carer1.id,
        notes:
          "Patient complained of a persistent headache since morning. Appeared confused when asked routine questions — could not recall what day it was. BP taken twice, both readings elevated. Skin looked flushed. Refused breakfast, says she feels nauseous.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(9, 30),
      },
      {
        patient_id: patient1.id,
        carer_id: carer1.id,
        notes:
          "Follow-up check two hours later. Confusion persisting. Patient now reports blurred vision. BP remains high. Did not take morning medications — found on bedside table untouched.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(11, 30),
      },

      // Derek — wandering overnight, morning check today
      {
        schedule_id: schedule2.id,
        patient_id: patient2.id,
        carer_id: carer1.id,
        notes:
          "Patient found outside his room at 03:00 during night rounds, distressed and calling for his wife. Took 20 minutes to redirect back to bed. Small graze on left forearm — patient unable to explain how it happened. Wound cleaned and dressed.",
        appetite: "normal",
        mood: "anxious",
        created_at: today(3, 30),
      },
      {
        patient_id: patient2.id,
        carer_id: carer1.id,
        notes:
          "Morning check — patient calmer but appeared very tired. Did not recognise carer by name. Ate approximately half of breakfast. Graze on forearm reviewed, no sign of infection.",
        appetite: "poor",
        mood: "calm",
        created_at: today(10, 0),
      },

      // Patricia — last visit 11 days ago, fully stable
      {
        schedule_id: schedule8.id,
        patient_id: patient3.id,
        carer_id: carer2.id,
        notes:
          "Routine check. Patient in good spirits, attended morning group activity. Reported mild fatigue this week but attributed it to a few late nights. No physical complaints.",
        appetite: "great",
        mood: "happy",
        created_at: daysAgo(11, 9, 30),
      },

      // Betty — withdrawn at lunch, fall in bathroom today
      {
        schedule_id: schedule3.id,
        patient_id: patient4.id,
        carer_id: carer1.id,
        notes:
          "Refused lunch, seemed withdrawn, avoided eye contact. Appeared more anxious than usual. Did not want to engage in conversation.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(12, 0),
      },
      {
        patient_id: patient4.id,
        carer_id: carer1.id,
        notes:
          "Found on bathroom floor at 3pm. Reported dizziness. Small bruise on left arm. Vitals stable. Wound cleaned and dressed. Patient alert and oriented post-fall.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(15, 0),
      },

      // Arthur — routine today, no concerns
      {
        patient_id: patient5.id,
        carer_id: carer2.id,
        notes:
          "Routine morning visit. Tremors slightly more noticeable today but within expected range. Patient in good spirits, completed morning exercises. Levodopa administered on time.",
        appetite: "normal",
        mood: "calm",
        created_at: today(9, 0),
      },
    ],
  });

  console.log("✅ Visit logs created");

  // ─── REPORTS ─────────────────────────────────────────────────────────────────

  await prisma.report.createMany({
    data: [
      // Today's reports — feed both the shift summariser and AI recommender
      {
        patient_id: patient1.id,
        created_by: manager.id,
        title: "Hypertensive Episode — Elevated BP and Confusion",
        type: "medication",
        content:
          "Patient Margaret Thompson presented with elevated BP 178 across two readings this morning. Displaying confusion and reported blurred vision. Morning medications found untouched on bedside table. No follow-up action recorded. Requires urgent review.",
        created_at: today(12, 0),
      },
      {
        patient_id: patient2.id,
        created_by: manager.id,
        title: "Nighttime Wandering Incident",
        type: "other",
        content:
          "Patient Derek Okafor found wandering outside room at 03:00. Unexplained graze on left forearm. Wound dressed. No formal incident report filed. Risperidone missed at 21:00 the previous evening.",
        created_at: today(8, 0),
      },
      {
        patient_id: patient4.id,
        created_by: manager.id,
        title: "Fall in Bathroom",
        type: "falls",
        content:
          "Patient Betty Collins found on bathroom floor at 3pm reporting dizziness. Minor bruising on left arm. No head injury. Alert and oriented. Patient had been withdrawn and refused lunch earlier in the shift.",
        created_at: today(15, 30),
      },

      // Older reports — give the AI recommender historical context
      {
        patient_id: patient1.id,
        created_by: manager.id,
        title: "Monthly Health Review",
        type: "nutrition",
        content:
          "Monthly review for Margaret Thompson. Blood sugar levels fluctuating more than previous month. Dietary intake reviewed with kitchen staff. BP trending upward over past 3 weeks. GP notified.",
        created_at: daysAgo(14),
      },
      {
        patient_id: patient4.id,
        created_by: manager.id,
        title: "Previous Near-Fall — Corridor",
        type: "falls",
        content:
          "Patient Betty Collins had a near-fall in the corridor two weeks ago. No injury sustained. Fall risk assessment updated. Grab rails checked. Family informed.",
        created_at: daysAgo(14),
      },
      {
        patient_id: patient5.id,
        created_by: manager.id,
        title: "Parkinson's Quarterly Review",
        type: "other",
        content:
          "Arthur Singh's quarterly Parkinson's review completed. Tremors stable, no significant progression. Levodopa dosage unchanged. No new concerns identified.",
        created_at: daysAgo(30),
      },
    ],
  });

  console.log("✅ Reports created");

  // ─── SHIFT HANDOVERS ──────────────────────────────────────────────────────────

  await prisma.shiftHandover.createMany({
    data: [
      {
        shift_type: "AM_PM",
        patient_id: patient1.id,
        created_by: carer1.id,
        notes:
          "Handover from AM shift. Margaret had elevated BP again this morning. Medications administered late. Next shift to monitor closely and check evening Metformin.",
        patient_notes:
          "Confused at times. BP 165 at last check. Ate very little at lunch.",
        created_at: daysAgo(1, 14),
      },
      {
        shift_type: "AM_PM",
        patient_id: patient2.id,
        created_by: carer1.id,
        notes:
          "Derek had a difficult morning. Was agitated for approximately an hour after breakfast. Settled after one-to-one time. Risperidone given this morning.",
        patient_notes:
          "Mood: agitated then calm. Ate well at lunch. No wandering incidents today.",
        created_at: daysAgo(1, 14),
      },
      {
        shift_type: "PM_AM",
        patient_id: patient4.id,
        created_by: carer2.id,
        notes:
          "Betty was anxious throughout PM shift. Refused evening meal. Settled at 9pm. No incidents but fall risk remains high.",
        patient_notes: "Poor appetite all day. Slept well from 9pm.",
        created_at: daysAgo(1, 22),
      },
    ],
  });

  console.log("✅ Shift handovers created");

  // ─── MESSAGES ────────────────────────────────────────────────────────────────

  await prisma.message.createMany({
    data: [
      {
        content:
          "Hi Jordan, just wanted to check in on Mum. How was she today?",
        sender_id: family1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(3, 10),
      },
      {
        content:
          "Hi James, she was in reasonable spirits this morning. We did her exercises and she ate most of her lunch. I'll keep an eye on her BP — it's been a little higher than usual.",
        sender_id: carer1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(3, 10, 30),
      },
      {
        content:
          "Thanks for letting me know. Should I be worried about the BP? Is there anything I should tell the GP when I speak to them?",
        sender_id: family1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(2, 9),
      },
      {
        content:
          "We've already flagged it with the care manager. Best to mention the readings have been around 160–178 over the past week. We're monitoring it closely and she's on Amlodipine for this.",
        sender_id: carer1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(2, 9, 30),
      },
      {
        content:
          "I visited this afternoon and she seemed confused. Is that related to the blood pressure?",
        sender_id: family1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(1, 15),
      },
      {
        content:
          "Yes it can be. We've raised this as urgent with the manager today. She'll be reviewed first thing tomorrow morning. I'll update you as soon as I know more.",
        sender_id: carer1.id,
        carer_id: carer1.id,
        family_id: family1.id,
        created_at: daysAgo(1, 15, 30),
      },
    ],
  });

  console.log("✅ Messages created");

  // ─── CARE ANALYSIS SESSION ────────────────────────────────────────────────────
  // One previous AI run so the session history tab isn't empty on first load

  await prisma.careAnalysisSession.create({
    data: {
      created_by: manager.id,
      created_at: daysAgo(1, 9),
      priority_list: [
        {
          patient_id: patient1.id,
          patient_name: "Margaret Thompson",
          urgency: "IMMEDIATE",
          reasoning:
            "BP 165 recorded yesterday with patient reporting headache. Morning Amlodipine administered late. Confusion noted by carer during afternoon check. Multiple fields worsening the same health_summary concern simultaneously.",
          actions: [{ type: "REASSIGN_EMAR" }, { type: "CONTACT_FAMILY" }],
        },
        {
          patient_id: patient4.id,
          patient_name: "Betty Collins",
          urgency: "THIS_SHIFT",
          reasoning:
            "Patient was anxious and refused evening meal. Given history of 3 hip fractures and high fall risk, behavioural changes require in-person monitoring this shift.",
          actions: [{ type: "MAKE_SCHEDULE" }],
        },
      ],
    },
  });

  console.log("✅ Care analysis session created");

  // ─── COMPLETED CARE ACTIONS ───────────────────────────────────────────────────

  await prisma.completedCareAction.createMany({
    data: [
      {
        patient_id: patient1.id,
        action_type: "CONTACT_FAMILY",
        completed_by: manager.id,
        completed_at: daysAgo(1, 10),
        notes:
          "Called James Thompson to inform him of elevated BP readings. He will speak to their GP.",
      },
      {
        patient_id: patient1.id,
        action_type: "REASSIGN_EMAR",
        completed_by: carer1.id,
        completed_at: daysAgo(1, 8, 30),
        notes:
          "Amlodipine re-administered after patient initially refused. Taken at 08:30.",
      },
      {
        patient_id: patient4.id,
        action_type: "MAKE_SCHEDULE",
        completed_by: manager.id,
        completed_at: daysAgo(1, 11),
        notes:
          "Scheduled extra check-in for Betty this afternoon given anxious mood.",
      },
    ],
  });

  console.log("✅ Completed care actions created");

  // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        action_type: "patient_created",
        actor_id: manager.id,
        related_to: patient1.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "patient_created",
        actor_id: manager.id,
        related_to: patient2.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "patient_created",
        actor_id: manager.id,
        related_to: patient3.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "patient_created",
        actor_id: manager.id,
        related_to: patient4.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "patient_created",
        actor_id: manager.id,
        related_to: patient5.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "carer_assigned_to_patient",
        actor_id: manager.id,
        related_to: patient1.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "carer_assigned_to_patient",
        actor_id: manager.id,
        related_to: patient2.id,
        created_at: daysAgo(30),
      },
      {
        action_type: "family_linked_to_patient",
        actor_id: manager.id,
        related_to: patient1.id,
        created_at: daysAgo(28),
      },
      {
        action_type: "family_linked_to_patient",
        actor_id: manager.id,
        related_to: patient2.id,
        created_at: daysAgo(28),
      },
      {
        action_type: "report_created",
        actor_id: manager.id,
        related_to: patient1.id,
        created_at: daysAgo(14),
      },
      {
        action_type: "report_created",
        actor_id: manager.id,
        related_to: patient4.id,
        created_at: daysAgo(14),
      },
      {
        action_type: "emar_administered",
        actor_id: carer1.id,
        related_to: patient1.id,
        created_at: daysAgo(1, 8, 30),
      },
      {
        action_type: "schedule_completed",
        actor_id: carer1.id,
        related_to: patient1.id,
        created_at: today(10),
      },
      {
        action_type: "schedule_completed",
        actor_id: carer1.id,
        related_to: patient2.id,
        created_at: today(11),
      },
      {
        action_type: "report_created",
        actor_id: manager.id,
        related_to: patient1.id,
        created_at: today(12),
      },
      {
        action_type: "report_created",
        actor_id: manager.id,
        related_to: patient4.id,
        created_at: today(15, 30),
      },
    ],
  });

  console.log("✅ Audit logs created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Accounts:");
  console.log(
    "   Manager  → Sarah Mitchell   (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)",
  );
  console.log(
    "   Carer 1  → Jordan Reed      (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)",
  );
  console.log(
    "   Carer 2  → Priya Sharma     (cccccccc-cccc-cccc-cccc-cccccccccccc)",
  );
  console.log(
    "   Family 1 → James Thompson   (dddddddd-dddd-dddd-dddd-dddddddddddd)",
  );
  console.log(
    "   Family 2 → Linda Okafor     (eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee)",
  );
  console.log("\n🤖 AI Features:");
  console.log(
    "   Action Recommender → Margaret (IMMEDIATE), Derek (THIS_SHIFT), Patricia (THIS_WEEK), Betty (IMMEDIATE)",
  );
  console.log(
    "   Shift Summariser   → Margaret BP crisis, Derek wandering, Betty fall, Arthur routine",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
