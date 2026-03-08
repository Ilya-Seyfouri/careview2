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
    update: { status: "active" },
    create: {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      role: "carer",
      full_name: "Jordan Reed",
      email: "jordan.reed@careview.com",
      phone: "07700 900002",
      status: "active",
    },
  });

  const carer2 = await prisma.profile.upsert({
    where: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" },
    update: { status: "active" },
    create: {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      role: "carer",
      full_name: "Priya Sharma",
      email: "priya.sharma@careview.com",
      phone: "07700 900003",
      status: "active",
    },
  });

  const carer3 = await prisma.profile.upsert({
    where: { id: "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: { status: "active" },
    create: {
      id: "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "carer",
      full_name: "Marcus Webb",
      email: "marcus.webb@careview.com",
      phone: "07700 900007",
      status: "active",
    },
  });

  const carer4 = await prisma.profile.upsert({
    where: { id: "22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: { status: "break" },
    create: {
      id: "22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "carer",
      full_name: "Diane Foster",
      email: "diane.foster@careview.com",
      phone: "07700 900008",
      status: "break",
    },
  });

  const carer5 = await prisma.profile.upsert({
    where: { id: "33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: { status: "scheduled" },
    create: {
      id: "33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "carer",
      full_name: "Tom Nguyen",
      email: "tom.nguyen@careview.com",
      phone: "07700 900009",
      status: "standby",
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
      full_name: "Catherine Collins",
      email: "catherine.collins@gmail.com",
      phone: "07700 900005",
    },
  });

  const family3 = await prisma.profile.upsert({
    where: { id: "ffffffff-ffff-ffff-ffff-ffffffffffff" },
    update: {},
    create: {
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      role: "family",
      full_name: "Linda Okafor",
      email: "linda.okafor@gmail.com",
      phone: "07700 900006",
    },
  });

  const family4 = await prisma.profile.upsert({
    where: { id: "44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: {},
    create: {
      id: "44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "family",
      full_name: "Robert Nweze",
      email: "robert.nweze@gmail.com",
      phone: "07700 900010",
    },
  });

  const family5 = await prisma.profile.upsert({
    where: { id: "55555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
    update: {},
    create: {
      id: "55555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      role: "family",
      full_name: "Anita Singh",
      email: "anita.singh@gmail.com",
      phone: "07700 900011",
    },
  });

  // ─── PATIENTS ────────────────────────────────────────────────────────────────
  //
  // AI Action Recommender target output:
  //
  // Margaret Thompson → IMMEDIATE
  //   REASSIGN_EMAR    Amlodipine (08:00) missed during active BP crisis of 178 with CKD
  //   MAKE_REPORT      Confusion + blurred vision across two visit logs, no follow-up on record
  //   CONTACT_FAMILY   Acute deterioration across bp + emar + visit_logs simultaneously
  //
  // Derek Okafor → THIS_SHIFT
  //   REASSIGN_EMAR    Risperidone (21:00) missed the night of a confirmed wandering incident
  //   MAKE_REPORT      Unexplained forearm graze with no formal incident report filed
  //   MAKE_SCHEDULE    Post-incident deterioration confirmed across two consecutive logs
  //
  // Patricia Nweze → THIS_WEEK
  //   MAKE_SCHEDULE    Last visit 11 days ago — exceeds 7-day threshold for a medicated patient
  //
  // Betty Collins → THIS_SHIFT
  //   MAKE_REPORT      Fall with injury today, second fall-related incident in 2 weeks
  //   CONTACT_FAMILY   Active fall with injury, high risk history, family must be informed
  //
  // Arthur Singh → no flag (stable control — all meds given, routine visit, no concerns)

  const patient1 = await prisma.patient.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { pulse: 110, bp: 178, status: "attention" },
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
    update: { pulse: 88, bp: 125, status: "attention" },
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
    update: { pulse: 70, bp: 122, status: "stable" },
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
    update: { pulse: 95, bp: 145, status: "attention" },
    create: {
      id: "44444444-4444-4444-4444-444444444444",
      full_name: "Betty Collins",
      dob: new Date("1945-05-30"),
      room: "15A",
      wing: "North",
      status: "attention",
      language: "English",
      blood: "AB-",
      health_summary:
        "Anxiety disorder, depression history, 3 previous hip fractures, high fall risk. On Sertraline and calcium supplements.",
      pulse: 95,
      bp: 145,
      key_health_indicator: "High fall risk — recent fall with injury",
    },
  });

  const patient5 = await prisma.patient.upsert({
    where: { id: "55555555-5555-5555-5555-555555555555" },
    update: { pulse: 72, bp: 118, status: "stable" },
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
      { patient_id: patient1.id, carer_id: carer2.id },
      { patient_id: patient2.id, carer_id: carer1.id },
      { patient_id: patient2.id, carer_id: carer3.id },
      { patient_id: patient3.id, carer_id: carer2.id },
      { patient_id: patient3.id, carer_id: carer4.id },
      { patient_id: patient4.id, carer_id: carer1.id },
      { patient_id: patient4.id, carer_id: carer5.id },
      { patient_id: patient5.id, carer_id: carer2.id },
      { patient_id: patient5.id, carer_id: carer3.id },
    ],
  });
  // ─── PATIENT FAMILY ───────────────────────────────────────────────────────────

  await prisma.patientFamily.createMany({
    skipDuplicates: true,
    data: [
      { patient_id: patient1.id, family_id: family1.id, relationship: "Son" },
      {
        patient_id: patient2.id,
        family_id: family3.id,
        relationship: "Daughter",
      },
      { patient_id: patient3.id, family_id: family4.id, relationship: "Son" },
      {
        patient_id: patient4.id,
        family_id: family2.id,
        relationship: "Daughter",
      },
      {
        patient_id: patient5.id,
        family_id: family5.id,
        relationship: "Daughter",
      },
    ],
  });

  console.log("✅ Patient assignments created");

  // ─── EMAR ────────────────────────────────────────────────────────────────────
  //
  // CRITICAL: status: "missed" is what patients-enriched must query.
  // These populate emar.missed_medications in the AI payload.
  // Without "missed" records the AI receives [] and cannot fire REASSIGN_EMAR.

  await prisma.emar.createMany({
    skipDuplicates: true,
    data: [
      // ── Margaret ─────────────────────────────────────────────────────────
      // Amlodipine missed during active BP crisis — primary REASSIGN_EMAR trigger
      {
        patient_id: patient1.id,
        medication_name: "Amlodipine",
        medication_mg: 5,
        time_to_take: "08:00",
        status: "missed",
      },
      // Metformin morning dose also missed — secondary signal for CKD patient
      {
        patient_id: patient1.id,
        medication_name: "Metformin",
        medication_mg: 500,
        time_to_take: "08:00",
        status: "missed",
      },
      // Evening Metformin still due — shows ongoing care gap
      {
        patient_id: patient1.id,
        medication_name: "Metformin",
        medication_mg: 500,
        time_to_take: "18:00",
        status: "due",
      },

      // ── Derek ─────────────────────────────────────────────────────────────
      // Risperidone missed the night of the wandering incident — direct causal link
      {
        patient_id: patient2.id,
        medication_name: "Risperidone",
        medication_mg: 1,
        time_to_take: "21:00",
        status: "missed",
      },
      // Donepezil was given — not every med missed, realistic partial compliance
      {
        patient_id: patient2.id,
        medication_name: "Donepezil",
        medication_mg: 10,
        time_to_take: "08:00",
        status: "given",
      },

      // ── Patricia ─────────────────────────────────────────────────────────
      // Fully compliant — MAKE_SCHEDULE triggers from overdue visit only, not EMAR
      {
        patient_id: patient3.id,
        medication_name: "Levothyroxine",
        medication_mg: 50,
        time_to_take: "07:00",
        status: "given",
      },

      // ── Betty ─────────────────────────────────────────────────────────────
      // Sertraline given — fall is the concern, not medication
      {
        patient_id: patient4.id,
        medication_name: "Sertraline",
        medication_mg: 50,
        time_to_take: "08:00",
        status: "given",
      },
      // Calcium Carbonate still due — minor secondary signal
      {
        patient_id: patient4.id,
        medication_name: "Calcium Carbonate",
        medication_mg: 500,
        time_to_take: "12:00",
        status: "due",
      },

      // ── Arthur ────────────────────────────────────────────────────────────
      // All meds given or on schedule — no flags at all
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
  //
  // Patricia's last completed schedule is 11 days ago.
  // The patients-enriched API uses the most recent completed schedule date
  // to compute days_since_last_visit — this is what fires her THIS_WEEK flag.

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

  const schedule4 = await prisma.schedule.create({
    data: {
      patient_id: patient5.id,
      carer_id: carer2.id,
      created_by: manager.id,
      start_at: today(9),
      end_at: today(10),
      status: "completed",
      title: "Routine Morning Visit",
      required_tasks: JSON.stringify([
        "Tremor assessment",
        "Levodopa check",
        "Mobility exercises",
      ]),
    },
  });

  // Patricia — last completed visit 11 days ago (sole trigger for THIS_WEEK)
  const schedule5 = await prisma.schedule.create({
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

  // Upcoming schedules — so the calendar page isn't empty
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
      patient_id: patient3.id,
      carer_id: carer2.id,
      created_by: manager.id,
      start_at: daysAhead(1, 9),
      end_at: daysAhead(1, 10),
      status: "scheduled",
      title: "Overdue Routine Visit",
      required_tasks: JSON.stringify(["Medication check", "General wellbeing"]),
    },
  });

  await prisma.schedule.create({
    data: {
      patient_id: patient2.id,
      carer_id: carer1.id,
      created_by: manager.id,
      start_at: daysAhead(1, 10),
      end_at: daysAhead(1, 11),
      status: "scheduled",
      title: "Post-Incident Follow-up",
      required_tasks: JSON.stringify([
        "Behavioural assessment",
        "Wound check",
        "Medication review",
      ]),
    },
  });

  console.log("✅ Schedules created");

  // ─── VISIT LOGS ───────────────────────────────────────────────────────────────
  //
  // Margaret: two logs today — confusion first, blurred vision escalating second
  // Derek: two logs today — wandering at 03:00, then post-incident deterioration
  // Patricia: one log 11 days ago, fully stable in every field
  // Betty: two logs today — withdrawn at lunch, then fall in bathroom
  // Arthur: one log today, routine and stable throughout

  await prisma.visitLog.createMany({
    data: [
      // ── Margaret — log 1: confusion, headache, refused breakfast ──────────
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
      // ── Margaret — log 2: blurred vision, meds untouched, no improvement ──
      {
        patient_id: patient1.id,
        carer_id: carer1.id,
        notes:
          "Follow-up check two hours later. Confusion persisting. Patient now reports blurred vision. BP remains high. Did not take morning medications — found on bedside table untouched. No improvement since earlier visit.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(11, 30),
      },

      
      {
        patient_id: patient2.id,
        carer_id: carer1.id,
        notes:
          "Morning check — patient calmer but appeared very tired. Did not recognise carer by name. Ate approximately half of breakfast. More disoriented than usual for this time of day.",
        appetite: "poor",
        mood: "calm",
        created_at: today(10, 0),
      },

      // ── Patricia — last visit 11 days ago, fully stable ───────────────────
      {
        schedule_id: schedule5.id,
        patient_id: patient3.id,
        carer_id: carer2.id,
        notes:
          "Routine check. Patient in good spirits, attended morning group activity. Reported mild fatigue this week but attributed it to a few late nights. No physical complaints. All medications taken as prescribed.",
        appetite: "great",
        mood: "happy",
        created_at: daysAgo(11, 9, 30),
      },

      // ── Betty — log 1: withdrawn, refused lunch, change in behaviour ───────
      {
        schedule_id: schedule3.id,
        patient_id: patient4.id,
        carer_id: carer1.id,
        notes:
          "Refused lunch, seemed withdrawn, avoided eye contact. Appeared more anxious than usual. Did not want to engage in conversation. This is a notable change from her usual baseline behaviour.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(12, 0),
      },
      // ── Betty — log 2: fall in bathroom, dizziness, bruising ──────────────
      {
        patient_id: patient4.id,
        carer_id: carer1.id,
        notes:
          "Found on bathroom floor at 3pm. Reported dizziness prior to fall. Small bruise on left arm. Vitals stable. Wound cleaned and dressed. Patient alert and oriented post-fall. Given her history of 3 hip fractures this requires urgent documentation and family notification.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(15, 0),
      },

      // ── Arthur — routine, stable, no concerns ─────────────────────────────
      {
        schedule_id: schedule4.id,
        patient_id: patient5.id,
        carer_id: carer2.id,
        notes:
          "Routine morning visit. Tremors slightly more noticeable today but within expected range for his condition. Patient in good spirits, completed morning exercises without assistance. Levodopa administered on time.",
        appetite: "normal",
        mood: "calm",
        created_at: today(9, 0),
      },
    ],
  });

  console.log("✅ Visit logs created");

  // ─── REPORTS ─────────────────────────────────────────────────────────────────
  //
  // Today's reports feed both the AI recommender and the shift summariser.
  // Historical reports establish patterns the AI uses for context.

  await prisma.report.createMany({
    data: [
      // ── Margaret — today: BP crisis, no follow-up on record ───────────────
      {
        patient_id: patient1.id,
        created_by: manager.id,
        title: "Hypertensive Episode — Elevated BP and Confusion",
        type: "medication",
        content:
          "Patient Margaret Thompson presented with elevated BP 178 across two readings this morning. Displaying confusion and reported blurred vision in follow-up check. Morning medications found untouched on bedside table. No follow-up action recorded. Requires urgent clinical review.",
        created_at: today(12, 0),
      },
      // ── Margaret — 14 days ago: BP trending upward ────────────────────────
      {
        patient_id: patient1.id,
        created_by: manager.id,
        title: "Monthly Health Review — BP Trending Upward",
        type: "nutrition",
        content:
          "Monthly review for Margaret Thompson. Blood sugar levels fluctuating more than previous month. Dietary intake reviewed with kitchen staff. BP trending upward over past 3 weeks, ranging 160–172. GP notified of trend.",
        created_at: daysAgo(14),
      },

      // ── Betty — today: fall with injury ───────────────────────────────────
      {
        patient_id: patient4.id,
        created_by: manager.id,
        title: "Fall in Bathroom — Bruising on Left Arm",
        type: "falls",
        content:
          "Patient Betty Collins found on bathroom floor at 3pm reporting dizziness prior to fall. Minor bruising on left arm. No head injury observed. Alert and oriented post-fall. Patient had been withdrawn and refused lunch earlier in the shift. Given her history of 3 previous hip fractures, this incident requires formal documentation and family notification.",
        created_at: today(15, 30),
      },
      // ── Betty — 14 days ago: near-fall, establishes pattern ───────────────
      {
        patient_id: patient4.id,
        created_by: manager.id,
        title: "Near-Fall in Corridor",
        type: "falls",
        content:
          "Patient Betty Collins had a near-fall in the corridor. No injury sustained. Fall risk assessment updated. Grab rails checked and confirmed secure. Family informed at time of incident.",
        created_at: daysAgo(14),
      },

      

      // ── Arthur — 30 days ago: stable quarterly review ─────────────────────
      {
        patient_id: patient5.id,
        created_by: manager.id,
        title: "Parkinson's Quarterly Review",
        type: "other",
        content:
          "Arthur Singh's quarterly Parkinson's review completed. Tremors stable with no significant progression since last review. Levodopa dosage unchanged. No new concerns identified. Next review scheduled in 3 months.",
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
          "Handover from AM shift. Margaret had elevated BP again this morning. Medications found untouched. Confusion noted during both checks today. Next shift to monitor closely and ensure evening Metformin is administered.",
        patient_notes:
          "Confused at times. BP 178 at last reading. Ate nothing today. Blurred vision reported at 11:30.",
        created_at: daysAgo(1, 14),
      },
      {
        shift_type: "AM_PM",
        patient_id: patient2.id,
        created_by: carer1.id,
        notes:
          "Derek had a difficult night. Found wandering at 03:00, graze on forearm dressed. Risperidone was not given last night. Morning check showed increased disorientation. Formal incident report not yet filed — needs to be done this shift.",
        patient_notes:
          "Wandering episode overnight. Graze on left forearm treated. More disoriented than usual this morning. Did not recognise carer.",
        created_at: daysAgo(1, 14),
      },
      {
        shift_type: "PM_AM",
        patient_id: patient4.id,
        created_by: carer2.id,
        notes:
          "Betty had a fall in the bathroom at 3pm. Bruising on left arm, no head injury. Alert post-fall. Was withdrawn and refused lunch earlier. Fall risk remains very high given hip fracture history. Family should be contacted.",
        patient_notes:
          "Fall in bathroom at 3pm. Bruise on left arm. Refused lunch. Anxious throughout shift.",
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
  // Yesterday's AI run — so session history isn't empty on first load.
  // Reasoning strings follow the exact format the UI parses for action modals.

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
            "REASSIGN_EMAR — Amlodipine (08:00) missed during an active BP episode of 165, directly worsening health_summary for a CKD patient with hypertensive history. MAKE_REPORT — confusion noted across both checks with no formal follow-up documentation in place. CONTACT_FAMILY — BP 165, confusion reported by carer, missed antihypertensive and no follow-up recorded. Family must be informed. URGENCY_LEVEL - IMMEDIATE: bp, missed medication and visit_logs all pointing to the same health_summary risk simultaneously.",
          actions: [
            { type: "REASSIGN_EMAR" },
            { type: "MAKE_REPORT" },
            { type: "CONTACT_FAMILY" },
          ],
        },
        {
          patient_id: patient2.id,
          patient_name: "Derek Okafor",
          urgency: "THIS_SHIFT",
          reasoning:
            "REASSIGN_EMAR — Risperidone (21:00) missed the night of the wandering incident. MAKE_REPORT — unexplained forearm graze with no formal incident report filed. MAKE_SCHEDULE — post-incident deterioration confirmed at morning check. URGENCY_LEVEL - THIS_SHIFT: three care gaps tied to health_summary, no immediate medical emergency but cannot wait until next shift.",
          actions: [
            { type: "REASSIGN_EMAR" },
            { type: "MAKE_REPORT" },
            { type: "MAKE_SCHEDULE" },
          ],
        },
        {
          patient_id: patient4.id,
          patient_name: "Betty Collins",
          urgency: "THIS_SHIFT",
          reasoning:
            "MAKE_REPORT — fall with bruising today, second fall-related incident in 2 weeks, requires formal documentation given hip fracture history. CONTACT_FAMILY — active fall with injury in a high fall risk patient, family must be informed. URGENCY_LEVEL - THIS_SHIFT: notable incident with clear documentation and family notification gap.",
          actions: [{ type: "MAKE_REPORT" }, { type: "CONTACT_FAMILY" }],
        },
        {
          patient_id: patient3.id,
          patient_name: "Patricia Nweze",
          urgency: "THIS_WEEK",
          reasoning:
            "MAKE_SCHEDULE — days_since_last_visit is 10, approaching the 7-day threshold for a patient on ongoing thyroid medication. No other concerns at this time. URGENCY_LEVEL - THIS_WEEK: single flag, stable patient, no acute risk.",
          actions: [{ type: "MAKE_SCHEDULE" }],
        },
      ],
    },
  });

  console.log("✅ Care analysis session created");

  // ─── COMPLETED CARE ACTIONS ───────────────────────────────────────────────────
  // Yesterday's completed actions — demonstrates the full workflow loop.

  await prisma.completedCareAction.createMany({
    data: [
      {
        patient_id: patient1.id,
        action_type: "CONTACT_FAMILY",
        completed_by: manager.id,
        completed_at: daysAgo(1, 10),
        notes:
          "Called James Thompson to inform him of elevated BP readings and confusion. He will speak to their GP today.",
      },
      {
        patient_id: patient1.id,
        action_type: "REASSIGN_EMAR",
        completed_by: carer1.id,
        completed_at: daysAgo(1, 8, 30),
        notes:
          "Amlodipine re-administered after patient initially refused. Taken at 08:30 with assistance.",
      },
      {
        patient_id: patient4.id,
        action_type: "MAKE_SCHEDULE",
        completed_by: manager.id,
        completed_at: daysAgo(1, 11),
        notes:
          "Scheduled extra check-in for Betty this afternoon given anxious mood and fall risk.",
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
        related_to: patient4.id,
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
        action_type: "schedule_completed",
        actor_id: carer1.id,
        related_to: patient4.id,
        created_at: today(13),
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
        related_to: patient2.id,
        created_at: today(8),
      },
      {
        action_type: "report_created",
        actor_id: manager.id,
        related_to: patient4.id,
        created_at: today(15, 30),
      },
    ],
  });

  // ─── SHIFT SUMMARISER TEST DATA ───────────────────────────────────────────────
  // These records have fixed UUIDs matching TEST_DATA in ShiftHandover.jsx.
  // They are linked to existing patients but isolated from the main AI recommender
  // by using fixed IDs that are never queried outside the test POST endpoint.
  // Each set is designed to produce a specific shift_assessment level.

  await prisma.visitLog.createMany({
    skipDuplicates: true,
    data: [
      // ── GOOD: Arthur + Patricia — routine, no concerns ──────────────────────
      {
        id: "00000000-0000-0000-0000-000000999100",
        patient_id: patient5.id, // Arthur Singh
        carer_id: carer2.id,
        notes:
          "Routine morning visit. Arthur in excellent spirits today. Completed all mobility exercises without assistance. Tremors minimal. Ate full breakfast and chatted about cricket. Levodopa administered on time.",
        appetite: "great",
        mood: "happy",
        created_at: today(8, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999101",
        patient_id: patient3.id, // Patricia Nweze
        carer_id: carer2.id,
        notes:
          "Patricia attended morning yoga session and appeared very engaged. Blood pressure normal. Levothyroxine taken without issue. Reported she slept well and is looking forward to the afternoon activity. No concerns whatsoever.",
        appetite: "great",
        mood: "happy",
        created_at: today(9, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999102",
        patient_id: patient5.id, // Arthur Singh
        carer_id: carer2.id,
        notes:
          "Afternoon check. Arthur resting comfortably after lunch. Ate full meal. Afternoon Levodopa administered on time. No tremor episodes. Asked about tomorrow's schedule — engaged and orientated.",
        appetite: "great",
        mood: "calm",
        created_at: today(14, 0),
      },

      // ── CONCERNING: Derek + Betty — mood changes, soft flags ────────────────
      {
        id: "00000000-0000-0000-0000-000000999106",
        patient_id: patient2.id, // Derek Okafor
        carer_id: carer1.id,
        notes:
          "Derek was unsettled during morning care. Refused to get dressed initially but eventually cooperated after 15 minutes. Ate only half his breakfast. Appeared to be looking for someone — kept asking for his wife. No wandering but mood notably lower than usual.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(8, 30),
      },
      {
        id: "00000000-0000-0000-0000-000000999107",
        patient_id: patient4.id, // Betty Collins
        carer_id: carer1.id,
        notes:
          "Betty seemed withdrawn at lunch. Ate about half her meal. Said she felt tired but denied any pain. Did not want to join the afternoon group activity, which is unusual for her. No falls or incidents. Vitals checked and stable.",
        appetite: "poor",
        mood: "withdrawn",
        created_at: today(12, 30),
      },
      {
        id: "00000000-0000-0000-0000-000000999108",
        patient_id: patient2.id, // Derek Okafor
        carer_id: carer1.id,
        notes:
          "Evening check. Derek calmer than this morning. Accepted medication without resistance. Ate a reasonable dinner. Still slightly disoriented about the day of the week but settled in his room by 8pm. No incidents overnight so far.",
        appetite: "normal",
        mood: "calm",
        created_at: today(19, 0),
      },

      // ── CRITICAL: Margaret + Betty — BP crisis + fall ────────────────────────
      {
        id: "00000000-0000-0000-0000-000000999112",
        patient_id: patient1.id, // Margaret Thompson
        carer_id: carer1.id,
        notes:
          "Margaret complained of severe headache and appeared visibly confused. Could not recall the date or the carer's name. BP reading of 182 — significantly elevated. Refused all food and medication. Skin flushed, says she feels dizzy. Sat with her for 30 minutes.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(9, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999113",
        patient_id: patient4.id, // Betty Collins
        carer_id: carer1.id,
        notes:
          "Betty found on the floor of her room at 2pm. She had attempted to reach her walking frame and lost balance. Bruising on right hip. Alert and oriented but in pain. Wound assessed. Given her history of 3 hip fractures this is being treated as high priority. GP contacted.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(14, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999114",
        patient_id: patient1.id, // Margaret Thompson
        carer_id: carer1.id,
        notes:
          "Follow-up on Margaret two hours later. Confusion has not improved. Now reporting blurred vision. BP remains high at 179. Morning medications still not taken — found on bedside table again. Manager notified. No improvement since morning check.",
        appetite: "poor",
        mood: "anxious",
        created_at: today(11, 0),
      },
    ],
  });

  await prisma.report.createMany({
    skipDuplicates: true,
    data: [
      // ── GOOD: routine reports, no concerns ──────────────────────────────────
      {
        id: "00000000-0000-0000-0000-000000999103",
        patient_id: patient5.id, // Arthur Singh
        created_by: manager.id,
        title: "Routine Shift Note — Arthur Singh",
        type: "other",
        content:
          "Arthur Singh had an excellent shift. All medications administered on time. Mobility exercises completed. No tremor episodes of concern. Patient engaged and cheerful throughout. No further action required.",
        created_at: today(15, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999104",
        patient_id: patient3.id, // Patricia Nweze
        created_by: manager.id,
        title: "Routine Shift Note — Patricia Nweze",
        type: "other",
        content:
          "Patricia Nweze participated in morning yoga and afternoon crafts. Levothyroxine taken as prescribed. BP and pulse within normal range. Patient in good spirits and socialising well with other residents. No concerns.",
        created_at: today(15, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999105",
        patient_id: patient5.id, // Arthur Singh
        created_by: manager.id,
        title: "Medication Administered — Levodopa",
        type: "medication",
        content:
          "Both Levodopa doses administered on time today at 08:00 and 14:00. Patient cooperative and showed no adverse reactions. Tremors within expected range for early-stage Parkinson's. No follow-up required.",
        created_at: today(15, 30),
      },

      // ── CONCERNING: mood changes, minor observations ─────────────────────────
      {
        id: "00000000-0000-0000-0000-000000999109",
        patient_id: patient2.id, // Derek Okafor
        created_by: manager.id,
        title: "Behavioural Change Noted — Derek Okafor",
        type: "other",
        content:
          "Derek Okafor showed increased agitation during morning care and was reluctant to cooperate with dressing. Mood improved by evening. No wandering incidents. Risperidone administered. Carer to monitor mood pattern over next 24 hours.",
        created_at: today(20, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999110",
        patient_id: patient4.id, // Betty Collins
        created_by: manager.id,
        title: "Low Mood and Reduced Appetite — Betty Collins",
        type: "nutrition",
        content:
          "Betty Collins presented with low mood and reduced appetite across both meals today. No falls or incidents. Vitals stable. Patient declined group activities. Change in behaviour noted — not consistent with her usual engagement. Monitoring advised.",
        created_at: today(20, 0),
      },
      {
        id: "00000000-0000-0000-0000-000000999111",
        patient_id: patient2.id, // Derek Okafor
        created_by: manager.id,
        title: "Medication Administered — Risperidone",
        type: "medication",
        content:
          "Risperidone administered at 21:00 without issue. Derek settled in his room by 8pm. Earlier agitation did not escalate to a wandering episode. No formal incident to report but behavioural shift worth monitoring into next shift.",
        created_at: today(21, 0),
      },

      // ── CRITICAL: BP crisis + fall ───────────────────────────────────────────
      {
        id: "00000000-0000-0000-0000-000000999115",
        patient_id: patient1.id, // Margaret Thompson
        created_by: manager.id,
        title: "Hypertensive Crisis — Margaret Thompson",
        type: "medication",
        content:
          "Margaret Thompson presenting with BP of 182 this morning, confusion and blurred vision reported. Morning medications refused and found untouched. Follow-up check at 11:00 showed no improvement. Manager notified. GP to be contacted if no improvement by next check.",
        created_at: today(11, 30),
      },
      {
        id: "00000000-0000-0000-0000-000000999116",
        patient_id: patient4.id, // Betty Collins
        created_by: manager.id,
        title: "Fall — Betty Collins",
        type: "falls",
        content:
          "Betty Collins found on floor of her room at 14:00 after losing balance reaching for walking frame. Bruising on right hip. No head injury. Alert and oriented post-fall. GP contacted given history of 3 previous hip fractures. Family to be notified. Fall risk assessment to be updated.",
        created_at: today(14, 30),
      },
      {
        id: "00000000-0000-0000-0000-000000999117",
        patient_id: patient1.id, // Margaret Thompson
        created_by: manager.id,
        title: "Urgent Review Required — Elevated BP Persisting",
        type: "medication",
        content:
          "Second BP reading for Margaret Thompson at 179 — no improvement from morning. Confusion and blurred vision persisting. Amlodipine not administered. This is an active hypertensive episode in a patient with CKD Stage 3. Immediate escalation required.",
        created_at: today(12, 0),
      },
    ],
  });

  console.log("✅ Shift summariser test data created");
  console.log("✅ Audit logs created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Accounts:");
  console.log(
    "   Manager  → Sarah Mitchell    (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)",
  );
  console.log(
    "   Carer 1  → Jordan Reed       (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)",
  );
  console.log(
    "   Carer 2  → Priya Sharma      (cccccccc-cccc-cccc-cccc-cccccccccccc)",
  );
  console.log(
    "   Family 1 → James Thompson    (dddddddd-dddd-dddd-dddd-dddddddddddd) → Margaret",
  );
  console.log(
    "   Family 2 → Catherine Collins (eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee) → Betty",
  );
  console.log(
    "   Family 3 → Linda Okafor      (ffffffff-ffff-ffff-ffff-ffffffffffff) → Derek",
  );
  console.log("\n🤖 AI Action Recommender — expected output:");
  console.log(
    "   Margaret Thompson → IMMEDIATE  — REASSIGN_EMAR + MAKE_REPORT + CONTACT_FAMILY",
  );
  console.log(
    "   Derek Okafor      → THIS_SHIFT — REASSIGN_EMAR + MAKE_REPORT + MAKE_SCHEDULE",
  );
  console.log(
    "   Betty Collins     → THIS_SHIFT — MAKE_REPORT + CONTACT_FAMILY",
  );
  console.log("   Patricia Nweze    → THIS_WEEK  — MAKE_SCHEDULE");
  console.log("   Arthur Singh      → no flag    (stable control patient)");
  console.log("\n✅ All 4 actions covered across patients:");
  console.log(
    "   REASSIGN_EMAR  → Margaret (Amlodipine missed, BP 178) + Derek (Risperidone missed)",
  );
  console.log(
    "   MAKE_REPORT    → Margaret (confusion + blurred vision) + Derek (graze, no report filed) + Betty (fall)",
  );
  console.log(
    "   MAKE_SCHEDULE  → Derek (post-incident deterioration) + Patricia (11 days overdue)",
  );
  console.log(
    "   CONTACT_FAMILY → Margaret (acute multi-field deterioration) + Betty (fall with injury)",
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
