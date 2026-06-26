/**
 * Trade-specific starter templates for new JHAs — US market version.
 *
 * Terminology: JHA = Job Hazard Analysis (replaces NZ "SSSP")
 *              JSA = Job Safety Analysis (replaces NZ "SWMS")
 *              General Contractor (GC) = replaces NZ "PCBU 1"
 *              Subcontractor = replaces NZ "PCBU 2"
 *              OSHA 29 CFR 1926 (construction) / 1910 (general industry)
 *              Units: lbs (not kg), feet (not metres)
 *              Emergency: 911 (not 111)
 *
 * When a contractor creates their first JHA we seed it with the matching
 * trade preset. They review and edit on job 1 — from then on the
 * sticky-field mechanism carries their customised version forward.
 *
 * Keys here MUST match the JhaData type in artifacts/safeiq/src/pages/jha/detail.tsx.
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

// ─────────────────────────────────────────────────────────────────────────────
// Common building blocks used across all trades
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_EMERGENCY_CONTACTS = [
  { name: "Emergency services", role: "Fire / Ambulance / Police", phone: "911" },
  { name: "OSHA", role: "Serious injuries / fatalities (report within 8–24 hrs)", phone: "1-800-321-6742" },
  { name: "Poison Control", role: "Chemical exposure", phone: "1-800-222-1222" },
];

const STANDARD_EMERGENCY_PROCEDURES =
  "1) Stop work and make the area safe.\n" +
  "2) Call 911 for serious injury, fire, or major chemical spill.\n" +
  "3) Notify the General Contractor (GC) / site supervisor immediately.\n" +
  "4) Administer first aid as required — do not move casualty unless immediate danger.\n" +
  "5) OSHA reporting: fatalities within 8 hours; hospitalizations, amputations, or eye loss within 24 hours. Call 1-800-321-6742.\n" +
  "6) Preserve scene for investigation. Record incident in the Site Incident & Injury Register.";

const STANDARD_INDUCTION =
  "Every worker signs the JHA sign-on sheet before work begins. Site induction completed with GC / site supervisor on arrival. Daily pre-start briefing covers hazards specific to that day's work area, weather, and any site changes since last visit.";

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICAL
// ─────────────────────────────────────────────────────────────────────────────

const electrical: TradeTemplate = {
  activities:
    "Electrical installation, fault-finding, maintenance, and testing — including wiring, panels, and connected equipment. Work subject to OSHA 29 CFR 1910 Subpart S and 29 CFR 1926 Subpart K.",
  hazards: [
    {
      hazard: "Electric shock / electrocution from live conductors",
      controls:
        "Lockout / Tagout (LOTO) per OSHA 29 CFR 1910.147 before work. Test before touch (live → dead → live). Insulated tools and gloves (Class 0 min for LV). Treat all circuits as live until proven dead.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Arc flash / arc blast",
      controls:
        "Isolate before opening panels. Arc-rated PPE (NFPA 70E compliant) for live work. Maintain safe approach distances per NFPA 70E Table. Licensed electrician only.",
      initialRisk: "High",
      controlLevel: "Isolation + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Damaged extension cords / power leads",
      controls:
        "Visual check before each use. GFCI protection on all temporary power. Replace any cords with cuts, exposed wire, or damaged plugs immediately.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Working at height — ladders, mezzanines, above ceiling",
      controls:
        "Inspect ladder before use. Three points of contact. Fall protection above 6 ft (OSHA 29 CFR 1926.502). Ladder secured at top where possible.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Manual handling — cable reels, switchgear, panels",
      controls:
        "Two-person lift over 50 lbs. Hand truck / dolly where possible. Cable jacks for large reels.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Power tools — cuts, kickback, eye injury",
      controls:
        "Guards in place. GFCI on every cord. Safety glasses at all times. Trained operator only.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Asbestos in older buildings (pre-1980)",
      controls:
        "Assume asbestos present in pre-1980 buildings. Stop work if disturbed. Notify GC. Engage EPA/state-licensed abatement contractor if confirmed. Do not disturb.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Confined spaces — attics, crawlspaces, vaults",
      controls:
        "Permit-required confined space entry per OSHA 29 CFR 1910.146. Atmospheric test before entry. Standby attendant. Two-way communication. Trained entrant only.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site arrival & LOTO",
      hazards: "Live circuits, unknown site conditions",
      controls:
        "Site induction / sign in with GC. Identify circuit, isolate at source, apply Lockout/Tagout. Test for dead before touching (test-prove-test).",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative",
      residualRisk: "Low",
    },
    {
      step: "2. Install / fault-find",
      hazards: "Electric shock, working at height, dust, cuts",
      controls:
        "Treat circuits as live until proven dead. Insulated tools. Safety glasses. GFCI on all leads. Inspect ladder before use.",
      initialRisk: "High",
      controlLevel: "Isolation + Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Test & energize",
      hazards: "Re-energizing, live testing",
      controls:
        "Licensed electrician only. Calibrated test equipment. Test in correct sequence per NFPA 70. Communicate clearly before energizing.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up & sign off",
      hazards: "Trips, leftover offcuts, exposed terminals",
      controls:
        "Sweep area. Cover/seal any exposed terminals. Tools to vehicle. Sign out with GC. Provide permit / certificate where required by AHJ.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "Contact cleaner (aerosol)",
      state: "Aerosol",
      maxQty: "2 cans",
      unNumber: "UN 1950",
      hazardType: "Flammable, Health effects",
      storage: "In vehicle, upright, away from ignition",
      segregation: "Away from oxidizers",
      controls: "Use in well-ventilated area. No open flames.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
    {
      product: "Battery acid (UPS / standby batteries)",
      state: "Liquid",
      maxQty: "As installed",
      unNumber: "UN 2796",
      hazardType: "Corrosive",
      storage: "N/A — contained within equipment",
      segregation: "Away from food and combustibles",
      controls: "Spill kit on hand. Neutralizer (baking soda) available.",
      ppe: "Chemical-resistant gloves, face shield, apron",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413 EH-rated)",
    "High-visibility vest on construction sites",
    "Hard hat (ANSI Z89.1) where required",
    "Safety glasses (ANSI Z87.1)",
    "Insulated gloves (Class 0 minimum for low voltage)",
    "Hearing protection (NRR 25+) around loud equipment",
    "Arc-rated PPE (NFPA 70E) for live panel work",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Lockout/Tagout before any work on circuits — no exceptions.",
    "Test before touch — always.",
    "GFCI on every cord, every job.",
    "Safety glasses on whenever using power tools.",
    "Pre-1980 building? Treat as asbestos present until confirmed otherwise.",
    "Report any near miss, shock, or incident to GC immediately.",
  ],
  trainingItems: ["All workers hold current state electrical license appropriate to the scope of work."],
  trainingRequired: [
    "State electrical license (journeyman or master, as applicable)",
    "OSHA 10-Hour Construction (recommended) or OSHA 30-Hour",
    "NFPA 70E Arc Flash Awareness",
    "First Aid / CPR (within 2 years)",
    "Confined Space Entry (where applicable)",
    "Working at Heights / Fall Protection (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// PLUMBING
// ─────────────────────────────────────────────────────────────────────────────

const plumbing: TradeTemplate = {
  activities:
    "Plumbing installation and maintenance — hot/cold water, drainage, sanitary, and gas fitting where licensed. Work subject to OSHA 29 CFR 1926 Subpart P and applicable state plumbing code.",
  hazards: [
    {
      hazard: "Hot water systems — scalding",
      controls:
        "Isolate and drain before work. Allow adequate cooling time. Heat-resistant gloves. Test water temperature before opening hot lines.",
      initialRisk: "Moderate",
      controlLevel: "Isolation + PPE",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Gas leak / explosion risk (gas fitting)",
      controls:
        "Isolate at meter before work. Test with calibrated gas detector. Ventilate area. No ignition sources. Pressure-test and leak-test all joints before re-energizing.",
      initialRisk: "High",
      controlLevel: "Isolation + Engineering",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Hot work — brazing / soldering copper pipe",
      controls:
        "Hot work permit if required by GC. Fire extinguisher within reach. Heat shields in confined areas. Fire watch for 30 minutes after completion.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + Engineering",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Confined spaces — crawlspaces, utility vaults, under-slab",
      controls:
        "Permit-required confined space entry per OSHA 29 CFR 1910.146. Atmospheric test before entry. Standby attendant. Two-way comms.",
      initialRisk: "High",
      controlLevel: "Administrative + Engineering",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Biological hazards — wastewater / sewage exposure",
      controls:
        "N95 respirator or P100 half-face for sewer work. Nitrile gauntlet gloves and eye protection. Hepatitis A/B vaccination recommended. Wash thoroughly before eating or drinking.",
      initialRisk: "High",
      controlLevel: "PPE + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Manual handling — cast iron, copper, fixtures",
      controls:
        "Two-person lift over 50 lbs. Mechanical aids where available. Proper technique — straight back, lift with legs.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Asbestos in older pipe insulation / lagging (pre-1980)",
      controls:
        "Stop work if asbestos insulation suspected. Do not disturb. Notify GC. EPA/state-licensed abatement required before resuming work.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site arrival & isolation point ID",
      hazards: "Unknown site, live services, gas lines",
      controls:
        "Sign in with GC. Locate main water shutoff, gas meter, electrical panel, first aid, and assembly point.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
    },
    {
      step: "2. Isolate water / gas supply",
      hazards: "Water escape, gas leak",
      controls:
        "Close valves. Test isolation. Drain lines where appropriate. LOTO for shared systems.",
      initialRisk: "High",
      controlLevel: "Isolation",
      residualRisk: "Low",
    },
    {
      step: "3. Perform plumbing / gas work",
      hazards: "Hot work, manual handling, biological, confined space",
      controls:
        "PPE worn. Hot work permit if required. Ventilation. Spill containment. Trained and licensed operators only.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Test & commission",
      hazards: "Leak under pressure, gas escape",
      controls:
        "Pressure test water systems per code. Gas leak test with calibrated detector. Visual inspection of all joints.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + Engineering",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazards: "Manual handling, biological contamination",
      controls:
        "Remove tools and waste. Disinfect work area if sewage exposure occurred. Sign out with GC.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "PVC solvent cement / primer",
      state: "Liquid",
      maxQty: "1 qt",
      unNumber: "UN 1133",
      hazardType: "Flammable, inhalation hazard",
      storage: "Locked vehicle compartment, away from ignition",
      segregation: "Away from ignition and heat",
      controls: "Ventilate. No smoking. Cap after use.",
      ppe: "Nitrile gloves, safety glasses, N95 in enclosed spaces",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
    {
      product: "Pipe joint compound / solder flux",
      state: "Paste",
      maxQty: "1 lb",
      unNumber: "Varies",
      hazardType: "Skin / eye irritant",
      storage: "Vehicle compartment",
      segregation: "Standard",
      controls: "Ventilation, gloves.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder",
      initialRisk: "Low",
      residualRisk: "Very Low",
    },
    {
      product: "Propane (torch / brazing)",
      state: "Compressed gas",
      maxQty: "1 lb cylinder",
      unNumber: "UN 1978",
      hazardType: "Highly flammable",
      storage: "Upright, secured, in vehicle — not in cab",
      segregation: "Away from oxidizers and ignition sources",
      controls: "Leak test before use. Ventilate. Fire extinguisher within reach. No open flame near gas lines.",
      ppe: "Safety glasses, heat-resistant gloves",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413)",
    "High-visibility vest on construction sites",
    "Safety glasses (ANSI Z87.1)",
    "Nitrile / chemical-resistant gloves",
    "Gauntlet gloves for wastewater / sewer work",
    "N95 / P100 respirator (sewage and asbestos-suspect work)",
    "Hard hat where required by GC",
    "Heat-resistant gloves for hot work",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Full PPE on within the work area.",
    "Isolate and test before opening any gas or pressurized line.",
    "Hot work permit required — check with GC before using torch.",
    "Pre-1980 building? Treat pipe insulation as asbestos until confirmed otherwise.",
    "Report any near miss or incident to GC immediately.",
  ],
  trainingItems: ["All workers hold current state plumbing / gas license appropriate to the scope of work."],
  trainingRequired: [
    "State plumbing license (journeyman or master, as applicable)",
    "Gas fitting license (where gas work is in scope)",
    "OSHA 10-Hour Construction",
    "First Aid / CPR (within 2 years)",
    "Confined Space Entry (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// PAINTING & DECORATING
// ─────────────────────────────────────────────────────────────────────────────

const painting: TradeTemplate = {
  activities:
    "Interior and exterior painting, surface preparation, and coating application. Work subject to OSHA 29 CFR 1926 Subpart D (scaffolding) and Subpart Z (hazardous substances).",
  hazards: [
    {
      hazard: "Working at height — ladders, scaffolding, aerial lifts",
      controls:
        "Fall protection above 6 ft per OSHA 29 CFR 1926.502. Ladder inspection before use — 4:1 angle, secured at top. Three points of contact. Scaffold erected and inspected by competent person. Aerial lift operators trained and certified.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Paint fumes / solvent inhalation",
      controls:
        "Adequate ventilation (mechanical if enclosed). N95 or half-face respirator with OV cartridge in enclosed spaces. Low-VOC paints selected where possible.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Airless spray — overspray and injection injury",
      controls:
        "Full-face respirator during spray. Containment / sheeting to protect others. Never point gun at body. Trigger lock when not in use. Pressure fully released before tip changes.",
      initialRisk: "High",
      controlLevel: "PPE + Engineering",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Lead-based paint (pre-1978 buildings)",
      controls:
        "Pre-work lead test on any pre-1978 surface. EPA RRP Rule compliance. HEPA vacuum. Wet methods — no dry sanding of suspect surfaces. P100 respirator. Dispose of waste as lead-contaminated material.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Manual handling — paint cans, buckets, ladders",
      controls:
        "Two-person lift over 50 lbs. Drum trolley for 5-gallon pails. Correct lifting technique.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Slips / trips / falls on drop sheets and wet paint",
      controls:
        "Drop sheets taped down. Wet paint signage. Non-slip safety boots. Keep walkways clear.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Heat stress (outdoor work — Texas / Florida summers)",
      controls:
        "Hydration breaks every 15–20 min. Shade or rest area available. Schedule heavy work in morning. Buddy system — watch for heat exhaustion symptoms. Know nearest urgent care location.",
      initialRisk: "High",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site arrival & area assessment",
      hazards: "Unknown site, other trades, lead paint, height hazards",
      controls:
        "Sign in with GC. Locate first aid, fire extinguisher, assembly point. Identify any pre-1978 surfaces. Assess access equipment needed.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
    },
    {
      step: "2. Set up access equipment",
      hazards: "Falls from height, dropped equipment",
      controls:
        "Inspect ladder / scaffold / aerial lift. Set up per manufacturer instructions. Fall protection above 6 ft. Exclusion zone below working area.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Surface preparation (sanding, scraping, washing)",
      hazards: "Lead dust, silica dust (stucco), manual handling",
      controls:
        "Lead test first on pre-1978 surfaces. HEPA vacuum. P100 respirator. Wet methods. Eye and skin protection.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Apply paint / coatings",
      hazards: "Fumes, solvents, spray overspray",
      controls:
        "Ventilation maintained. N95 + OV cartridge for brush/roll in enclosed spaces. Full-face respirator for spray. Skin covered.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "5. Drying period & quality check",
      hazards: "Solvent off-gassing, slips on wet paint",
      controls: "Ventilation maintained. Wet paint signage and cones. Touch-check before clearing area.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
    {
      step: "6. Clean up & pack down",
      hazards: "Manual handling, solvent waste disposal",
      controls:
        "Dispose of solvent waste per EPA / state regulations. Clean equipment in ventilated area. Remove and store drop sheets. Sign out with GC.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "Water-based latex / acrylic paint",
      state: "Liquid",
      maxQty: "50 gal",
      unNumber: "Not DG",
      hazardType: "Skin / eye irritant",
      storage: "Vehicle compartment, upright, frost-free",
      segregation: "Standard",
      controls: "Splash protection.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Low",
      residualRisk: "Very Low",
    },
    {
      product: "Oil-based / alkyd paint",
      state: "Liquid",
      maxQty: "20 gal",
      unNumber: "UN 1263",
      hazardType: "Flammable, health effects",
      storage: "Locked vehicle compartment, ventilated",
      segregation: "Away from ignition sources",
      controls: "Ventilation. No smoking. Solvent waste in sealed container.",
      ppe: "N95 + OV cartridge, nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
    {
      product: "Mineral spirits / paint thinner",
      state: "Liquid",
      maxQty: "2.5 gal",
      unNumber: "UN 1300",
      hazardType: "Flammable, health effects",
      storage: "Locked vehicle compartment, ventilated",
      segregation: "Away from ignition and oxidizers",
      controls: "Ventilation. No smoking. Capped after use. Waste in sealed, labeled container.",
      ppe: "Nitrile gloves, safety glasses, OV respirator",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413)",
    "High-visibility vest on construction sites",
    "Safety glasses / goggles (ANSI Z87.1)",
    "Nitrile gloves",
    "N95 respirator with OV cartridge (enclosed painting)",
    "P100 / full-face respirator (spray painting and lead work)",
    "Coveralls / disposable suit (spray and lead work)",
    "Hard hat where required by GC",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Full PPE on within the work area.",
    "Pre-1978 surfaces: test for lead before sanding or scraping.",
    "Wet paint areas coned and signed until fully dry.",
    "Hot work permit required before any open flame near paint / solvents.",
    "Hydration mandatory in hot weather — no exceptions.",
    "Report any near miss, exposure, or incident to GC immediately.",
  ],
  trainingItems: ["All workers appropriately trained and competent in assigned tasks."],
  trainingRequired: [
    "EPA RRP (Renovate, Repair, Paint) Certification — for pre-1978 work",
    "OSHA 10-Hour Construction",
    "First Aid / CPR (within 2 years)",
    "Working at Heights / Aerial Lift (where applicable)",
    "Scaffold competent person (if erecting scaffold)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE GRINDING
// ─────────────────────────────────────────────────────────────────────────────

const concrete_grinding: TradeTemplate = {
  activities:
    "Concrete grinding, shot blasting, line removal, polishing, and surface preparation — floors, slabs, and pavements. Work subject to OSHA 29 CFR 1926 Subpart Z (silica) and OSHA Silica Standard 29 CFR 1926.1153.",
  hazards: [
    {
      hazard: "Respirable crystalline silica (RCS) dust from grinding",
      controls:
        "OSHA Table 1 compliant: dust extractor (HEPA, M-class or better) attached to every grinder — no exceptions. Wet grinding where applicable. N95 minimum; P100 half-face for prolonged exposure. Exposure assessment on long jobs. Written Exposure Control Plan kept on site.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Noise from grinders, vacuums, generators",
      controls:
        "Hearing protection (NRR 25+) whenever grinder is running. Keep non-workers clear of noise zone. Limit continuous run time where possible.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Hand-arm vibration from grinders",
      controls:
        "Anti-vibration gloves. Job rotation — limit continuous single-operator use. Keep diamond segments sharp (blunt = more vibration).",
      initialRisk: "Moderate",
      controlLevel: "Engineering + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Electrical — cords and machinery near water (wet grinding)",
      controls:
        "GFCI protection on all temporary power. All cords inspected before use. Cords off the ground or matted where equipment crosses. Generator properly grounded.",
      initialRisk: "High",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Manual handling — grinders, vacuums, slurry drums",
      controls:
        "Two-person lift over 50 lbs. Hand truck / pallet jack for heavy equipment. Empty vacuum before moving.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Slips on slurry / polished concrete",
      controls:
        "Cordon wet areas. Wet-floor signs. Non-slip safety boots. Squeegee and dry as you go.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Eye injury from flying debris",
      controls:
        "Sealed safety glasses or face shield at all times when grinder is running. Bystanders excluded from work zone.",
      initialRisk: "Moderate",
      controlLevel: "PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Carbon monoxide (CO) from gas/propane equipment indoors",
      controls:
        "No gas or propane equipment indoors without forced ventilation and CO monitor. Battery-electric or air-powered equipment preferred for indoor jobs.",
      initialRisk: "High",
      controlLevel: "Isolation + Engineering",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site set-up",
      hazards: "Traffic, pedestrians, plant, unknown floor condition",
      controls:
        "Site induction / sign in with GC. Cones, signs, barriers. Identify any post-tension cables or embedded services before grinding. GFCI check on all gear. Silica Exposure Control Plan reviewed.",
      initialRisk: "Moderate",
      controlLevel: "Isolation + Administrative",
      residualRisk: "Low",
    },
    {
      step: "2. Grind / cut / polish",
      hazards: "Silica dust, noise, vibration, electrical, eye debris",
      controls:
        "Dust extractor on every grinder — confirm suction before starting. N95/P100 respirator. Hearing protection (NRR 25+). Anti-vibration gloves. Sealed eye protection. GFCI on lead.",
      initialRisk: "High",
      controlLevel: "Engineering + Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Vacuum / wash down",
      hazards: "Slurry slips, dust disturbance, manual handling",
      controls:
        "Cordon wet areas. Wet floor signs. Two-person lift for slurry containers. Continue respirator until area is clean and settled.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Exit & sign off",
      hazards: "Leftover slurry, cords, residual dust",
      controls:
        "Bag dust and take off site — do not leave. HEPA vacuum final pass. Roll up cords. Sign out with GC. Log any silica exposure incidents.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "Concrete dust (respirable crystalline silica)",
      state: "Solid",
      maxQty: "Generated on site",
      unNumber: "N/A",
      hazardType: "Health effects — OSHA regulated carcinogen (silicosis, lung cancer risk)",
      storage: "N/A — vacuumed at source per OSHA Table 1",
      segregation: "N/A",
      controls:
        "HEPA dust extractor on every grinder. Wet methods where possible. HEPA vacuum clean-up. Dust bagged and removed from site. N95/P100 respirator worn during all grinding.",
      ppe: "P100 half-face respirator, sealed safety glasses, anti-vibration gloves",
      sdsLocation: "Vehicle SDS binder + Silica Exposure Control Plan on site",
      initialRisk: "High",
      residualRisk: "Low",
    },
    {
      product: "Concrete densifier / hardener (lithium silicate)",
      state: "Liquid",
      maxQty: "5 gal",
      unNumber: "N/A",
      hazardType: "Corrosive / caustic, health effects",
      storage: "Sealed pail, upright in vehicle",
      segregation: "Away from acids and food",
      controls: "Use in ventilated area. Spill kit. Avoid skin and eye contact.",
      ppe: "Chemical-resistant gloves, safety glasses, long sleeves",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Low",
    },
    {
      product: "Gasoline (generator / gas-powered grinder)",
      state: "Liquid",
      maxQty: "5 gal (approved container)",
      unNumber: "UN 1203",
      hazardType: "Flammable, toxic, eco-toxic",
      storage: "Approved fuel can, upright in vehicle bed",
      segregation: "Away from ignition sources and oxidizers",
      controls:
        "No refueling near ignition sources. Cool engine before refueling. Spill kit on hand. No gas equipment indoors without forced ventilation + CO monitor.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Moderate",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413, slip-resistant sole)",
    "High-visibility vest on construction sites",
    "Hard hat (ANSI Z89.1) where required",
    "Sealed safety glasses or face shield (ANSI Z87.1)",
    "Anti-vibration gloves",
    "Hearing protection NRR 25+ whenever grinder running",
    "N95 minimum / P100 half-face respirator for all grinding",
    "Knee pads",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Dust extractor on every grinder — no dry grinding without it. OSHA $15,625 fine per violation.",
    "Respirator (N95 minimum) whenever dust is being generated.",
    "Hearing protection on whenever grinder is running.",
    "No gas-powered equipment indoors without forced ventilation + CO monitor.",
    "GFCI on every cord, every job.",
    "Slurry stays on site — bagged and removed, never into storm drains.",
    "Report any near miss or incident to GC immediately.",
  ],
  trainingItems: [
    "All workers trained and competent in concrete grinding. OSHA Silica Exposure Control Plan reviewed at onboarding.",
  ],
  trainingRequired: [
    "Concrete grinding / polishing work experience (competency register)",
    "OSHA Silica Awareness (29 CFR 1926.1153)",
    "OSHA 10-Hour Construction",
    "First Aid / CPR (within 2 years)",
    "Confined Space Entry (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// LINE MARKING
// ─────────────────────────────────────────────────────────────────────────────

const line_marking: TradeTemplate = {
  activities:
    "Line marking and floor prep — including set-up, layout, application, curing, and concrete grinding / line removal where required. Work subject to OSHA 29 CFR 1926 and applicable state traffic control standards (MUTCD).",
  hazards: [
    {
      hazard: "Traffic — vehicles, forklifts, pedestrians in work zone",
      controls:
        "Traffic control plan in place per MUTCD standards. Cones, signs, and barriers positioned before work starts. Hi-vis at all times. Dedicated spotter for active traffic areas. Coordinate with facility manager.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Respirable silica dust from concrete grinding / line removal",
      controls:
        "HEPA dust extractor attached to every grinder — OSHA Table 1 compliant. P100 half-face respirator worn during all grinding. Wet grinding where applicable. Written Silica Exposure Control Plan on site.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Paint fumes and solvent vapors",
      controls:
        "Work in well-ventilated areas. N95 with OV cartridge in enclosed or semi-enclosed spaces. Nitrile gloves. SDS on site.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "High-pressure paint lines (airless spray)",
      controls:
        "Trained operators only. Check pump and hoses before use. Pressure fully released before tip change. Never point gun at body. PPE worn.",
      initialRisk: "Moderate",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Wet paint — slip and contamination",
      controls:
        "Keep area coned and signed until paint is fully dry. Notify facility contact when areas will be closed.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Electrical — cords and machinery",
      controls:
        "All machinery inspected before use. GFCI protection on all temporary power. Cords kept off the ground or matted where vehicles cross.",
      initialRisk: "High",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Hazardous substances — solvents, paints, fuels",
      controls:
        "SDS on site for all products. Good ventilation. Spill kit in vehicle. Gloves and glasses during decanting. Stored in vehicle compartment, away from ignition.",
      initialRisk: "Moderate",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Heat stress (outdoor work — Texas / Florida summers)",
      controls:
        "Mandatory hydration breaks. Shade / rest area. Schedule heavy work early morning. Buddy system. Know nearest urgent care.",
      initialRisk: "High",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site set-up",
      hazards: "Forklifts, vehicles, pedestrians, paint spill, equipment faults",
      controls:
        "Site induction / sign in with GC or facility manager. Cones, signs, barriers in place before any work starts. Spill kit and absorbents ready — protect storm drains. Check spray unit: clean, oiled, trained operators only.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "2. Layout & mark",
      hazards: "Traffic, wet paint, high-pressure lines",
      controls:
        "Maintain traffic management. Cones around freshly marked areas until dry. Trained operators on spray equipment only.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Concrete grinding & line removal (where required)",
      hazards: "Silica dust, electrical, site contamination",
      controls:
        "GFCI on all cords — confirm before starting. HEPA dust extractor attached at all times. HEPA vacuum clean-up after. Bag dust and remove from site. Respirator and eye protection worn.",
      initialRisk: "High",
      controlLevel: "Engineering + Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Exit & clean up",
      hazards: "Rubbish, equipment, plant movement",
      controls:
        "Remove all tools and equipment from work area. Stay clear of forklifts and plant. Sign out with GC / facility manager.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
  ],
  substances: [
    {
      product: "Solvent-based road / floor marking paint",
      state: "Liquid",
      maxQty: "15 gal in vehicle",
      unNumber: "UN 1263",
      hazardType: "Flammable, health effects",
      storage: "Locked vehicle compartment, upright, ventilated",
      segregation: "Away from ignition sources, oxidizers",
      controls: "Good ventilation. No smoking near paint. Spill kit.",
      ppe: "N95 + OV cartridge, nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Low",
    },
    {
      product: "Water-based acrylic floor marking paint",
      state: "Liquid",
      maxQty: "25 gal in vehicle",
      unNumber: "Not DG",
      hazardType: "Skin / eye irritant",
      storage: "Vehicle compartment, upright",
      segregation: "Standard",
      controls: "Splash protection. Eye wash available.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "Moderate",
      residualRisk: "Very Low",
    },
    {
      product: "Gasoline (line marking machine / generator)",
      state: "Liquid",
      maxQty: "5 gal (approved container)",
      unNumber: "UN 1203",
      hazardType: "Flammable, toxic, eco-toxic",
      storage: "Approved fuel can, upright in vehicle bed",
      segregation: "Away from ignition and oxidizers",
      controls: "No refueling near ignition. Cool engine first. Spill kit on hand. Protect storm drains.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Moderate",
    },
    {
      product: "Concrete / line-marking dust (respirable silica)",
      state: "Solid",
      maxQty: "Generated on site",
      unNumber: "N/A",
      hazardType: "Health effects — OSHA regulated carcinogen",
      storage: "N/A — vacuumed at source",
      segregation: "N/A",
      controls: "HEPA dust extractor on every grinder. HEPA vacuum clean-up. Dust bagged and removed.",
      ppe: "P100 half-face respirator, safety glasses, gloves",
      sdsLocation: "Vehicle SDS binder + Silica Exposure Control Plan on site",
      initialRisk: "High",
      residualRisk: "Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413, slip-resistant)",
    "High-visibility vest / shirt — at all times in work zone",
    "Hard hat (ANSI Z89.1) where required",
    "Safety glasses (ANSI Z87.1)",
    "Nitrile gloves",
    "Hearing protection NRR 25+",
    "N95 + OV cartridge respirator (paint / solvent work)",
    "P100 half-face respirator (grinding / line removal)",
  ],
  siteRules: [
    "Sign in/out every day with GC / facility manager.",
    "Hi-vis vest on at all times in the work zone.",
    "Traffic management in place before any work starts.",
    "Dust extractor on every grinder — no exceptions. OSHA $15,625 fine per violation.",
    "Respirator on whenever dust or solvent fumes are present.",
    "Spill kit must travel with the vehicle every job. Protect storm drains.",
    "Wet markings coned and signed until fully dry.",
    "Report any near miss, exposure, or incident to GC immediately.",
  ],
  trainingItems: ["All workers are appropriately trained and competent in line marking and grinding tasks."],
  trainingRequired: [
    "Line marking work experience (competency register)",
    "OSHA Silica Awareness (29 CFR 1926.1153)",
    "OSHA 10-Hour Construction",
    "MUTCD / Temporary Traffic Control (where road work is in scope)",
    "First Aid / CPR (within 2 years)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "N/A",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARPENTRY / FRAMING
// ─────────────────────────────────────────────────────────────────────────────

const carpentry: TradeTemplate = {
  activities:
    "Rough framing, finish carpentry, trim, formwork, and general wood construction. Work subject to OSHA 29 CFR 1926 Subparts E, K, R (steel erection doesn't apply), and X.",
  hazards: [
    {
      hazard: "Falls from height — framing, roofing, decks",
      controls:
        "Fall protection system (guardrails, safety nets, or personal fall arrest) above 6 ft per OSHA 29 CFR 1926.502. Leading edge work requires fall protection plan. Inspect harness before each use.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Power saw injuries — circular saw, miter saw, table saw",
      controls:
        "Guards in place and functioning. Trained operator only. Proper blade for material. Safety glasses and hearing protection. Never reach across blade. Blade guard returns after each cut.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Nail gun puncture injuries",
      controls:
        "Sequential-trip nail guns preferred over contact-trip. Never bypass safety. Safety glasses. Keep hands clear of muzzle. Disconnect before clearing jams.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Wood dust (hardwoods, treated lumber, MDF)",
      controls:
        "Dust collection at source. N95 respirator for prolonged cutting. No dry sweeping — HEPA vacuum.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Manual handling — lumber, beams, sheet goods",
      controls:
        "Two-person lift for sheets and long lumber. Panel carrier for plywood. Team lift for LVL beams.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Struck-by — falling materials from above",
      controls:
        "Hard hat in any multi-level work zone. Exclusion zone below elevated work. Secure materials from falling. Toe boards on scaffold.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site set-up",
      hazards: "Other trades, overhead hazards, ground conditions",
      controls: "Sign in with GC. Hard hat in multi-trade areas. Identify overhead hazards. Set up material and cut area clear of traffic.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "2. Cutting & fabrication",
      hazards: "Saw injuries, dust, noise",
      controls: "Guards in place. Safety glasses and hearing protection on. Dust collection connected. Trained operator only.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Framing / installation at height",
      hazards: "Falls, struck-by, manual handling",
      controls: "Fall protection above 6 ft. Hard hat. Two-person lift for large members. Secure loose materials.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up & sign off",
      hazards: "Nails and offcuts — slip / puncture",
      controls: "Sweep area and pick up all nails. Remove offcuts. Sign out with GC.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "Construction adhesive (solvent-based)",
      state: "Paste",
      maxQty: "12 tubes",
      unNumber: "UN 1133",
      hazardType: "Flammable, health effects",
      storage: "Vehicle compartment, away from ignition",
      segregation: "Away from ignition",
      controls: "Ventilation. No smoking.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder",
      initialRisk: "Low",
      residualRisk: "Very Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413, puncture-resistant sole)",
    "High-visibility vest on construction sites",
    "Hard hat (ANSI Z89.1)",
    "Safety glasses (ANSI Z87.1)",
    "Hearing protection NRR 25+ around power saws",
    "N95 respirator for prolonged dust exposure",
    "Fall arrest harness above 6 ft (leading edge work)",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Hard hat on in all multi-trade zones.",
    "Fall protection above 6 ft — no exceptions.",
    "Saw guards in place before cutting.",
    "GFCI on every cord.",
    "Nails picked up at end of each shift.",
    "Report any near miss or incident to GC immediately.",
  ],
  trainingItems: ["All workers appropriately trained and competent in assigned tasks."],
  trainingRequired: [
    "Carpentry / framing trade experience",
    "OSHA 10-Hour Construction",
    "Fall Protection Competent Person (for leading edge work)",
    "First Aid / CPR (within 2 years)",
    "Scaffold competent person (if erecting scaffold)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOFING
// ─────────────────────────────────────────────────────────────────────────────

const roofing: TradeTemplate = {
  activities:
    "Residential and commercial roofing — shingles, tile, metal, flat / TPO / modified bitumen. Work subject to OSHA 29 CFR 1926 Subpart R.",
  hazards: [
    {
      hazard: "Falls from roof edge — leading cause of construction fatalities",
      controls:
        "Fall protection above 6 ft per OSHA 29 CFR 1926.502. Options: guardrail system, personal fall arrest system (PFAS), or safety net. Warning line system + safety monitor only for low-slope roofs per OSHA exception. Inspect harness and anchor daily.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Heat stress (Florida / Texas heat — rooftop temperatures 150°F+)",
      controls:
        "OSHA Heat Illness Prevention: water, rest, shade every 15–20 min. Schedule heaviest work before 10 AM. Buddy system to monitor symptoms. Know nearest urgent care. New workers acclimatize over 7–14 days.",
      initialRisk: "High",
      controlLevel: "Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Struck-by — tools, materials falling from roof",
      controls:
        "Exclusion zone / barrier at ground level below work area. Toe boards on scaffold. Secure materials from rolling. Hard hats for anyone below.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Cuts from roofing tools and sheet metal",
      controls:
        "Cut-resistant gloves for metal roofing. Keep blades sharp — dull blades require more force and slip. Proper knife technique.",
      initialRisk: "Moderate",
      controlLevel: "PPE + Administrative",
      residualRisk: "Low",
      toolbox: false,
    },
    {
      hazard: "Fire / burns — hot bitumen / torch-applied membrane",
      controls:
        "Hot work permit from GC. Fire watch 30 min after torch work. CO2 or dry chemical extinguisher on roof. Heat-resistant gloves. Torch shut off at tank when not in use.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Ladder safety — access to and from roof",
      controls:
        "Ladder extends 3 ft above roof edge. Secured at top. 4:1 angle. Three points of contact. Non-conductive ladder near electrical.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site set-up",
      hazards: "Overhead hazards, ladder access, public below",
      controls: "Sign in with GC. Set up ground exclusion zone. Inspect all ladders. Brief team on weather and heat plan for the day.",
      initialRisk: "High",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "2. Tear-off / demo",
      hazards: "Debris, nails, sharp edges, falls, heat",
      controls: "PFAS in use. Debris chute or controlled drop zone. Hard hats on ground crew. Hydration enforced.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Install / apply roofing",
      hazards: "Falls, heat, cuts, torch burns",
      controls: "PFAS or guardrail maintained. Hydration breaks. Cut-resistant gloves (metal). Hot work permit for torch work.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up & sign off",
      hazards: "Nails, debris on ground, manual handling",
      controls: "Magnet sweep for nails. All debris removed. Sign out with GC.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
    },
  ],
  substances: [
    {
      product: "Roofing asphalt / bitumen (hot or cold applied)",
      state: "Liquid / semi-solid",
      maxQty: "50 gal",
      unNumber: "UN 1999 (hot) / Not DG (cold)",
      hazardType: "Burns, fumes, flammable (hot)",
      storage: "Kettle on trailer / vehicle — upright, labeled",
      segregation: "Away from ignition when heated",
      controls: "Heat-resistant gloves, face shield. Kettle monitored continuously. Fire extinguisher beside kettle.",
      ppe: "Heat-resistant gloves, face shield, long sleeves",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Low",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413, slip-resistant)",
    "Hard hat (ANSI Z89.1) — ground crew mandatory",
    "Safety glasses (ANSI Z87.1)",
    "Personal fall arrest system (PFAS) — harness, lanyard, anchor",
    "Cut-resistant gloves (metal roofing)",
    "Heat-resistant gloves (torch / hot asphalt work)",
    "Sun protection — long sleeves, hat, SPF 50+",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Fall protection above 6 ft — zero exceptions.",
    "Ground exclusion zone in place when working above.",
    "No torch work without hot work permit from GC.",
    "Hydration mandatory — water and shade every 15–20 min in heat.",
    "Magnet sweep for nails at end of each day.",
    "Report any near miss or incident to GC immediately.",
  ],
  trainingItems: ["All workers appropriately trained and competent in roofing tasks."],
  trainingRequired: [
    "Roofing work experience",
    "OSHA 10-Hour Construction",
    "Fall Protection Competent Person",
    "First Aid / CPR (within 2 years)",
    "Heat Illness Prevention (OSHA / Cal/OSHA model)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL / OTHER TRADE (catch-all)
// ─────────────────────────────────────────────────────────────────────────────

const general: TradeTemplate = {
  activities:
    "General trade work — review and customize this JHA for your specific scope of work. Work subject to applicable OSHA 29 CFR 1926 (construction) or 29 CFR 1910 (general industry) standards.",
  hazards: [
    {
      hazard: "Manual handling — lifting, carrying, awkward postures",
      controls:
        "Two-person lift over 50 lbs. Mechanical aids where possible. Plan lift before moving. Straight back, lift with legs.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Power tool injury — cuts, eye, hearing",
      controls:
        "Guards in place. GFCI on every cord. Safety glasses and hearing protection. Trained operator only.",
      initialRisk: "Moderate",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Slips, trips, falls on site",
      controls:
        "Keep walkways clear. Cords off ground or matted. Clean up as you go. Non-slip safety boots.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Working at height (where applicable)",
      controls:
        "Fall protection above 6 ft per OSHA 29 CFR 1926.502. Inspect ladder / scaffold before use. Three points of contact on ladders.",
      initialRisk: "High",
      controlLevel: "Engineering + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Traffic — vehicles, plant, pedestrians on site",
      controls:
        "Hi-vis vest at all times. Eye contact with equipment operators. Stay clear of plant exclusion zones.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
      toolbox: true,
    },
    {
      hazard: "Asbestos in older buildings (pre-1980)",
      controls:
        "Assume asbestos present in pre-1980 buildings until confirmed otherwise. Stop work if disturbed. Notify GC. EPA / state-licensed abatement required.",
      initialRisk: "High",
      controlLevel: "Isolation + Administrative",
      residualRisk: "Low",
      toolbox: true,
    },
  ],
  taskSteps: [
    {
      step: "1. Site set-up",
      hazards: "Traffic, unknown ground conditions, overhead and underground services",
      controls:
        "Sign in with GC. Identify overhead / underground utilities with GC. Set up tool and material zone clear of traffic. Locate first aid and assembly point.",
      initialRisk: "Moderate",
      controlLevel: "Administrative",
      residualRisk: "Low",
    },
    {
      step: "2. Perform the work",
      hazards: "Trade-specific — customize this step for your scope",
      controls:
        "Use task-specific PPE. Trained operator only on any plant or power tools. Follow manufacturer instructions.",
      initialRisk: "Moderate",
      controlLevel: "Administrative + PPE",
      residualRisk: "Low",
    },
    {
      step: "3. Clean up & sign off",
      hazards: "Leftover material, trips, sharps",
      controls: "Sweep area. Tools to vehicle. Remove all debris. Sign out with GC.",
      initialRisk: "Low",
      controlLevel: "Administrative",
      residualRisk: "Very Low",
    },
  ],
  substances: [
    {
      product: "Gasoline (generators, small engines)",
      state: "Liquid",
      maxQty: "5 gal (approved container)",
      unNumber: "UN 1203",
      hazardType: "Flammable, toxic, eco-toxic",
      storage: "Approved fuel can, upright in vehicle bed",
      segregation: "Away from ignition and oxidizers",
      controls: "No refueling near ignition. Cool engine first. Spill kit on hand.",
      ppe: "Nitrile gloves, safety glasses",
      sdsLocation: "Vehicle SDS binder + digital copy on phone",
      initialRisk: "High",
      residualRisk: "Moderate",
    },
  ],
  ppeRequired: [
    "Safety boots (ASTM F2413)",
    "High-visibility vest on construction sites",
    "Hard hat (ANSI Z89.1)",
    "Safety glasses (ANSI Z87.1)",
    "Hearing protection NRR 25+ around loud equipment",
    "Gloves appropriate to task",
  ],
  siteRules: [
    "Sign in/out every day with GC.",
    "Full PPE on within the work area.",
    "GFCI on every cord.",
    "Fall protection above 6 ft.",
    "Pre-1980 building? Treat as asbestos present until proven otherwise.",
    "Report any near miss or incident to GC immediately.",
  ],
  trainingItems: ["All workers appropriately trained, competent, or fully supervised for assigned tasks."],
  trainingRequired: [
    "Trade qualification or apprenticeship in progress (as applicable)",
    "OSHA 10-Hour Construction (recommended)",
    "First Aid / CPR (within 2 years)",
    "Working at Heights / Fall Protection (where applicable)",
  ],
  inductionProcess: STANDARD_INDUCTION,
  commToolboxFreq: "Daily",
  commPreStartFreq: "Daily",
  commProgressFreq: "Weekly",
  emergencyProcedures: STANDARD_EMERGENCY_PROCEDURES,
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: "Confirm on site induction — typically front entrance or parking area.",
  taskAnalysisRequired: true,
  hazardRegisterProvided: true,
  hazardousSubstancesOnSite: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup table
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, TradeTemplate> = {
  electrical,
  plumbing,
  gas_fitting: plumbing,
  drainage: plumbing,
  carpentry,
  framing: carpentry,
  roofing,
  painting,
  concrete_grinding,
  concrete_polishing: concrete_grinding,
  line_marking,
  floor_marking: line_marking,
  general,
  drywall: general,
  hvac: general,
  fire_protection: general,
  landscaping: general,
  welding: general,
  pest_control: general,
};

/**
 * Get the JHA starter template for a given trade key.
 * Returns the `general` template if the trade isn't recognised.
 */
export function getTradeTemplate(tradeKey: string | null | undefined): TradeTemplate {
  if (!tradeKey) return general;
  return TEMPLATES[tradeKey] ?? general;
}
