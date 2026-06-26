/**
 * Trade-specific starter templates for new SSSPs.
 *
 * When a tradie creates their very first SSSP (or has no prior plan with
 * hazards filled in), we seed it with the standard hazards, controls, PPE,
 * substances, task steps, training and emergency content for their trade.
 *
 * They review and edit on their first job — from then on the sticky-field
 * mechanism carries their customised version forward to every future job.
 *
 * Each template covers the SsspData fields the detail page renders. Keys
 * here MUST match the SsspData type in artifacts/safeiq/src/pages/sssps/detail.tsx.
 */

type Hazard = {
  hazard: string;
  controls: string;
  initialRisk: string;
  controlLevel: string;
  residualRisk: string;
  toolbox: boolean;
};

type TaskStep = {
  step: string;
  hazards: string;
  controls: string;
  initialRisk: string;
  controlLevel: string;
  residualRisk: string;
};

type Substance = {
  product: string;
  state: string;
  maxQty: string;
  unNumber: string;
  hazardType: string;
  storage: string;
  segregation: string;
  controls: string;
  ppe: string;
  sdsLocation: string;
  initialRisk: string;
  residualRisk: string;
};

export type TradeTemplate = {
  activities: string;
  hazards: Hazard[];
  taskSteps: TaskStep[];
  substances: Substance[];
  ppeRequired: string[];
  siteRules: string[];
  trainingItems: string[];
  trainingRequired: string[];
  inductionProcess: string;
  commToolboxFreq: string;
  commPreStartFreq: string;
  commProgressFreq: string;
  emergencyProcedures: string;
  emergencyContacts: { name: string; role: string; phone: string }[];
  musterPoint: string;
  taskAnalysisRequired: boolean;
  hazardRegisterProvided: boolean;
  hazardousSubstancesOnSite: boolean;
};

// ───────────────────────────────────────────────────────────────────────────
// Common building blocks used across trades
// ───────────────────────────────────────────────────────────────────────────

const STANDARD_EMERGENCY_CONTACTS = [
  { name: "Emergency services", role: "Fire / Ambulance / Police", phone: "111" },
  { name: "WorkSafe NZ", role: "Notifiable events", phone: "0800 030 040" },
];

const STANDARD_EMERGENCY_PROCEDURES =
  "1) Stop work and make the area safe.\n" +
  "2) Call 111 for serious injury, fire, or major spill.\n" +
  "3) Notify PCBU 1 (Principal) immediately.\n" +
  "4) Administer first aid as required.\n" +
  "5) Preserve scene for investigation if notifiable. Notify WorkSafe NZ (0800 030 040) for notifiable events.\n" +
  "6) Record incident in Site Incident & Injury Register and update Hazard Register if needed.";

const STANDARD_INDUCTION =
  "Every worker signs the Task Analysis sign-on register before work commences. Site induction completed with PCBU 1 / Principal on arrival. Daily pre-start briefing covers hazards specific to that day's work area, weather, and any changes since last visit.";

// ───────────────────────────────────────────────────────────────────────────
// Trade templates
// ───────────────────────────────────────────────────────────────────────────

const electrical: TradeTemplate = {
  activities:
    "Electrical installation, fault-finding, maintenance and testing — including wiring, switchboards, and connected equipment.",
  hazards: [
    { hazard: "Electric shock / electrocution from live conductors", controls: "Lock-out / tag-out before work. Test before touch (live → dead → live). Insulated tools and gloves (Class 0 minimum for LV). Treat all circuits as live until proven dead.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Arc flash / arc blast", controls: "Isolate before opening switchboards. Arc-rated PPE for live work. Maintain safe approach distances. Trained electrician only.", initialRisk: "High", controlLevel: "Isolation + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Damaged power cords / leads", controls: "Visual check before each use. Test & tag in date (check tag colour). Replace any with cuts, exposed wire or damaged plugs. Use RCD on every lead.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — ladders, switchboards above shoulder", controls: "Inspect ladder before use. Three points of contact. Harness above 3m. Ladder secured at top where possible.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — cable drums, switchgear", controls: "Two-person lift over 23kg. Trolley / hand-truck where possible. Cable jacks for drums.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Power tools — cuts, kickback, eye injury", controls: "Guards in place. RCD on every lead. Eye protection always. Trained operator only.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in old buildings (pre-2000)", controls: "Assume asbestos until proven otherwise in pre-2000 buildings. Stop work if disturbed. Notify PCBU 1. Engage licensed removalist if confirmed.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Confined spaces — roof voids, plant rooms", controls: "Confined space permit. Gas test before entry. Stand-by person. Two-way comms. Trained entrant only.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site arrival & isolation", hazards: "Live circuits, unknown site conditions", controls: "Site induction / sign in. Identify circuit, isolate at source, lock-out/tag-out. Test for dead before touching.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Install / fault-find", hazards: "Electric shock, working at height, dust, cuts", controls: "Treat circuits as live until proven dead. Insulated tools. Eye protection. RCD on leads. Inspect ladder before use.", initialRisk: "High", controlLevel: "Isolation + Engineering + PPE", residualRisk: "Low" },
    { step: "3. Test & commission", hazards: "Re-energising, live testing", controls: "Trained electrician only. Multimeter calibration in date. Test in correct sequence (insulation, polarity, earth fault loop, RCD operation).", initialRisk: "High", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Trips, leftover offcuts, exposed terminals", controls: "Sweep area. Cover/seal any exposed terminals. Tools to vehicle. Sign out with PCBU 1. Issue Certificate of Compliance where required.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Contact cleaner (aerosol)", state: "Aerosol", maxQty: "2 cans", unNumber: "UN 1950", hazardType: "Flammable, Health effects", storage: "In vehicle, upright, away from ignition", segregation: "Away from oxidisers", controls: "Use in well-ventilated area. No naked flames.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Insulation tape adhesive / solvent", state: "Liquid", maxQty: "1 L", unNumber: "UN 1993", hazardType: "Flammable, Health effects", storage: "Sealed container in vehicle", segregation: "Away from ignition", controls: "Use outdoors / ventilated area.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Battery acid (UPS / standby batteries)", state: "Liquid", maxQty: "As installed", unNumber: "UN 2796", hazardType: "Corrosive", storage: "N/A — in equipment", segregation: "Away from food, food packaging", controls: "Spill kit on hand. Neutraliser available.", ppe: "Acid gloves, face shield, apron", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat where required", "Safety glasses", "Insulated gloves (Class 0 minimum for LV)", "Hearing protection", "Arc-rated clothing for live work"],
  siteRules: [
    "Sign in/out every day.",
    "Lock-out / tag-out before any work on circuits.",
    "Test before touch — always.",
    "RCD on every lead, every job.",
    "Test & tag must be in date — check tag colour.",
    "Eye protection on whenever using power tools.",
    "Report any near miss, shock or incident immediately.",
  ],
  trainingItems: ["All workers hold current EWRB registration appropriate to the work being performed."],
  trainingRequired: [
    "Electrical Workers Registration Board (EWRB) — Electrician or Electrical Inspector",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Working at Heights (where applicable)",
    "Confined Space Entry (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const plumbing: TradeTemplate = {
  activities:
    "Plumbing installation and maintenance — hot/cold water, drainage, sanitary, and gas fitting where licensed.",
  hazards: [
    { hazard: "Confined spaces — under-floor, manholes, sumps", controls: "Confined space permit. Gas test before entry (O2, LEL, H2S). Stand-by person. Two-way comms. Trained entrant only.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in old pipes / lagging (pre-2000)", controls: "Assume asbestos until proven otherwise. Stop work if disturbed. Notify PCBU 1. Engage licensed removalist if confirmed.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Scalding from hot water / steam", controls: "Isolate at source. Allow to cool before opening. PPE — long sleeves, gloves. Tempering valve check.", initialRisk: "Moderate", controlLevel: "Isolation + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Sewage / wastewater exposure — biological hazard", controls: "Nitrile gloves + impervious overalls. Eye protection. Wash hands & arms before eating/drinking. Hep A/B vaccinations recommended.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Sharps in waste pipes / drains", controls: "Cut-resistant gloves. Never reach blind into pipework. Vacuum drain before manual clearing where possible.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Gas leaks — LPG, natural gas", controls: "Calibrated leak detector on hand. Soap test all joints. Isolate at meter / cylinder. Ventilate. No ignition sources.", initialRisk: "High", controlLevel: "Isolation + Engineering", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — roof spaces, scaffold, ladders", controls: "Inspect ladder before use. Three points of contact. Harness above 3m. Edge protection on roofs.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — pipework, hot water cylinders, fixtures", controls: "Two-person lift over 23kg. Trolley / hand-truck where possible. Pipe jacks for vertical work.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up & isolation", hazards: "Live water/gas, unknown pipework, traffic in workspace", controls: "Site induction / sign in. Identify isolation point. Isolate water/gas, lock-out where required. Bunds and sorbents for drips.", initialRisk: "Moderate", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Drain down / depressurise", hazards: "Residual pressure, scalding, sewage exposure", controls: "Open lowest point. Allow full drain. PPE for any sewage / wastewater work. Capture any contaminated water.", initialRisk: "Moderate", controlLevel: "Isolation + PPE", residualRisk: "Low" },
    { step: "3. Cut & install", hazards: "Sharps, hot tools, solvents, manual handling", controls: "Cut-resistant gloves. Eye protection. Use approved solvent cement in ventilated area. Two-person lift heavy items.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "4. Pressure test & commission", hazards: "Sudden release of pressurised water/gas, leaks", controls: "Test to spec — no over-pressure. Stand clear of test points. Soap test gas joints. Tempering valve commissioned.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "5. Clean up & sign off", hazards: "Slips, sharps, leftover waste", controls: "Vacuum / mop wet areas. Bag all sharps. Tools to vehicle. Sign out with PCBU 1. Issue Gas Safety Certificate where applicable.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "PVC solvent cement", state: "Liquid", maxQty: "1 L", unNumber: "UN 1133", hazardType: "Flammable, Health effects", storage: "Sealed tin, upright in vehicle", segregation: "Away from ignition and oxidisers", controls: "Use in ventilated area. Lid on when not in use.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Plumbers flux (paste)", state: "Paste", maxQty: "500 g", unNumber: "N/A", hazardType: "Corrosive, Health effects", storage: "Sealed tin in vehicle", segregation: "Away from food", controls: "Wash hands after use. Avoid skin contact.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "LPG (cylinder for brazing / heating)", state: "Liquefied gas", maxQty: "9 kg", unNumber: "UN 1965", hazardType: "Flammable gas", storage: "Upright, secured, outdoors / ventilated vehicle bay", segregation: "Away from oxygen, oxidisers, ignition", controls: "Cylinder upright, secured, valve closed when not in use. Leak test joints.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
    { product: "Drain cleaner (caustic / acid)", state: "Liquid", maxQty: "2 L", unNumber: "UN 1824 / UN 1789", hazardType: "Corrosive", storage: "Sealed, upright, in vehicle", segregation: "Acid and caustic kept separate", controls: "Never mix. Use in ventilated area. Spill kit on hand.", ppe: "Acid gloves, face shield, apron", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest", "Safety glasses", "Nitrile gloves (drains)", "Leather gloves (general)", "Knee pads", "P2 respirator (asbestos suspicion)", "Hearing protection"],
  siteRules: [
    "Sign in/out every day.",
    "Isolate water/gas at source before work.",
    "Calibrated gas leak detector with you on every gas job.",
    "Sewage / drainage work — full PPE, no exceptions.",
    "Wash hands and arms before eating, drinking or smoking.",
    "Pre-2000 building? Assume asbestos until proven otherwise.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers hold current Plumbers, Gasfitters & Drainlayers Board registration appropriate to the work being performed."],
  trainingRequired: [
    "Plumbers, Gasfitters and Drainlayers Board (PGDB) — Certifying Plumber",
    "Certifying Gasfitter (where gas work performed)",
    "Certifying Drainlayer (where drainage work performed)",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Confined Space Entry",
    "Working at Heights (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const carpentry: TradeTemplate = {
  activities:
    "Carpentry and joinery — framing, fix-out, decking, formwork, cabinetry installation, repairs.",
  hazards: [
    { hazard: "Nail gun injury", controls: "Sequential trip trigger only. Never bypass safety. Eye and hearing protection. Disconnect from air/battery when not in use. Hands clear of firing line.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Power saws — circular, mitre, table — cuts and kickback", controls: "Guards in place and working. Push sticks for narrow rips. Workpiece secured. Trained operator only. RCD on lead.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — scaffold, ladder, formwork", controls: "Scaffold inspection tag in date. Ladder inspected before use. Three points of contact. Harness above 3m. Edge protection where required.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Wood dust — respiratory and eye", controls: "P2 respirator when cutting/sanding. Dust extraction on tools where possible. Eye protection. Wet-down clean up.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Noise from power tools and compressors", controls: "Hearing protection (Class 5) when tools running. Keep distance from operating equipment.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — sheet material, framing timber", controls: "Two-person lift sheets and lengths over 23kg. Trolley / hand-truck where possible. Plan lift path before moving.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Treated timber — H3, H4, H5 (CCA, ACQ)", controls: "Gloves and eye protection when cutting. P2 respirator. Wash hands before eating. Do not burn offcuts.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Slips, trips, sharps — nails, offcuts, cords", controls: "Keep walkways clear. Sweep offcuts and nails regularly. Leads off the floor or matted.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up", hazards: "Trips, unknown ground, traffic, services overhead/underground", controls: "Site induction / sign in. Identify any overhead/underground services with PCBU 1. Set up tool/material zone clear of traffic. Cones and signs where required.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "2. Set out & cut", hazards: "Saw cuts, kickback, dust, noise", controls: "Trained operator on each tool. Guards working. Eye, ear, dust PPE. Workpiece secured. RCD on lead. Push stick for narrow rips.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "3. Fix / install", hazards: "Nail gun injury, falls, manual handling", controls: "Sequential trip trigger only. Harness above 3m. Two-person lift heavy items. Hands clear of firing line.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Sharps (nails), offcuts, trips, dust", controls: "Sweep area. Magnet sweep for nails. Bag offcuts. Tools to vehicle. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Construction adhesive (e.g. liquid nails)", state: "Paste", maxQty: "5 tubes", unNumber: "UN 1133", hazardType: "Flammable, Health effects", storage: "In vehicle, away from ignition", segregation: "Away from oxidisers", controls: "Use in ventilated area. Cap when not in use.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Polyurethane sealant", state: "Paste", maxQty: "5 tubes", unNumber: "N/A", hazardType: "Health effects (sensitiser)", storage: "Sealed cartridge in vehicle", segregation: "Standard", controls: "Use in ventilated area. Avoid skin contact.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Timber preservative / end-grain sealer", state: "Liquid", maxQty: "5 L", unNumber: "UN 1993", hazardType: "Flammable, Health effects, Eco-toxic", storage: "Sealed container in vehicle", segregation: "Away from ignition", controls: "Use outdoors. Avoid skin contact.", ppe: "Gloves, safety glasses, P2 respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Petrol (small engines — gen sets, saws)", state: "Liquid", maxQty: "20 L", unNumber: "UN 1203", hazardType: "Flammable, Toxic, Eco-toxic", storage: "Approved jerry can, upright in vehicle", segregation: "Away from ignition and oxidisers", controls: "No refuelling near ignition. Spill kit on hand.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Cut-resistant gloves", "Hearing protection (Class 5)", "P2 dust mask", "Harness for working above 3m"],
  siteRules: [
    "Sign in/out every day.",
    "Guards on power tools — always. No bypassing.",
    "Sequential trigger only on nail guns.",
    "Hearing protection on whenever tools are running.",
    "P2 respirator on for cutting / sanding.",
    "Magnet-sweep for nails before leaving site.",
    "Leads off the ground or matted where they cross paths.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers appropriately qualified, competent, or fully supervised."],
  trainingRequired: [
    "Carpentry trade qualification or apprenticeship in progress",
    "LBP registration (Licensed Building Practitioner) — where required for restricted building work",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Working at Heights (where applicable)",
    "Scaffolding ticket (where erecting scaffold over 5m)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const roofing: TradeTemplate = {
  activities:
    "Roofing installation, repair and re-roofing — including metal, tile, membrane, flashings and spouting.",
  hazards: [
    { hazard: "Fall from height — edge, skylight, fragile roof", controls: "Edge protection (rails or scaffold) on all open edges. Skylight covers or barriers. Harness anchored to certified point above 3m. Roof condition assessed before access.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Falling objects — tools, materials, offcuts", controls: "Tool lanyards. Mesh / kickboards at edge. Drop zone barricaded below. Hard hat below roof.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Weather — wind, rain, heat, UV", controls: "Daily weather check before access. Stop work at wind gusts >40km/h (or per site SWMS). Sunscreen, hat, water. Wet roofs — no access.", initialRisk: "High", controlLevel: "Administrative + PPE", residualRisk: "Moderate", toolbox: true },
    { hazard: "Asbestos in old roofing (pre-2000 super-six, fibre cement)", controls: "Assume asbestos until proven otherwise. Stop work if disturbed. Engage licensed removalist if confirmed.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — sheets, rolls, tiles", controls: "Mechanical lift (telehandler, hoist) for bulk material. Two-person lift sheets. Plan lift before moving.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Cuts from sheet metal edges", controls: "Cut-resistant gloves at all times. Edge dressed before handling. First aid for cuts immediately.", initialRisk: "Moderate", controlLevel: "PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical — overhead lines, on-roof equipment", controls: "Identify overhead lines on site induction. Maintain 4m clearance. De-energise where work within zone. Treat any on-roof gear as live.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Power tools — drills, shears, grinders", controls: "Guards in place. RCD on every lead. Eye and hearing protection. Trained operator only.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up & access", hazards: "Falls, falling objects, traffic below", controls: "Erect scaffold / edge protection BEFORE access. Drop zone barricaded. Hard hats below. Weather check.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "2. Strip old roofing (re-roof)", hazards: "Falls, asbestos, manual handling, sharps", controls: "Harness anchored. Assume asbestos pre-2000 — test or assume. Lower material in skip/hoist, not throw. Cut-resistant gloves.", initialRisk: "High", controlLevel: "Isolation + Engineering + PPE", residualRisk: "Moderate" },
    { step: "3. Install new roofing", hazards: "Falls, cuts, manual handling, weather", controls: "Maintain edge protection. Cut-resistant gloves. Two-person lift sheets. Daily weather check. Tool lanyards.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Flashings, spouting & seal", hazards: "Falls, sealant exposure, cuts", controls: "Harness anchored. Sealant in ventilated workspace. Gloves and eye protection.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "5. Clean up & sign off", hazards: "Sharps below, leftover material, edge", controls: "Magnet sweep for screws/nails. Material to vehicle/skip. Edge protection last to come down. Sign out.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
  ],
  substances: [
    { product: "Roofing sealant (polyurethane / silicone)", state: "Paste", maxQty: "10 tubes", unNumber: "N/A", hazardType: "Health effects (sensitiser)", storage: "Sealed cartridges in vehicle", segregation: "Standard", controls: "Use in ventilated area. Avoid skin contact.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Bitumen / membrane primer", state: "Liquid", maxQty: "5 L", unNumber: "UN 1993", hazardType: "Flammable, Health effects", storage: "Sealed tin in vehicle, away from ignition", segregation: "Away from ignition and oxidisers", controls: "Outdoors only. Spill kit on hand.", ppe: "Gloves, safety glasses, P2 respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "LPG (torch-on membrane)", state: "Liquefied gas", maxQty: "9 kg", unNumber: "UN 1965", hazardType: "Flammable gas", storage: "Upright, secured, outdoors", segregation: "Away from oxygen, oxidisers, ignition", controls: "Hot work permit. Fire extinguisher within reach. No combustibles within 3m. Fire watch 1hr after work.", ppe: "Gloves, safety glasses, long sleeves", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
  ],
  ppeRequired: ["Safety boots (slip-resistant sole)", "Hi-viz vest", "Hard hat", "Safety glasses", "Cut-resistant gloves", "Full-body harness with shock-absorbing lanyard", "Hearing protection", "Sun protection (hat, sunscreen)"],
  siteRules: [
    "Sign in/out every day.",
    "Edge protection up BEFORE any access.",
    "Harness anchored to certified point — always above 3m.",
    "Weather check first thing — wind / rain stops work.",
    "Drop zone barricaded. Hard hats below.",
    "Tool lanyards on every tool taken up.",
    "Cut-resistant gloves on whenever handling sheet metal.",
    "Pre-2000 building? Assume asbestos until proven otherwise.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers appropriately qualified, competent, or fully supervised."],
  trainingRequired: [
    "Roofing trade qualification or apprenticeship in progress",
    "Working at Heights — current certification",
    "Harness use and rescue training",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Hot Work / LPG (where torch-on membrane used)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES + "\n7) Fall arrest — suspended worker must be recovered within 15 minutes (suspension trauma). Trained rescue procedure to apply.",
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const painting: TradeTemplate = {
  activities:
    "Painting and decorating — interior and exterior, including surface prep, priming and finishing.",
  hazards: [
    { hazard: "Working at height — ladders, scaffold, EWPs", controls: "Inspect ladder before use. Three points of contact. Harness above 3m. Scaffold inspection tag in date. EWP operator ticketed.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Solvent exposure — fumes, skin", controls: "Ventilate workspace. Water-based products where possible. Organic vapour respirator for solvent-based. Gloves.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Lead-based paint (pre-1980 buildings)", controls: "Test before sanding/stripping pre-1980 paint. Wet methods only — no dry sanding. P2 respirator. Containment sheets. Specialist disposal.", initialRisk: "High", controlLevel: "Isolation + Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in old surfaces (textured ceilings, fibre cement)", controls: "Assume asbestos until proven otherwise pre-2000. Stop work if disturbed. Engage licensed removalist.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Slips from drop sheets and wet paint", controls: "Tape edges of drop sheets. Wet floor signs. Cordon wet paint areas.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — paint pails, equipment", controls: "Two-person lift over 23kg. Trolley for multiple pails. Decant from large to small.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "High-pressure airless spray gun — injection injury", controls: "Trained operator only. Tip guard in place. Trigger lock when not spraying. Never aim at body. Treat any injection as A&E emergency.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Dust from sanding", controls: "Dust extraction on sanders. P2 respirator. Eye protection. Vacuum clean-up.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up & masking", hazards: "Trips, manual handling, traffic", controls: "Site induction / sign in. Drop sheets taped at edges. Cordon work area. Two-person lift pails.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
    { step: "2. Surface prep — sand / scrape / wash", hazards: "Lead/asbestos exposure, dust, falls, solvent", controls: "Pre-1980? Test for lead first. Pre-2000? Assume asbestos until tested. Wet methods. P2 respirator. Harness above 3m.", initialRisk: "High", controlLevel: "Isolation + Engineering + PPE", residualRisk: "Low" },
    { step: "3. Prime & paint", hazards: "Solvent, falls, spray injection, slips", controls: "Ventilate. Respirator for solvent. Harness above 3m. Spray gun trained operator only with tip guard. Wet floor cordoned.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Solvent disposal, slips, leftover material", controls: "Decant solvents to labelled container. Wash equipment in designated area. Cordon wet paint until dry. Sign out.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Water-based paint", state: "Liquid", maxQty: "20 L", unNumber: "N/A", hazardType: "Health effects (mild)", storage: "Sealed pail in vehicle", segregation: "Standard", controls: "Lid on when not in use.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Solvent-based paint / enamel", state: "Liquid", maxQty: "10 L", unNumber: "UN 1263", hazardType: "Flammable, Health effects", storage: "Sealed, upright, away from ignition", segregation: "Away from oxidisers and food", controls: "Use in ventilated area. Spill kit on hand.", ppe: "Gloves, safety glasses, organic vapour respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Mineral turpentine / thinners", state: "Liquid", maxQty: "5 L", unNumber: "UN 1300", hazardType: "Flammable, Health effects", storage: "Sealed, upright, away from ignition", segregation: "Away from oxidisers", controls: "Use outdoors / ventilated area. No naked flames.", ppe: "Gloves, safety glasses, organic vapour respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Sugar soap / TSP cleaner", state: "Liquid / Powder", maxQty: "2 L / 1 kg", unNumber: "N/A", hazardType: "Irritant, Health effects", storage: "Sealed container", segregation: "Away from food", controls: "Use gloves. Ventilate.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest (exterior)", "Safety glasses", "Nitrile gloves", "P2 respirator (sanding / dust)", "Organic vapour respirator (solvent paint)", "Coveralls (spray work)", "Harness above 3m"],
  siteRules: [
    "Sign in/out every day.",
    "Pre-1980 building? Test for lead before sanding.",
    "Pre-2000 building? Assume asbestos until proven otherwise.",
    "Drop sheets taped at edges — no trip points.",
    "Respirator on for solvent work, sanding, and spraying.",
    "Spray gun trigger locked when not in use.",
    "Wet paint areas cordoned until dry.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers appropriately qualified, competent, or fully supervised."],
  trainingRequired: [
    "Painting trade qualification or apprenticeship in progress",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Working at Heights (where applicable)",
    "Elevated Work Platform (EWP) ticket (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES + "\n7) High-pressure spray injection — even a tiny mark on skin requires immediate A&E. Do NOT delay.",
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const concrete_grinding: TradeTemplate = {
  activities:
    "Concrete grinding, line removal, polishing and surface preparation — for floors, slabs and pavements.",
  hazards: [
    { hazard: "Respirable crystalline silica dust from grinding", controls: "Dust extractor (HEPA / M-class) attached to every grinder. Wet methods where possible. P2 respirator minimum (P3 for prolonged work). Air monitoring on long jobs.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Noise from grinders, vacuums, generators", controls: "Class 5 hearing protection. Keep non-workers clear. Limit run time where possible.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Hand-arm vibration from grinders", controls: "Anti-vibration gloves. Job rotation — limit continuous use. Sharp diamonds (blunt = more vibration).", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical — leads, machinery near water (wet grinding)", controls: "All electrical machinery test & tagged in date. RCD on every lead. Leads off the ground or matted. Generator earthed.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — grinders, vacuums, slurry drums", controls: "Two-person lift over 23kg. Trolley / forklift for heavy gear. Empty vacuum before moving.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Slips on slurry / polished concrete", controls: "Cordon wet areas. Wet-floor signs. Slip-resistant boots. Squeegee and dry as you go.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Eye injury from flying debris", controls: "Sealed safety glasses or face shield at all times when grinder running. Bystanders clear.", initialRisk: "Moderate", controlLevel: "PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Confined or unventilated spaces — fumes from petrol/diesel gear", controls: "No petrol gear indoors without forced ventilation. CO monitor. Electric or air-powered preferred indoors.", initialRisk: "High", controlLevel: "Isolation + Engineering", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up", hazards: "Traffic, pedestrians, plant, unknown floor condition", controls: "Site induction / sign in. Cones, signs, barriers. Liaise with PCBU 1 on plant movement. Identify any embedded services in slab. Test & tag check on all gear.", initialRisk: "Moderate", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Grind / cut / polish", hazards: "Silica dust, noise, vibration, electrical, eye debris", controls: "Dust extractor on every grinder. P2/P3 respirator. Class 5 hearing protection. Anti-vibration gloves. Sealed eye protection. RCD on lead.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Vacuum / wash down", hazards: "Slurry slips, dust on disturbance, manual handling", controls: "Cordon wet areas. Wet floor signs. Two-person lift slurry drums. Continue respirator until area cleared.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "4. Exit & sign off", hazards: "Leftover slurry, leads, residual dust", controls: "Bag dust and take from site (do not leave). Squeegee dry. Roll up leads. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Concrete dust (respirable silica)", state: "Solid", maxQty: "Generated on site", unNumber: "N/A", hazardType: "Health effects (respirable crystalline silica)", storage: "N/A — vacuumed at source", segregation: "N/A", controls: "Dust extractor on every grinder. Vacuum clean-up. Dust bagged and removed from site.", ppe: "P2 respirator min (P3 for prolonged), sealed safety glasses, gloves", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Low" },
    { product: "Concrete densifier / sealer (lithium / sodium silicate)", state: "Liquid", maxQty: "20 L", unNumber: "N/A", hazardType: "Corrosive (caustic), Health effects", storage: "Sealed pail, upright in vehicle", segregation: "Away from acids and food", controls: "Use in ventilated area. Spill kit. Avoid skin contact.", ppe: "Gloves, safety glasses, long sleeves", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Diamond cup / blade coolant (water)", state: "Liquid", maxQty: "As needed", unNumber: "N/A", hazardType: "N/A", storage: "Site tap or jerry can", segregation: "N/A", controls: "Manage slurry runoff — do not allow into stormwater.", ppe: "Standard PPE", sdsLocation: "N/A", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Petrol (generator / petrol-powered grinder)", state: "Liquid", maxQty: "20 L", unNumber: "UN 1203", hazardType: "Flammable, Toxic, Eco-toxic", storage: "Approved jerry can, upright in vehicle", segregation: "Away from ignition and oxidisers", controls: "No refuelling near ignition. Spill kit on hand. No petrol gear indoors without forced ventilation.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
  ],
  ppeRequired: ["Safety boots (slip-resistant)", "Hi-viz vest", "Helmet (hard hat)", "Sealed safety glasses", "Anti-vibration gloves", "Class 5 hearing protection", "P2/P3 respirator", "Kneepads"],
  siteRules: [
    "Sign in/out every day.",
    "Dust extractor on every grinder — no dry cutting without it.",
    "Respirator (P2 minimum) on whenever dust is being generated.",
    "Hearing protection on whenever grinder running.",
    "No petrol-powered gear indoors without forced ventilation + CO monitor.",
    "RCD on every lead, every job.",
    "Slurry stays on site — bagged and removed, never into stormwater.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers appropriately qualified, competent, or fully supervised."],
  trainingRequired: [
    "Concrete grinding / polishing work experience",
    "Silica awareness training (HSWA hazardous substance)",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
    "Confined Space Entry (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const line_marking: TradeTemplate = {
  activities:
    "Line marking and floor prep — including set-up, set-out/mark, exiting/clean-up, and concrete grinding/line removal where required.",
  hazards: [
    { hazard: "Paint spillage", controls: "Spill kit at vehicle. Cones to segregate work area. Sorbents readily available. Protect waterways with bunds/sorbents.", initialRisk: "Minor", controlLevel: "2 - Isolate / engineering", residualRisk: "Superficial", toolbox: true },
    { hazard: "Traffic — vehicles, forklifts, pedestrians", controls: "STMS in place. Cones, signs, barriers. Liaison with factory and staff. Site induction completed before entry.", initialRisk: "Moderate", controlLevel: "Isolation", residualRisk: "Low", toolbox: true },
    { hazard: "Dust from grinding / line removal", controls: "Dust extractor attached to all grinders. Vacuum clean-up. Dust bagged and removed from site. Respirator (P2) and eye protection worn.", initialRisk: "High", controlLevel: "Engineering", residualRisk: "Very Low", toolbox: true },
    { hazard: "Wet paint — slip / contamination", controls: "Keep area closed off and signed until paint is fully dry. Cones around perimeter.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "High-pressure paint lines", controls: "Trained operators only. Pump checked daily. Pressure released before disconnect. PPE worn.", initialRisk: "Moderate", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Noise from grinders / line marking machines", controls: "Keep distance from operating equipment. Hearing protection (ear muffs / plugs) worn at all times.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical — leads, machinery", controls: "All electrical machinery and power cords tested & tagged in date. Leads kept off the ground or matted where vehicles pass.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Hazardous substances — solvents, paint, fuels", controls: "SDS on site. Good ventilation. Spill kit. Gloves, glasses worn during decant/use. Stored in vehicle away from ignition.", initialRisk: "Moderate", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up", hazards: "Forklifts, heavy traffic, pedestrians. Industry plant/stock exclusion zone. Paint spill. Spray unit faults.", controls: "Complete site induction / sign in. Cones, signs, barriers, liaison with factory and staff. Stay clear of plant/exclusion zones. Obtain required permits. Abide by client's H&S policy. Spill kit & sorbents readily available; protect waterways with bunds/sorbents. Check spray unit in good clean working condition, pump oiled, trained operators only.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Moderate" },
    { step: "2. Set out / mark", hazards: "Forklifts, heavy traffic, pedestrians. Industry plant/stock exclusion zone. Wet paint. High-pressure paint lines.", controls: "Maintain induction / sign in. Cones, signs, barriers, liaison with factory and staff. Stay clear of plant/exclusion zones. Abide by client's H&S policy. Keep marked areas closed off until dry. Trained operators only on high-pressure equipment.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Moderate" },
    { step: "3. Concrete grinding & line removal (where required)", hazards: "Untested / out-of-date electrical machinery. Dust. Site contamination after grind.", controls: "Confirm all machinery & power cords are tested & tagged in date. Dust extractor attached to grinder at all times. Vacuum clean site after grind, bag remaining dust and take away. Respirator and eye protection worn.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Exiting / clean-up", hazards: "Rubbish, equipment, plant movement.", controls: "Clean up all rubbish and equipment from work area. Stay clear of plant / exclusion zones. Follow client instructions to exit site. Sign out.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
  ],
  substances: [
    { product: "C! Roll On (MMA)", state: "Liquid", maxQty: "20 L", unNumber: "UN 1263", hazardType: "Flammable, Health effects, Corrosive, Eco-toxic", storage: "In vehicle, upright, away from ignition", segregation: "Away from oxidisers and food", controls: "Spill kit. Good ventilation. Decant outside.", ppe: "Gloves, safety glasses, respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Very Low" },
    { product: "Petrol", state: "Liquid", maxQty: "20 L", unNumber: "UN 1203", hazardType: "Flammable, Toxic, Corrosive, Eco-toxic", storage: "Approved jerry can, upright in vehicle", segregation: "Away from ignition, oxidisers and food", controls: "No refuelling near ignition sources. Spill kit on hand.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
    { product: "Toluene", state: "Liquid", maxQty: "5 L", unNumber: "UN 1294", hazardType: "Flammable, Toxic, Corrosive, Eco-toxic", storage: "Sealed container, ventilated area, in vehicle", segregation: "Away from oxidisers, food and ignition", controls: "Use outdoors / well-ventilated area. Spill kit available.", ppe: "Gloves, safety glasses, respirator", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Concrete / line-marking dust", state: "Solid", maxQty: "Generated on site", unNumber: "N/A", hazardType: "Health effects (respirable crystalline silica)", storage: "N/A — vacuumed at source", segregation: "N/A", controls: "Dust extractor attached to grinder. Vacuum clean-up. Dust bagged and removed.", ppe: "Respirator (P2), safety glasses, gloves", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest", "Helmet (hard hat)", "Safety glasses", "Gloves", "Ear protectors", "Respirator (P2 for dust)"],
  siteRules: [
    "Sign in/out every day. No exceptions.",
    "PPE on at all times within the work area (boots, hi-viz, glasses, gloves, ear protection).",
    "Respirator (P2) on whenever dust is being generated.",
    "Stay clear of plant, exclusion zones and forklift paths — make eye contact with operators.",
    "Spill kit must travel with the vehicle every job.",
    "No refuelling near ignition sources or inside buildings.",
    "Wet line markings stay coned off until dry.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers are appropriately qualified, competent, or fully supervised"],
  trainingRequired: [
    "Line marking — Work experience (competency register)",
    "Resin flooring — Work experience",
    "STMS / TC where road traffic is present",
    "Site Safe Passport (where required by PCBU 1)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "N/A",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const general: TradeTemplate = {
  activities: "General trade work — review and customise this template for your specific scope.",
  hazards: [
    { hazard: "Manual handling — lifting, carrying, awkward postures", controls: "Two-person lift over 23kg. Mechanical aids where possible. Plan lift before moving.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Power tool injury — cuts, eye, hearing", controls: "Guards in place. RCD on every lead. Eye, ear, dust PPE. Trained operator only.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Slips, trips, falls on site", controls: "Keep walkways clear. Leads off ground or matted. Clean up as you go.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height (where applicable)", controls: "Inspect ladder/scaffold before use. Three points of contact. Harness above 3m.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Traffic — vehicles, plant, pedestrians on site", controls: "Hi-viz at all times. Eye contact with operators. Stay clear of plant exclusion zones.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in old buildings (pre-2000)", controls: "Assume asbestos until proven otherwise pre-2000. Stop work if disturbed. Engage licensed removalist if confirmed.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up", hazards: "Traffic, unknown ground conditions, services", controls: "Site induction / sign in. Identify any overhead/underground services with PCBU 1. Set up tool/material zone clear of traffic.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "2. Perform the work", hazards: "Trade-specific — customise this step", controls: "Use task-specific PPE. Trained operator only on any plant/tools. Follow manufacturer instructions.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "3. Clean up & sign off", hazards: "Leftover material, trips, sharps", controls: "Sweep area. Tools to vehicle. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Petrol (generators, small engines)", state: "Liquid", maxQty: "20 L", unNumber: "UN 1203", hazardType: "Flammable, Toxic, Eco-toxic", storage: "Approved jerry can, upright in vehicle", segregation: "Away from ignition and oxidisers", controls: "No refuelling near ignition. Spill kit on hand.", ppe: "Gloves, safety glasses", sdsLocation: "On site — in vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Hearing protection"],
  siteRules: [
    "Sign in/out every day.",
    "Full PPE on within the work area.",
    "RCD on every lead.",
    "Pre-2000 building? Assume asbestos until proven otherwise.",
    "Report any near miss or incident immediately.",
  ],
  trainingItems: ["All workers appropriately qualified, competent, or fully supervised."],
  trainingRequired: [
    "Trade qualification or apprenticeship in progress (as applicable)",
    "Site Safe Passport (where required by PCBU 1)",
    "First Aid certificate (within 2 years)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const civil: TradeTemplate = {
  activities: "Civil construction and earthworks — excavation, trenching, backfilling, compaction, drainage installation, and earthmoving plant operation.",
  hazards: [
    { hazard: "Excavation collapse / trench cave-in", controls: "No personnel in unsupported trenches over 1.5 m deep. Battering, shoring or trench box required. Engineer sign-off for deep excavations.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Striking underground services (gas, electrical, water, comms)", controls: "Dial Before You Dig (0800 474 335) before every excavation. Hand-dig within 500 mm of confirmed service line. Pothole to confirm depths.", initialRisk: "High", controlLevel: "Administrative + Engineering", residualRisk: "Low", toolbox: true },
    { hazard: "Plant / machinery striking workers — excavator, roller, dump truck", controls: "Exclusion zone — no personnel within the swing radius. Spotter / banksman for reversing plant. Ground disturbance permit where required. Hi-viz mandatory.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Overhead powerlines — plant contact", controls: "Mark powerlines on site plan. Spotter when working near lines. Boom height limiter or safe approach distance (>4 m for lines without voltage known).", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — pipes, concrete blocks, kerb sections", controls: "Mechanical lift (excavator, crane) for items over 23 kg. Two-person lift where mechanical aid is unavailable. Plan lift route before moving.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Silica dust from concrete and rock cutting", controls: "Wet cutting. P2 respirator mandatory during cutting. Dust suppression on exposed faces.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Service location & site set-up", hazards: "Underground services, traffic, unknown ground", controls: "Dial Before You Dig confirmed. Pothole to verify service depths. Set up TMP / exclusion zones. Site induction complete.", initialRisk: "High", controlLevel: "Administrative + Engineering", residualRisk: "Low" },
    { step: "2. Excavation & earthmoving", hazards: "Collapse, plant strike, overhead lines", controls: "Trench support in place before entry. Exclusion zones enforced. Spotter for plant movement. Boom limiter near powerlines.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Lay services / drainage", hazards: "Manual handling, trench entry, residual groundwater", controls: "Mechanical aid for pipe placement. Pump groundwater before entry. Shoring maintained. No entry to unsupported trench.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "4. Backfill & compact", hazards: "Plant strike, vibration, dust", controls: "Personnel clear of compactor zone. Ear protection. Dust suppression. Layer compaction to spec.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "5. Reinstate & sign off", hazards: "Trips, traffic, open excavation", controls: "Temporary reinstatement to safe trafficable standard. Remove TMP in reverse order. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Diesel (plant and machinery)", state: "Liquid", maxQty: "200 L", unNumber: "UN 1202", hazardType: "Flammable, Eco-toxic", storage: "Approved bunded tank or jerry can in vehicle", segregation: "Away from ignition and oxidisers", controls: "No refuelling near ignition. Spill kit on site.", ppe: "Gloves, safety glasses", sdsLocation: "On site — vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Concrete (wet — skin/eye irritant)", state: "Solid/slurry", maxQty: "As required", unNumber: "N/A", hazardType: "Corrosive (wet), Health effects", storage: "N/A — in drum/pump truck", segregation: "N/A", controls: "Avoid prolonged skin contact. Change wet concrete-soaked clothing immediately.", ppe: "Waterproof gloves, safety glasses, waterproof boots", sdsLocation: "On site — SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (Class D)", "Hard hat", "Safety glasses", "Gloves", "Hearing protection (plant operation)", "P2 dust mask (cutting/grinding)", "Hi-viz vest"],
  siteRules: ["Sign in/out every day.", "No entry to unsupported trench over 1.5 m — no exceptions.", "Dial Before You Dig confirmed before every dig.", "Exclusion zone enforced around all moving plant.", "Hi-viz on at all times on site.", "Report any near miss or incident immediately."],
  trainingItems: ["All plant operators hold the appropriate competency for the equipment being operated."],
  trainingRequired: ["NZ Certificate in Infrastructure Works (Civil) or equivalent", "Plant operator competency (excavator, roller, grader — as applicable)", "White Card (General Construction Induction, where required)", "Traffic Management qualification (where TMP required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const demolition: TradeTemplate = {
  activities: "Demolition of structures — including strip-out, mechanical demolition, hand demolition, and associated waste removal. All work performed by competent demolition contractors.",
  hazards: [
    { hazard: "Asbestos — disturbance during demolition", controls: "Asbestos survey completed before demolition starts. Licensed removalist for all friable and non-friable asbestos. Stop work if suspected ACM encountered.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Structural collapse — premature or uncontrolled", controls: "Demolition sequence documented and followed. Structural engineer sign-off for complex demolition. No personnel under unsupported sections.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Dust — silica, lead paint, biological", controls: "Wet methods. P2 / P3 respirator mandatory. Seal off adjacent occupied areas. Air monitoring where required.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Plant / machinery strike in demolition zone", controls: "Strict exclusion zone around demolition plant. Spotter for all reversing movements. No bystanders in demolition zone.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Falling debris and dropped tools", controls: "Barricade and sign public exclusion zone. Overhead protection (scaffolding / hoarding) where public or other workers are at risk. Tool lanyards at height.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Pre-demolition — services isolation and asbestos clearance", hazards: "Live services, asbestos, unknown hazards", controls: "All services isolated and capped (electrical, gas, water, comms). Asbestos clearance certificate on site. Site induction complete.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Strip out and hand demolition", hazards: "Manual handling, dust, lead paint, falling debris", controls: "P2/P3 respirator. Wet methods for dusty materials. Two-person lift over 23 kg. Hard hat and safety glasses.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Mechanical demolition", hazards: "Plant strike, structural collapse, debris projection", controls: "Exclusion zone enforced. Demolition sequence followed. Structural engineer on call. All bystanders cleared.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "4. Waste segregation and removal", hazards: "Asbestos waste, sharp debris, manual handling", controls: "Asbestos waste double-bagged, labelled, disposed to approved site. Waste bins not overfilled. Gloves and eye protection for debris handling.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "5. Site make-safe and sign off", hazards: "Exposed foundations, trip hazards, unsecured perimeter", controls: "Perimeter hoarding / fencing complete. Open pits covered or barricaded. Site cleared of loose debris. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Diesel (plant)", state: "Liquid", maxQty: "200 L", unNumber: "UN 1202", hazardType: "Flammable, Eco-toxic", storage: "Bunded tank on site", segregation: "Away from ignition", controls: "Spill kit on site.", ppe: "Gloves, safety glasses", sdsLocation: "On site — SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "P2 / P3 respirator (dust)", "Heavy-duty gloves", "Hearing protection", "Tyvek overalls (asbestos adjacent work)"],
  siteRules: ["Sign in/out every day.", "Asbestos clearance certificate on site before work starts.", "No entry to demolition zone without hard hat, hi-viz and P2 respirator.", "Exclusion zones enforced — no bystanders.", "Report any suspected asbestos immediately — stop work.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers appropriately trained in demolition safety and asbestos awareness."],
  trainingRequired: ["Demolition trade qualification or demonstrated competency", "Asbestos awareness training (all workers)", "Asbestos removal licence (licensed removalist — for asbestos removal)", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const scaffolding: TradeTemplate = {
  activities: "Erection, alteration and dismantling of scaffolding — including tube-and-coupler, system scaffold and mobile scaffolding.",
  hazards: [
    { hazard: "Falls during erection / dismantling — leading edge work", controls: "Work sequence minimises time without edge protection. Harness on anchor above 3 m during all leading-edge work. No free-climbing.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Dropped tools and materials from height", controls: "Tool bags and lanyards for all hand tools at height. Drop zone barricaded below. Mesh / kickboards on completed lifts.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Scaffold overload or structural failure", controls: "Load capacity marked on scaffold before handover. No modifications without scaffolder. Scaffold inspected after weather events. Inspection tag in date.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — tubes, boards, couplers", controls: "Team lift for items over 23 kg. Rope and pulley for vertical material handling. Back brace where required.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Wind loading — instability during high wind", controls: "Scaffold rated to NZS 4576. Tie at maximum tie spacing. Stop work at gusts >60 km/h. Monitor weather forecast.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Ground preparation and base plate set-up", hazards: "Uneven ground, underground services, plant access", controls: "Ground bearing capacity confirmed. Base plates on sole boards. Dial Before You Dig confirmed. Site induction complete.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "2. Erect standards, ledgers and transoms", hazards: "Falls, dropped materials, manual handling", controls: "Harness on anchor during leading-edge work. Tool lanyards. Drop zone clear. Team lift for long tubes.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Install boards, toe boards and guardrails", hazards: "Falls through incomplete deck, leading edge exposure", controls: "Boards installed from below using pole system where possible. Harness on anchor for leading edge. Tie scaffold as work proceeds.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "4. Scaffold inspection and handover", hazards: "Defective scaffold handed over to users", controls: "Licensed scaffolder inspects completed scaffold before handover. Inspection tag completed and attached. Load rating marked.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "5. Dismantling", hazards: "Falls, dropped materials, structural instability", controls: "Dismantle in reverse order. Harness on anchor during dismantling. Lower materials by rope — do not throw. Barricade below.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
  ],
  substances: [],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Safety harness and lanyard (certified anchor)", "Hearing protection"],
  siteRules: ["Sign in/out every day.", "Harness on anchor when working above 3 m without edge protection.", "No free-climbing or bypassing handrails.", "Tool lanyards on all tools used at height.", "Drop zone barricaded — no bystanders below active scaffold erection.", "Report any scaffold damage or modification request to the scaffolding contractor immediately."],
  trainingItems: ["All workers hold a current scaffolding certificate appropriate to the scaffold type and height."],
  trainingRequired: ["Scaffolding certificate — Basic, Intermediate or Advanced (NZ WorkSafe recognised)", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

const bricklaying: TradeTemplate = {
  activities: "Bricklaying, blocklaying and masonry construction — including walls, piers, retaining structures, and associated mortar work.",
  hazards: [
    { hazard: "Manual handling — bricks, blocks, mortar tubs", controls: "Team lift for items over 23 kg. Mechanical aid (block grab, forklift with man cage) for bulk deliveries. Close the gap — position pallets close to work face.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Silica dust from cutting masonry (angle grinder, block saw)", controls: "Wet cutting. P2 respirator mandatory during cutting. Dust extraction on block saw. No dry cutting.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Chemical burns — cement, lime in mortar", controls: "Waterproof gloves for all mortar work. Wash hands and arms before eating. Barrier cream. Cement contact dermatitis — change wet clothing immediately.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — scaffold, walls above 1.5 m", controls: "Properly erected and tagged scaffold. Guardrails on open edges. Harness above 3 m where guardrails cannot be installed. No work off ladders above shoulder height.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Falling masonry and tools from height", controls: "Kickboards / toe boards on scaffold. Tool bags at height. Clear the drop zone. Hard hat below active work.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Set-up — materials and scaffold", hazards: "Manual handling, traffic, unstable ground", controls: "Site induction. Position pallets with forklift or crane close to work face. Scaffold erected and inspection tag in date. Cones and signs around material deliveries.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "2. Lay and cut masonry", hazards: "Silica dust, manual handling, chemical burns", controls: "Wet cutting. P2 respirator during cutting. Waterproof gloves for mortar work. Team lift for blocks over 23 kg.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Work at height on scaffold", hazards: "Falls, dropped materials", controls: "Scaffold inspected and tagged. Guardrails in place. Kickboards / toe boards installed. Hard hat below.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Cement waste, mortar spills, sharp block offcuts", controls: "Neutralise cement wash before draining (pH >11). Bag sharp offcuts. Sweep area. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Mortar / cement (wet)", state: "Wet solid", maxQty: "As required", unNumber: "N/A", hazardType: "Corrosive (wet), Respiratory hazard (dry)", storage: "Sealed bags, dry storage", segregation: "Away from food and water", controls: "Waterproof gloves. Wash hands. Change cement-wet clothing.", ppe: "Waterproof gloves, safety glasses", sdsLocation: "On site — SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Waterproof gloves (mortar work)", "P2 dust mask (cutting)", "Hearing protection (cutting)", "Knee pads"],
  siteRules: ["Sign in/out every day.", "P2 respirator on for any masonry cutting.", "Waterproof gloves for all mortar and cement work.", "Scaffold must have inspection tag in date before use.", "No dry cutting — wet methods only.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers hold a bricklaying qualification or are under direct supervision of a qualified bricklayer."],
  trainingRequired: ["Bricklaying trade qualification or apprenticeship in progress", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)", "Scaffolding certificate (where erecting scaffold)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const glazing: TradeTemplate = {
  activities: "Glazing and aluminium joinery installation — including windows, doors, curtain wall, balustrades, and glass replacement.",
  hazards: [
    { hazard: "Glass cuts — handling and breakage", controls: "Proper glass-handling gloves (leather or kevlar) at all times. Suction cups for large panels. Glass stored upright on A-frame. Dispose of broken glass in sealed rigid container — never in bags.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — large glass panels and frames", controls: "Two-person minimum for panels over 1.5 m². Vacuum cup lifters. Plan lift route before moving. Mechanical aid (glazing trolley, crane) for heavy units.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — window installation above ground floor", controls: "Scaffold or EWP. Harness on anchor above 3 m. Edge protection on open floors. Secure glass panels against wind before releasing.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Silicone / sealant fumes — solvent-based sealants", controls: "Ventilate enclosed spaces. P2 respirator in confined spaces. Keep lids on sealant cartridges when not in use.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Glass falling from height — during installation", controls: "Barricade drop zone below. Public exclusion zone. Glass suction cups with load rating checked. Communicate before lifting.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up and glass delivery", hazards: "Manual handling, traffic, glass breakage during unload", controls: "Site induction. Unload glass using trolley or vacuum lifter. Store upright on A-frame on firm ground. Drop zone barricaded.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "2. Frame and surround preparation", hazards: "Power tool cuts, dust, working at height", controls: "Safety glasses. Guards on power tools. Scaffold inspected and tagged. Harness above 3 m.", initialRisk: "Moderate", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "3. Glass placement and installation", hazards: "Glass cut, panel drop, working at height", controls: "Glazing gloves on. Suction cups — check load rating before use. Two-person minimum. Barricade below. Communicate before releasing.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Seal and clean up", hazards: "Sealant fumes, glass offcuts, sharp aluminium swarf", controls: "Ventilate. P2 in confined space. Rigid container for glass waste. Sweep aluminium swarf. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative + PPE", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Structural silicone sealant (neutral cure)", state: "Paste", maxQty: "20 cartridges", unNumber: "N/A", hazardType: "Health effects (acetic acid off-gassing)", storage: "Sealed cartridges in vehicle", segregation: "Standard", controls: "Ventilate. Cap when not in use.", ppe: "Gloves, safety glasses", sdsLocation: "On site — vehicle SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Glass-handling gloves (leather or kevlar)", "Harness and lanyard (above 3 m)", "Hearing protection"],
  siteRules: ["Sign in/out every day.", "Glass-handling gloves on at all times when handling glass.", "Suction cups load-rated for the panel being lifted.", "Drop zone barricaded below glass installation work.", "Broken glass in rigid sealed container only — never loose bags.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers hold a glazing qualification or are supervised by a qualified glazier."],
  trainingRequired: ["Glazing trade qualification or apprenticeship", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

const plastering: TradeTemplate = {
  activities: "Interior plastering and gib stopping — including stopping, sanding, texture coating, and associated surface preparation.",
  hazards: [
    { hazard: "Respirable dust from sanding and bagging", controls: "Vacuum sander (dustless system) as first preference. P2 respirator mandatory for all sanding. Seal off room. No dry sweeping.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Chemical burns from lime-based plaster and render", controls: "Waterproof gloves for mixing and applying. Wash hands and arms before eating. Eye protection when mixing. Barrier cream.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — stilts, scaffold, trestle", controls: "Stilts limited to flat and clear surfaces. Scaffold or trestle for ceilings — inspection tag in date. Harness above 3 m on scaffold. No work off ladders above shoulder height for extended periods.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Slips on wet plaster / compound spills", controls: "Drop sheets on all floor areas. Prompt clean-up of spills. No-slip footwear. Wet floor signs where applicable.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — plaster bags, compound buckets", controls: "Team lift for bags over 23 kg. Mechanical mixer — never hand-mix heavy batches. Position materials close to work face.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up and material staging", hazards: "Manual handling, dust, slips", controls: "Site induction. Position materials close to work face. Drop sheets on all floors. Waterproof gloves for cement / lime products.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "2. Apply stop and first coat", hazards: "Chemical burns, dust, working at height", controls: "Waterproof gloves and eye protection during mixing. Scaffold / trestle inspected and tagged. P2 respirator in dusty areas.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Sand and finish", hazards: "Silica / gypsum dust, working at height", controls: "Vacuum sander as first preference. P2 respirator mandatory. Seal room off to prevent dust spread. Scaffold or stilts for ceiling work.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Wet compound spills, dust, slips", controls: "Collect wet compound and bag for disposal. HEPA vacuum dry dust. Remove drop sheets. Dry floors. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Plasterboard / gypsum compound (dry)", state: "Powder", maxQty: "As required", unNumber: "N/A", hazardType: "Respiratory hazard (dust)", storage: "Dry, sealed bags", segregation: "N/A", controls: "P2 respirator during sanding. Dustless sander.", ppe: "P2 respirator, safety glasses", sdsLocation: "On site — SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest", "Safety glasses / goggles (mixing)", "P2 dust mask (sanding)", "Waterproof gloves (wet plaster)", "Knee pads", "Hearing protection"],
  siteRules: ["Sign in/out every day.", "P2 respirator on during all sanding.", "Waterproof gloves for all wet plaster and compound work.", "Scaffold must have inspection tag in date.", "No dry sweeping — HEPA vacuum or wet mop only.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers hold a plastering qualification or are working under direct supervision of a qualified plasterer."],
  trainingRequired: ["Plastering trade qualification or apprenticeship", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

const tiling: TradeTemplate = {
  activities: "Floor and wall tiling — including surface preparation, adhesive application, tile cutting, and grouting.",
  hazards: [
    { hazard: "Silica dust from tile cutting (angle grinder, wet saw)", controls: "Wet cutting preferred. Dust extraction on angle grinder. P2 respirator mandatory during cutting. No dry cutting.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Chemical burns — tile adhesive, grout, acid cleaners", controls: "Waterproof gloves for adhesive and grout work. Rubber gloves and face shield for acid cleaning. SDS on site. Eye wash available.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — tile boxes, adhesive buckets, substrate boards", controls: "Team lift for items over 23 kg. Position pallets close to work face. Knee pads for floor tiling.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Cuts from tile edges and broken tiles", controls: "Cut-resistant gloves during tile handling. Rigid container for broken tiles. Disposable tiles labelled as sharp waste.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Slips on wet adhesive, grout or tile surfaces", controls: "Wet floor signs. Non-slip footwear. Secure drop sheets. Prompt clean-up of wet adhesive and grout residue.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Surface preparation", hazards: "Dust, manual handling, chemical exposure", controls: "P2 respirator for grinding/prep dust. Waterproof gloves for primer. Team lift for substrate boards.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "2. Lay and cut tiles", hazards: "Silica dust, tile cuts, manual handling", controls: "Wet cutting. P2 respirator on during cutting. Cut-resistant gloves. Knee pads for floor work.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "3. Grout and seal", hazards: "Chemical burns (grout, acid cleaner)", controls: "Waterproof gloves. Rubber gloves and face shield for acid cleaning. Ventilate. Eye wash on site.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Wet floor (slips), sharp tile waste, adhesive fumes", controls: "Bag sharp tile waste (rigid container). Mop and dry floor. Ventilate. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Tile adhesive (polymer-modified)", state: "Paste", maxQty: "20 kg", unNumber: "N/A", hazardType: "Skin sensitiser, health effects", storage: "Sealed container in vehicle", segregation: "Away from food", controls: "Waterproof gloves. Ventilate in enclosed spaces.", ppe: "Waterproof gloves, safety glasses", sdsLocation: "On site — SDS folder", initialRisk: "Low", residualRisk: "Very Low" },
    { product: "Acid tile cleaner (muriatic / phosphoric)", state: "Liquid", maxQty: "5 L", unNumber: "UN 1789", hazardType: "Corrosive", storage: "Sealed, upright, in vehicle", segregation: "Away from alkalines", controls: "Use diluted. Never add water to acid. Ventilate. Spill kit on site.", ppe: "Rubber gloves, face shield, apron", sdsLocation: "On site — SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Safety glasses", "Cut-resistant gloves (tile handling)", "Waterproof gloves (adhesive / grout)", "P2 dust mask (cutting)", "Rubber gloves and face shield (acid cleaning)", "Knee pads"],
  siteRules: ["Sign in/out every day.", "P2 respirator on for all tile cutting.", "Wet cutting only — no dry grinding of tiles.", "Waterproof gloves for all adhesive and grout work.", "Broken tiles in rigid sealed container.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers hold a tiling qualification or are supervised by a qualified tiler."],
  trainingRequired: ["Tiling trade qualification or apprenticeship", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const insulation: TradeTemplate = {
  activities: "Insulation installation — including glasswool, polyester, rigid foam, and reflective foil insulation in walls, ceilings and underfloor.",
  hazards: [
    { hazard: "Respiratory and skin irritation — glasswool / mineral wool fibres", controls: "P2 respirator for all glasswool handling. Long sleeves and gloves — glasswool fibres cause skin irritation. Change and wash work clothes separately. Wash hands and arms before eating.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Confined spaces — roof spaces, sub-floor", controls: "Ventilate before entry. Check for gases (CO in roof with gas water heater). Ensure two-way comms with standby person. No entry if temperature exceeds safe limits.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — ceiling batts, roof space", controls: "Stable, inspected access platform or scaffold for high ceiling work. Harness above 3 m where edge protection is unavailable. Roof rafters — use a supported plank, not the ceiling plasterboard.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in roof space of pre-2000 buildings", controls: "Assume asbestos around old pipe lagging, loose fill, and building materials in roof space of pre-2000 buildings. Stop work if suspected. Notify PCBU 1.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical wiring in roof / wall cavities", controls: "Do not disturb or cover junction boxes. Keep insulation 25 mm clear of recessed downlights unless LED approved for insulation contact (check rating). Do not cover distribution boards.", initialRisk: "High", controlLevel: "Administrative + Engineering", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Inspect area and confirm services", hazards: "Asbestos, live wiring, unknown roof space condition", controls: "Visual inspection from hatch before entry. Confirm no asbestos lagging or loose fill. Identify all live wiring and downlights. Ventilate roof space for 10 min before entry.", initialRisk: "High", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "2. Install insulation — ceiling / wall / underfloor", hazards: "Glasswool irritation, confined space, working at height", controls: "P2 respirator, long sleeves and gloves for glasswool. Supported plank in roof space — not on plasterboard. Standby person for sub-floor or confined roof space.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "3. Ensure clear zones around hazards", hazards: "Fire from insulation over downlights or junction boxes", controls: "Keep 25 mm clear of recessed lights unless IC-rated. Never cover junction boxes or distribution boards.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "4. Clean up & sign off", hazards: "Glasswool fibres on skin, trip hazards, debris", controls: "Wash hands and arms. Change work clothes. Remove leftover offcuts. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Glasswool / mineral wool insulation", state: "Solid (fibrous)", maxQty: "As required", unNumber: "N/A", hazardType: "Respiratory and skin irritant", storage: "Dry, wrapped in packaging", segregation: "N/A", controls: "P2 respirator. Long sleeves and gloves. Wash hands.", ppe: "P2 respirator, safety glasses, long sleeves, gloves", sdsLocation: "On site — SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest (where on site)", "Safety glasses", "P2 dust mask / respirator (glasswool)", "Long-sleeved work shirt and long pants (glasswool)", "Gloves (glasswool)", "Knee pads (sub-floor work)"],
  siteRules: ["Sign in/out every day.", "P2 respirator on for all glasswool installation.", "Long sleeves and gloves — no bare skin contact with glasswool.", "Check for asbestos before entering roof space of pre-2000 buildings.", "Keep 25 mm clearance around recessed lights unless IC-rated.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers trained in insulation installation and product-specific hazards."],
  trainingRequired: ["Insulation installer competency or on-the-job training", "Asbestos awareness training", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

const hvac: TradeTemplate = {
  activities: "HVAC and refrigeration installation, commissioning and maintenance — including ducting, pipework, refrigerant handling, electrical connections and working at height.",
  hazards: [
    { hazard: "Refrigerant release — skin / eye freeze burns, asphyxiation in confined spaces", controls: "Refrigerant handler certification (NZ EPA). Recovery unit on site — never vent to atmosphere. Full face shield and cryo-gloves for refrigerant handling. Ventilate enclosed plant rooms.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical — live AC connections, power to compressors", controls: "Licensed electrician for final electrical connections. LOTO before working on electrical components. Test for dead before touching.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — roof-mounted units, ceiling space, EWP", controls: "EWP licensed operator. Harness on anchor above 3 m. Edge protection on roof. Inspect ladder before use.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — heavy condensing units, AHUs", controls: "Mechanical lift (crane, telehandler) for units over 23 kg. Two-person lift minimum. Plan lift route before moving. Rigging by competent rigger.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Confined spaces — ceiling voids, plant rooms", controls: "Confined space permit. Gas test (O2, CO2, refrigerant). Standby person. Two-way comms. Trained entrant only.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site set-up and isolation", hazards: "Live electrical, refrigerant leaks, manual handling", controls: "Site induction. LOTO on electrical panel. Identify existing refrigerant systems. Two-person team for heavy units.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Install ducting, pipework and equipment", hazards: "Manual handling, working at height, cuts from sheet metal", controls: "Crane or telehandler for heavy units. EWP or scaffold for ceiling/roof work. Gloves for sheet metal duct handling. Harness above 3 m.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Refrigerant handling — charge and recover", hazards: "Refrigerant release, freeze burns", controls: "Certified refrigerant handler only. Recovery unit on site. Cryo-gloves and full face shield. Ventilate.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Electrical connections and commissioning", hazards: "Live circuits, re-energising, incorrect connection", controls: "Licensed electrician for electrical work. Test in sequence. Communicate before re-energising. Trained commissioning tech only.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "5. Clean up & sign off", hazards: "Refrigerant waste, tool trip hazards, uncommissioned systems", controls: "Recovery cylinder logged. All electrical covers replaced. Sign out with PCBU 1. Handover documentation to client.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Refrigerant (R410A / R32 / R134a)", state: "Liquefied gas", maxQty: "As required for job", unNumber: "UN 3337 / UN 3163", hazardType: "Compressed gas, health effects (asphyxiant), cryogenic", storage: "Certified cylinder, upright, secured, ventilated area", segregation: "Away from heat and ignition", controls: "Certified handler only. Recovery unit. No venting. Ventilate enclosed spaces.", ppe: "Cryo-gloves, full face shield", sdsLocation: "On site — SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat (where required)", "Safety glasses", "Gloves (general)", "Cryo-gloves and face shield (refrigerant handling)", "Hearing protection", "Harness and lanyard (above 3 m)"],
  siteRules: ["Sign in/out every day.", "NZ EPA refrigerant handler certification required for all refrigerant work.", "LOTO before any electrical work.", "Recovery unit on site — no venting of refrigerant.", "Harness on anchor above 3 m without edge protection.", "Report any refrigerant leak or electrical fault immediately."],
  trainingItems: ["All workers hold appropriate HVAC/R qualification and NZ EPA refrigerant handler certification."],
  trainingRequired: ["NZ Certificate in Refrigeration and Air Conditioning or equivalent", "NZ EPA refrigerant handler certification", "Licensed electrician (or supervised by one) for electrical connections", "EWP operator certificate (where EWP is used)", "Confined Space Entry certificate (where applicable)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const fire_protection: TradeTemplate = {
  activities: "Fire protection system installation and maintenance — including sprinkler systems, fire suppression, fire alarm, detection, and passive fire protection.",
  hazards: [
    { hazard: "Working at height — ceiling space, plant rooms, scaffold", controls: "Scaffold or EWP for overhead work. Harness on anchor above 3 m. Edge protection on open areas. Inspect ladder before use.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Accidental sprinkler activation — water damage, fall risk", controls: "Isolate system section before work. Confirm isolation with building manager. Cap open sprinkler heads. Never use heat near unprotected heads.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Pressure testing — high pressure water / nitrogen", controls: "Test to design specification only. Stand clear of fittings under test. Use calibrated test gauge. No bystanders in test zone.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Electrical — fire alarm panel connections, live circuits", controls: "Licensed electrician for electrical connections. LOTO before working on panels. Test for dead before touching.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Fire suppressant chemicals (CO2, FM200, AFFF foam)", controls: "SDS on site. Nitrile gloves. Eye protection. Ensure building occupants are evacuated during discharge testing. Ventilate after test.", initialRisk: "High", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Isolate system and set up", hazards: "Accidental activation, live electrical, working at height", controls: "Confirm isolation with building manager and sprinkler installer (NZ Fire record). LOTO on electrical. Site induction complete.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Install pipework, heads and detection devices", hazards: "Working at height, manual handling, cutting swarf", controls: "Scaffold / EWP for overhead. Harness above 3 m. Eye protection for pipe cutting. Team lift for long pipe sections.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Pressure test", hazards: "High pressure water / nitrogen, fitting failure", controls: "Test to spec. Stand clear. Calibrated gauge. No bystanders in test zone. Record and sign off test results.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "4. Commission and handover", hazards: "Alarm activation, electrical, suppressant discharge", controls: "Notify building manager before commissioning. Evacuate affected areas for suppressant tests. Licensed electrician for alarm panel. Record and sign off.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "5. Clean up & sign off", hazards: "Water on floors (slips), pipe offcuts, sharp fittings", controls: "Mop and dry wet areas. Bag offcuts. Remove tools. Sign out with PCBU 1. Leave as-built drawings with building manager.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "AFFF foam concentrate", state: "Liquid", maxQty: "5 L", unNumber: "N/A", hazardType: "Health and environmental effects (PFAS-free variants preferred)", storage: "Sealed container in vehicle", segregation: "Away from food", controls: "Nitrile gloves. Eye protection. Dispose of waste per local council.", ppe: "Nitrile gloves, safety glasses", sdsLocation: "On site — SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Harness and lanyard (above 3 m)", "Hearing protection"],
  siteRules: ["Sign in/out every day.", "Isolate sprinkler system and confirm with building manager before work.", "LOTO on all electrical panels before working.", "Harness on anchor above 3 m without edge protection.", "No heat source near unprotected sprinkler heads.", "Report any accidental activation or fault immediately."],
  trainingItems: ["All workers trained and competent in fire protection installation per NZ Fire industry standards."],
  trainingRequired: ["NZ Fire (formerly Fire Protection Association NZ) recognised installer training", "Licensed electrician for electrical connections", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)", "EWP operator certificate (where EWP is used)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const security: TradeTemplate = {
  activities: "Security system installation — including alarms, access control, CCTV, intercoms, and associated cabling and commissioning.",
  hazards: [
    { hazard: "Working at height — CCTV cameras, cable runs in ceiling space", controls: "Stable ladder or EWP. Harness on anchor above 3 m. Three points of contact on ladder. No over-reaching.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Electric shock — mains connection points, live cable tray", controls: "LOTO before working in live cable trays. Test for dead before cutting. Licensed electrician for mains connections.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Pulling cable — manual handling, repetitive strain", controls: "Cable drum on stand. Cable lubricant in conduit. Team effort for long runs. Rest breaks to reduce repetitive strain.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Asbestos in ceiling space of pre-2000 buildings", controls: "Assume asbestos in pre-2000 buildings. Stop work if suspected. Notify PCBU 1. P2 respirator in older ceiling spaces.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site survey and cable route planning", hazards: "Asbestos, live cable trays, unknown ceiling space", controls: "Confirm building age. Assume asbestos pre-2000. Identify live cable routes. Site induction complete.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "2. Cable installation", hazards: "Working at height, manual handling, electrical exposure", controls: "Stable ladder or EWP. LOTO on live trays. Cable drum on stand. Gloves and eye protection for core stripping.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Device installation (cameras, sensors, panels)", hazards: "Working at height, drilling dust, electrical connections", controls: "Harness above 3 m. P2 respirator for drilling into concrete/masonry. Licensed electrician for mains power connections.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Commission and test", hazards: "Live electrical, alarm activation", controls: "Notify building occupants before alarm testing. Test in sequence. Licensed electrician signs off mains connections.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
    { step: "5. Clean up & sign off", hazards: "Cable offcuts, drill dust, open penetrations", controls: "Fire stop all cable penetrations through fire-rated walls. Bag cable offcuts. Vacuum drill dust. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat (where required)", "Safety glasses", "Gloves", "P2 dust mask (drilling into concrete / masonry)", "Harness and lanyard (above 3 m)"],
  siteRules: ["Sign in/out every day.", "LOTO on live cable trays before any work.", "Harness on anchor above 3 m without edge protection.", "Assume asbestos in pre-2000 buildings.", "Fire-stop all cable penetrations before leaving site.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers appropriately trained in low-voltage security systems installation."],
  trainingRequired: ["Security installation competency or industry training (e.g. NZSA recognised)", "Licensed electrician (or supervised) for mains connections", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: false,
  hazardousSubstancesOnSite: false,
};

const landscaping: TradeTemplate = {
  activities: "Landscaping and grounds maintenance — including mowing, trimming, planting, irrigation, paving, retaining walls, and the use of ride-on and hand-held machinery.",
  hazards: [
    { hazard: "Ride-on mower and machinery — struck by, rollover on slopes", controls: "Operator training and competency. ROPS fitted and in good condition. No passengers. Assess slope before mowing — manual mow or weed-eat steep slopes. Never mow across a slope above safe angle.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Flying debris — mower, line trimmer, chipper", controls: "Bystanders clear of machine by at least 15 m. Eye protection mandatory. Clear area of rocks and debris before mowing. Solid deck guards in place.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Chemical exposure — herbicides, pesticides, fertilisers", controls: "SDS on site. Mix and apply per label. PPE as per SDS. Do not spray in wind above 15 km/h. Wash hands before eating.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — pavers, sleepers, rocks, bags of aggregate", controls: "Mechanical lift (mini-excavator, pallet jack) where possible. Team lift for items over 23 kg. Split heavy bags before lifting.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Sun exposure, heat stress — outdoor work", controls: "Hat, sunscreen SPF50+, UV-protective clothing. Schedule heavy work for cooler parts of the day. Adequate drinking water on site. Buddy system in extreme heat.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site inspection and machinery check", hazards: "Hidden hazards (rocks, pipes, irrigation), machinery faults", controls: "Walk site before mowing. Check for rocks, holes, irrigation heads and children's toys. Pre-start check on all machinery.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "2. Mowing and trimming", hazards: "Flying debris, rollover, noise, vibration", controls: "Bystanders 15 m clear. Mow parallel to slope (not across). Eye protection. Hearing protection (Class 5). Check deck guards.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "3. Chemical application (herbicide / fertiliser)", hazards: "Skin / eye contact, inhalation, drift onto bystanders", controls: "Read SDS. Mix per label. Spray in calm conditions. PPE per SDS label. Wash hands before eating.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "4. Hard landscaping (paving, retaining)", hazards: "Manual handling, dust, concrete/lime burns", controls: "Mechanical aid for heavy items. Team lift. P2 respirator for cutting pavers. Waterproof gloves for mortar.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "5. Clean up & sign off", hazards: "Chemical waste, sharp garden waste, machinery left running", controls: "Dispose of chemical waste per label. Engine off and keys out before leaving machinery unattended. Bag green waste per site requirements. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Herbicide (e.g. glyphosate, 2,4-D)", state: "Liquid concentrate", maxQty: "5 L", unNumber: "Varies by product", hazardType: "Health effects, eco-toxic", storage: "Sealed container in vehicle, locked", segregation: "Away from food, water", controls: "Mix per label. Spray in calm conditions. Wash hands.", ppe: "Nitrile gloves, safety glasses, long sleeves", sdsLocation: "On site — vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Petrol (mower, trimmer, blower)", state: "Liquid", maxQty: "20 L", unNumber: "UN 1203", hazardType: "Flammable, Toxic, Eco-toxic", storage: "Approved jerry can in vehicle", segregation: "Away from ignition and oxidisers", controls: "No refuelling near ignition. Spill kit in vehicle.", ppe: "Gloves, safety glasses", sdsLocation: "On site — vehicle SDS folder", initialRisk: "High", residualRisk: "Moderate" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (road or public areas)", "Safety glasses", "Hearing protection (Class 5 — machinery)", "Nitrile gloves (chemical handling)", "Sun hat and sunscreen SPF50+", "P2 dust mask (paver / concrete cutting)"],
  siteRules: ["Sign in/out every day.", "Walk site before mowing — clear rocks and debris.", "Bystanders 15 m clear of mowing and trimming.", "Read SDS before mixing or applying any chemical.", "No refuelling with engine running.", "Report any near miss or incident immediately."],
  trainingItems: ["All workers trained and competent in the operation of all machinery and equipment used."],
  trainingRequired: ["Horticulture / landscaping qualification or competency", "Approved handler certificate (where handling agrichemicals requiring ACVM registration)", "Chainsaw certificate (where chainsaws are used)", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically vehicle / site entrance.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const cleaning: TradeTemplate = {
  activities: "Commercial cleaning — including internal office, industrial and high-rise cleaning, window cleaning, pressure washing, and chemical cleaning.",
  hazards: [
    { hazard: "Chemical exposure — cleaning agents, disinfectants, degreasers", controls: "SDS on site for every product used. Mix per label — never mix bleach and acid. Nitrile gloves and eye protection for all chemical handling. Ventilate enclosed spaces.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Slips on wet floors", controls: "Wet floor signs placed before mopping. Work section by section — leave dry path. Non-slip footwear. Notify building occupants.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — window cleaning, EWP, ladders", controls: "Licensed EWP operator. Harness on anchor above 3 m. Abseil window cleaning — competency and harness inspection. Inspect ladder before use — three points of contact.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Biological hazards — blood spills, sharps, mould", controls: "Sharps in rigid sharps container — never in bags. Double-bag biological waste. Nitrile gloves and face shield for blood spills. Notify building manager of sharps finds.", initialRisk: "High", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Manual handling — laundry, waste bins, equipment", controls: "Trolley for waste bins and laundry bags. Never overfill bins above head height. Team lift for heavy items.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Chemical check and site set-up", hazards: "Chemical exposure, wrong product selection", controls: "Check SDS before using any product. Correct dilution per label. Wet floor signs ready. PPE donned before starting.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "2. Clean internal areas", hazards: "Slip on wet floor, chemical exposure, biological hazard", controls: "Wet floor signs. Section by section. Nitrile gloves and eye protection. Ventilate. Sharps in rigid container.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "3. Window and high-level cleaning", hazards: "Falls, dropped tools, chemical splash to eyes", controls: "Licensed EWP operator. Harness on anchor. Spotter below. Eye protection for spray cleaning.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low" },
    { step: "4. Waste removal", hazards: "Sharps, biological waste, heavy bins", controls: "Trolley for bins. Never reach blind into waste. Sharps in rigid container. Double-bag biological. Wash hands after waste handling.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "5. Sign off", hazards: "Chemical residue, wet floors, equipment left on", controls: "Remove wet floor signs only when dry. Secure chemicals in vehicle. Equipment off and stored. Sign out with PCBU 1.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Bleach / sodium hypochlorite", state: "Liquid", maxQty: "5 L", unNumber: "UN 1791", hazardType: "Corrosive, health effects", storage: "Sealed container, cool, dark", segregation: "NEVER mix with acid or ammonia", controls: "Dilute per label. Ventilate. Never mix with acid. Gloves and eye protection.", ppe: "Nitrile gloves, safety glasses", sdsLocation: "On site — vehicle SDS folder", initialRisk: "Moderate", residualRisk: "Low" },
    { product: "Acid cleaner (descaler — phosphoric / hydrochloric)", state: "Liquid", maxQty: "2 L", unNumber: "UN 1789", hazardType: "Corrosive", storage: "Sealed, upright, separate from alkalines", segregation: "NEVER mix with bleach", controls: "Dilute per label. Ventilate. Rubber gloves and face shield. Eye wash on site.", ppe: "Rubber gloves, face shield, apron", sdsLocation: "On site — vehicle SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Non-slip safety boots or footwear", "Hi-viz vest (external / public areas)", "Nitrile gloves (chemical work)", "Rubber gloves and face shield (acid cleaning)", "Safety glasses / goggles", "P2 respirator (mould remediation)", "Harness and lanyard (above 3 m external)"],
  siteRules: ["Sign in/out every day.", "Read SDS before using any cleaning chemical — never mix bleach with acid.", "Wet floor signs in place before mopping — remove only when dry.", "Sharps in rigid container — never in rubbish bags.", "Harness on anchor for any external height cleaning above 3 m.", "Report any needle-stick or biological exposure immediately."],
  trainingItems: ["All workers trained in cleaning chemical safety and product SDS requirements."],
  trainingRequired: ["Commercial cleaning training or employer induction", "Approved handler certificate (where using registered agrichemicals)", "EWP operator certificate (where EWP used for window cleaning)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically building reception or car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const welding: TradeTemplate = {
  activities: "Welding and fabrication — including MIG, TIG, stick (MMAW), and oxy-acetylene welding, cutting, and associated metal fabrication.",
  hazards: [
    { hazard: "Welding fumes — metal fume fever, chronic lung disease", controls: "Local exhaust ventilation (LEV) as first preference. Forced ventilation in enclosed spaces. P3 / OV-P3 half-face respirator where ventilation is insufficient. No welding on galvanised or coated metals without LEV and P3 respirator.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Arc radiation (UV / IR) — arc eye, skin burns", controls: "Welding curtains or screens to protect bystanders. Correct shade-rated auto-darkening helmet (shade 9–13 for MIG/TIG, shade 8–12 for stick). Long sleeves and leather gloves — no bare skin exposed.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Fire and explosion — sparks igniting flammable material", controls: "Fire watch for 30 minutes after welding. Remove or shield flammable materials within 10 m. Fire extinguisher immediately accessible. Hot work permit where required.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Oxy-acetylene — gas cylinder fire, explosion, regulator failure", controls: "Cylinders chained upright. Flashback arrestors on hoses. Never grease oxygen regulators. Check hoses for damage before use. No smoking within 5 m of cylinders.", initialRisk: "High", controlLevel: "Engineering + Administrative", residualRisk: "Low", toolbox: true },
    { hazard: "Electric shock — welding plant, cables, wet conditions", controls: "Insulated electrode holders and leads. Inspect leads before use. No welding in rain. GFCI / RCD on mains supply. Dry gloves.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Angle grinding — disc fragmentation, cuts, sparks", controls: "Correct disc for task — never use cutting disc for grinding. Inspect disc before use — no cracks. Guard in place. Eye protection (grinding face shield). Stand to the side of the disc plane.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Hot work permit and area set-up", hazards: "Fire, explosion, bystander arc radiation", controls: "Hot work permit obtained where required. Flammable materials removed or shielded within 10 m. Welding screens placed. Fire extinguisher accessible.", initialRisk: "High", controlLevel: "Isolation + Administrative", residualRisk: "Low" },
    { step: "2. Set up welding equipment", hazards: "Electrical, gas cylinder, hose failure", controls: "Inspect leads and hoses. Cylinders chained upright. Flashback arrestors on oxy-acetylene. GFCI on mains supply. Insulated electrode holder.", initialRisk: "Moderate", controlLevel: "Engineering + Administrative", residualRisk: "Low" },
    { step: "3. Weld and cut", hazards: "Arc radiation, fumes, fire, electric shock", controls: "Correct shade helmet. Long sleeves and leather gloves. LEV running. P3 respirator in enclosed spaces. No bare skin exposed. Fire watch.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Angle grind and finish", hazards: "Disc fragmentation, sparks, cuts, noise", controls: "Correct disc for task. Inspect disc — no cracks. Guard on. Face shield and eye protection. Stand to side of disc plane. Hearing protection.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "5. Fire watch and sign off", hazards: "Smouldering materials, hot metal not labelled", controls: "30-minute fire watch after welding completed. Label hot metal. Remove welding screens. Turn off gas cylinders at valve. Sign out with PCBU 1.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
  ],
  substances: [
    { product: "Acetylene gas cylinder", state: "Compressed gas (dissolved)", maxQty: "1 x G3 cylinder", unNumber: "UN 1001", hazardType: "Flammable gas, explosive", storage: "Upright, chained, segregated from oxygen, outdoors or ventilated store", segregation: "2 m from oxygen — or by 30-min fire-rated wall", controls: "Flashback arrestors. No smoking within 5 m. Valve closed when not in use.", ppe: "Gloves, face shield", sdsLocation: "On site — SDS folder", initialRisk: "High", residualRisk: "Low" },
    { product: "Oxygen gas cylinder", state: "Compressed gas", maxQty: "1 x G2 cylinder", unNumber: "UN 1072", hazardType: "Oxidising — accelerates combustion", storage: "Upright, chained, segregated from flammables and acetylene", segregation: "2 m from acetylene", controls: "Never grease oxygen fittings. Valve closed when not in use.", ppe: "Gloves, face shield", sdsLocation: "On site — SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (site areas)", "Auto-darkening welding helmet (correct shade for process)", "Leather welding gloves", "Long-sleeved flame-resistant work shirt", "Safety glasses (under helmet for grind and chipping)", "Leather / flame-resistant apron", "P3 respirator (fumes in confined / poorly ventilated spaces)", "Hearing protection (grinding)"],
  siteRules: ["Sign in/out every day.", "Hot work permit obtained before any welding on site.", "30-minute fire watch after welding — no exceptions.", "Welding screens up before striking arc — protect bystanders.", "LEV or forced ventilation on before welding in any enclosed space.", "Cylinders chained upright at all times. No grease on oxygen fittings."],
  trainingItems: ["All workers hold a welding qualification or are supervised by a certified welder."],
  trainingRequired: ["NZQA welding qualification or industry competency (NZWC recognised)", "Hot work permit training", "White Card (General Construction Induction, where required)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / car park area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

const pest_control: TradeTemplate = {
  activities: "Pest control services — including rodent baiting, insect treatment, fumigation, bird management, and associated chemical application.",
  hazards: [
    { hazard: "Pesticide / chemical exposure — inhalation, skin and eye contact", controls: "Read SDS before use. PPE as per SDS and HSNO regulations. Mix and apply per label only. Wash hands and face before eating. Change contaminated clothing immediately.", initialRisk: "High", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Confined spaces — roof voids, sub-floors, wall cavities", controls: "Confined space permit for enclosed void entry. Test atmosphere before entry. Standby person with two-way comms. Never work alone in a confined space.", initialRisk: "High", controlLevel: "Isolation + Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Working at height — roof baiting, bird netting", controls: "Harness on anchor above 3 m. Ladder inspected before use — three points of contact. EWP for elevated external work. Never lean out from a ladder with both hands occupied.", initialRisk: "High", controlLevel: "Engineering + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Biological hazard — rodent droppings, carcasses, mites", controls: "Nitrile gloves when handling bait stations and rodent carcasses. P2 respirator in infested roof spaces. Double-bag carcasses. Wash hands after handling.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
    { hazard: "Spray drift — non-target species, bystanders", controls: "Do not spray in wind above 15 km/h. Cordon off spray area. Notify occupants before treatment. Use directed spray nozzles.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low", toolbox: true },
  ],
  taskSteps: [
    { step: "1. Site inspection and planning", hazards: "Unknown spaces, chemical selection, bystander risk", controls: "Inspect site before treatment. Identify confined spaces and height risks. Select correct chemical per pest and label. Notify occupants.", initialRisk: "Moderate", controlLevel: "Administrative", residualRisk: "Low" },
    { step: "2. Prepare and mix chemicals", hazards: "Skin / eye contact during mixing", controls: "Read SDS. Mix per label rate. Full PPE before opening chemical containers. Do not overfill spray tank.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "3. Apply treatment", hazards: "Chemical exposure, spray drift, confined space, working at height", controls: "PPE per SDS. Wind check for outdoor spray. Cordon off area. Confined space permit for void entry. Harness above 3 m.", initialRisk: "High", controlLevel: "Engineering + Administrative + PPE", residualRisk: "Low" },
    { step: "4. Install or check bait stations", hazards: "Rodent carcasses, biological contamination, confined space", controls: "Nitrile gloves. P2 respirator in infested spaces. Double-bag carcasses. Wash hands after.", initialRisk: "Moderate", controlLevel: "Administrative + PPE", residualRisk: "Low" },
    { step: "5. Clean up and sign off", hazards: "Chemical waste disposal, contaminated PPE, residual treatment", controls: "Triple-rinse spray tank. Dispose of chemical waste per label and local council requirements. Remove contaminated PPE carefully. Sign out with PCBU 1 and leave service report.", initialRisk: "Low", controlLevel: "Administrative", residualRisk: "Very Low" },
  ],
  substances: [
    { product: "Insecticide / rodenticide (specific product varies)", state: "Liquid or solid bait", maxQty: "As required for job", unNumber: "Varies by product", hazardType: "Toxic (health and environmental), eco-toxic", storage: "Locked cabinet in vehicle, per label", segregation: "Away from food, food packaging, children", controls: "Apply per label. PPE per SDS. Wash hands. Secure bait stations.", ppe: "Nitrile gloves, safety glasses, P2 respirator (confined space)", sdsLocation: "On site — vehicle SDS folder", initialRisk: "High", residualRisk: "Low" },
  ],
  ppeRequired: ["Safety boots", "Hi-viz vest (site / public areas)", "Nitrile gloves", "Safety glasses / goggles", "P2 respirator (confined space, infested areas)", "Tyvek overalls (fumigation or heavily infested areas)", "Harness and lanyard (roof / height access)"],
  siteRules: ["Sign in/out every day.", "Read SDS and label before using any chemical — apply only per label rate.", "Notify building occupants before treatment.", "Never work alone in a confined space.", "Harness on anchor above 3 m.", "Report any chemical spill, exposure or near miss immediately."],
  trainingItems: ["All workers hold a current Approved Handler Certificate for the controlled substances being used."],
  trainingRequired: ["Approved Handler Certificate (HSNO controlled substances)", "Pest management qualification or industry training (e.g. NZPMA)", "Confined Space Entry certificate (where applicable)", "First Aid Certificate (within 2 years)", "Working at Heights (where applicable)"],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front gate / vehicle / building reception.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ───────────────────────────────────────────────────────────────────────────
// Lookup
// ───────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, TradeTemplate> = {
  electrical,
  plumbing,
  gas_fitting: plumbing,
  drainage: plumbing,
  carpentry,
  roofing,
  painting,
  concrete_grinding,
  concrete_laying: concrete_grinding,
  line_marking,
  asphalt: line_marking,
  civil,
  demolition,
  scaffolding,
  bricklaying,
  glazing,
  plastering,
  tiling,
  insulation,
  hvac,
  fire_protection,
  security,
  landscaping,
  cleaning,
  welding,
  pest_control,
  general,
};

/**
 * Get the starter template for a given trade key. Returns the `general`
 * template if the trade isn't recognised — better to seed with something
 * than nothing.
 */
export function getTradeTemplate(tradeKey: string | null | undefined): TradeTemplate {
  if (!tradeKey) return general;
  return TEMPLATES[tradeKey] ?? general;
}
