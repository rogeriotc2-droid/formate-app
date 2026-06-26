/**
 * Trade-specific starter templates for new SWMS documents (NZ/AU).
 *
 * When a tradie creates their first SWMS we seed it with standard hazard
 * controls, PPE, licences and emergency content for their trade.
 * They review on job 1 — sticky fields carry their version forward from then on.
 *
 * Field keys MUST match SwmsData in artifacts/safeiq/src/pages/swms/detail.tsx.
 */

type ControlMeasures = {
  eliminate?: string;
  substitute?: string;
  isolate?: string;
  engineer?: string;
  admin?: string;
  ppe?: string;
};

type SwmsStep = {
  step: string;
  hazard: string;
  personsAtRisk: string;
  initialLikelihood: string;
  initialConsequence: string;
  initialRisk: string;
  controlMeasures: ControlMeasures;
  residualRisk: string;
};

export type SwmsTemplate = {
  hrceType: string;
  licencesRequired: string[];
  plantsEquipment: string[];
  ppeRequired: string[];
  steps: SwmsStep[];
  emergencyContacts: { name: string; role: string; phone: string }[];
  musterPoint: string;
};

const STANDARD_EMERGENCY_CONTACTS = [
  { name: "Emergency services", role: "Fire / Ambulance / Police", phone: "111" },
  { name: "WorkSafe NZ", role: "Notifiable events", phone: "0800 030 040" },
];

const STANDARD_MUSTER = "Confirm on site induction — typically front gate or car park area.";

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICAL
// ─────────────────────────────────────────────────────────────────────────────

const electrical: SwmsTemplate = {
  hrceType: "Work involving electrical installations or work in the vicinity of electrical services",
  licencesRequired: [
    "Electrical Workers Registration Board (EWRB) — Electrician or Electrical Inspector",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Working at Heights certificate (where applicable)",
    "Confined Space Entry certificate (where applicable)",
  ],
  plantsEquipment: [
    "Insulated hand tools (Class 0 or higher rated for LV)",
    "Voltage tester / multimeter (calibration in date)",
    "Lock-out / tag-out (LOTO) equipment",
    "RCD (Residual Current Device) on every lead",
    "Extension leads (tested & tagged in date)",
    "Ladder (inspected before use)",
    "Arc-rated PPE kit",
  ],
  ppeRequired: [
    "Safety boots (EH-rated, electrical hazard)",
    "Hi-viz vest",
    "Hard hat (where required on site)",
    "Safety glasses",
    "Insulated gloves (Class 0 minimum for LV work)",
    "Arc-rated clothing (for any live-work or switchboard opening)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Site arrival & isolation",
      hazard: "Live circuits, unknown site conditions, electric shock",
      personsAtRisk: "Electrician, other trades on site",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Identify circuit at the source. Apply LOTO — lock out at the board, tag with personal lock, retain key.",
        admin: "Site induction / sign in. Test for dead (live → dead → live sequence) before touching any conductor.",
        ppe: "Insulated gloves, safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Electrical installation / fault-finding",
      hazard: "Electric shock, arc flash, damaged leads, cuts from tools",
      personsAtRisk: "Electrician, nearby workers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Maintain LOTO throughout. Treat all circuits as live until proven dead.",
        engineer: "RCD on every extension lead. Inspect leads before use — no damaged insulation, exposed wire or cracked plugs.",
        admin: "Trained and registered electrician only. Sequential commissioning procedure. Keep others clear.",
        ppe: "Insulated gloves, safety glasses, arc-rated clothing for switchboard work.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Working at height (ladders, elevated switchboards)",
      hazard: "Fall from height, dropped tools",
      personsAtRisk: "Electrician, workers below",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Secure ladder at top. Tool lanyards to prevent dropped tools.",
        admin: "Inspect ladder before use. Three points of contact at all times. No over-reaching.",
        ppe: "Harness anchored to a certified point where working above 3 m.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Testing & commissioning",
      hazard: "Re-energising circuits, live testing, incorrect polarity",
      personsAtRisk: "Electrician, building occupants",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Trained and registered electrician only. Test in correct sequence: insulation resistance → polarity → earth fault loop impedance → RCD trip time. Communicate to site before re-energising.",
        ppe: "Insulated gloves, safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazard: "Exposed terminals, offcuts, trip hazards",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Cap or cover all exposed terminals. Sweep area. Remove leads and tools to vehicle. Sign out with PCBU 1. Issue Certificate of Compliance where required.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// PLUMBING (covers gas_fitting, drainage)
// ─────────────────────────────────────────────────────────────────────────────

const plumbing: SwmsTemplate = {
  hrceType: "Work involving pressurised systems, confined spaces, or hazardous substances (gas/sewage)",
  licencesRequired: [
    "Plumbers, Gasfitters and Drainlayers Board (PGDB) — Certifying Plumber",
    "Certifying Gasfitter (where gas work is performed)",
    "Certifying Drainlayer (where drainage work is performed)",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Confined Space Entry certificate (where applicable)",
  ],
  plantsEquipment: [
    "Pipe cutter / press tool",
    "Pressure testing equipment (test gauge, pump)",
    "Brazing torch and LPG cylinder (gasfitting)",
    "Calibrated gas leak detector",
    "Pipe wrench, basin wrench",
    "Drain camera / CCTV (where applicable)",
    "Wet / dry vacuum",
    "Spill kit and bunded drip tray",
  ],
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Safety glasses",
    "Nitrile gloves (drainage / sewage work)",
    "Leather gloves (general)",
    "Knee pads",
    "P2 respirator (asbestos suspicion, pre-2000 buildings)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Site arrival & isolation",
      hazard: "Live water or gas supply, unknown site conditions",
      personsAtRisk: "Plumber, building occupants",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Identify and shut off water or gas at the main. Confirm isolation. Tag the valve.",
        admin: "Site induction / sign in. Locate all isolation points (water main, gas meter, electrical main) with PCBU 1 before starting.",
        ppe: "Safety boots, hi-viz, safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Drain down / depressurise",
      hazard: "Residual pressure, scalding water, sewage exposure",
      personsAtRisk: "Plumber",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        isolate: "Open lowest drain point. Allow full pressure release before cutting.",
        admin: "Allow water to cool before opening hot systems. Capture contaminated water — do not let it enter drain without approval.",
        ppe: "Nitrile gloves, safety glasses, waterproof apron for sewage work.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Cut & install pipework",
      hazard: "Sharps, solvent cement fumes, manual handling injuries",
      personsAtRisk: "Plumber",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Use pipe supports / pipe jacks for long horizontal runs. Mechanical aids for heavy items (cylinders, fixtures).",
        admin: "Use PVC solvent cement outdoors or in well-ventilated area. Cap tin when not in use. Two-person lift over 23kg.",
        ppe: "Cut-resistant gloves, safety glasses, nitrile gloves for solvents.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Gas work — brazing, leak test",
      hazard: "Gas leak, explosion, LPG cylinder fire, burns from brazing torch",
      personsAtRisk: "Gasfitter, nearby workers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Isolate gas at meter / cylinder valve before work. No ignition sources in the work area.",
        engineer: "Calibrated gas detector used before and after brazing. Ventilate enclosed spaces.",
        admin: "Soap-test all joints after commissioning. Certifying Gasfitter only. Cylinder upright and secured.",
        ppe: "Leather gloves, safety glasses, face shield for brazing.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Pressure test & commission",
      hazard: "Sudden release of pressurised water or gas, leaks at joints",
      personsAtRisk: "Plumber, building occupants",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Low",
      controlMeasures: {
        engineer: "Test to specification — never over-pressure. Stand clear of fittings during test.",
        admin: "Record test pressure and hold time. Soap-test all gas joints. Commission tempering valve to 55°C max. Issue gas safety certificate where required.",
      },
      residualRisk: "Very Low",
    },
    {
      step: "6. Clean up & sign off",
      hazard: "Wet floors (slips), sharps (pipe offcuts), contaminated water",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Mop / dry wet areas. Bag all offcuts and sharps. Remove tools to vehicle. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARPENTRY
// ─────────────────────────────────────────────────────────────────────────────

const carpentry: SwmsTemplate = {
  hrceType: "Work involving load-bearing formwork, framing, or work where there is a risk of falling 3 metres or more",
  licencesRequired: [
    "Carpentry trade qualification or apprenticeship in progress",
    "Licensed Building Practitioner (LBP) — for restricted building work",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Working at Heights certificate (where applicable)",
    "Scaffolding ticket (where erecting scaffold over 5 m)",
  ],
  plantsEquipment: [
    "Circular saw (guard in place)",
    "Mitre saw / chop saw",
    "Nail gun and compressor",
    "Drill driver",
    "Scaffold or trestle (inspected and tagged)",
    "Ladder (A-frame or extension, inspected before use)",
    "Safety harness and lanyard",
    "Saw horse / work bench",
    "Magnet (nail sweeper)",
  ],
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Hard hat",
    "Safety glasses",
    "Cut-resistant gloves",
    "Hearing protection (Class 5 ear muffs while power tools running)",
    "P2 dust mask (cutting and sanding)",
    "Harness and lanyard (above 3 m)",
  ],
  steps: [
    {
      step: "1. Site set-up",
      hazard: "Traffic, underground / overhead services, unsecured materials",
      personsAtRisk: "Carpenter, site public",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Site induction / sign in. Identify overhead and underground services with PCBU 1. Set up tool and material zone clear of pedestrian and vehicle paths. Cones and signs where required.",
        ppe: "Hi-viz vest, safety boots, hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Set out & cut timber / sheet material",
      hazard: "Saw cuts, kickback, wood dust, noise",
      personsAtRisk: "Carpenter",
      initialLikelihood: "High",
      initialConsequence: "Medium",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Guards in place and operational. RCD on every lead. Workpiece secured with clamps before cutting. Push stick for narrow rips on table saw.",
        admin: "Trained operator only on power saws. Keep bystanders clear. Sweep dust between cuts.",
        ppe: "Safety glasses, hearing protection (Class 5), P2 dust mask, cut-resistant gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Fix / install — framing, fix-out, decking",
      hazard: "Nail gun injury, falls from height, manual handling",
      personsAtRisk: "Carpenter, trades below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Sequential trip trigger only on nail guns — no bypassing safety. Edge protection (scaffold rails) on open edges. Tool lanyards above 3 m.",
        admin: "No one directly below while fixing overhead. Two-person lift for sheets and lengths over 23 kg. Scaffold inspected and tagged in date.",
        ppe: "Harness anchored to a certified point above 3 m. Hard hat, safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Treated timber handling (H3/H4/H5)",
      hazard: "Skin and eye contact with CCA / ACQ preservative",
      personsAtRisk: "Carpenter",
      initialLikelihood: "Medium",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Cut outdoors or in ventilated area. Do not burn offcuts — landfill only. Wash hands and arms before eating.",
        ppe: "Gloves, safety glasses, P2 dust mask when cutting.",
      },
      residualRisk: "Very Low",
    },
    {
      step: "5. Clean up & sign off",
      hazard: "Nails, offcuts, trip hazards",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Medium",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Sweep area. Magnet-sweep for loose nails. Bag offcuts. Leads off floor. Tools to vehicle. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOFING
// ─────────────────────────────────────────────────────────────────────────────

const roofing: SwmsTemplate = {
  hrceType: "Work where there is a risk of a person falling 3 metres or more",
  licencesRequired: [
    "Working at Heights certificate",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Scaffolding ticket (where erecting scaffold over 5 m)",
    "Asbestos awareness training (pre-2000 roofing)",
  ],
  plantsEquipment: [
    "Safety harness and certified anchor points",
    "Edge protection (scaffold rails or guardrails)",
    "Scaffold (inspection tag in date)",
    "Extension ladder (inspected before use)",
    "Skylight covers / barriers",
    "Roof hook / roof ladder",
    "Tool lanyards",
    "Drop zone barricades",
    "Roofing nail gun or screw gun",
    "Angle grinder (with guard)",
  ],
  ppeRequired: [
    "Safety boots (non-slip sole)",
    "Hi-viz vest",
    "Hard hat (on scaffold and below roof work)",
    "Safety glasses",
    "Safety harness and lanyard (above 3 m)",
    "Cut-resistant gloves (metal roofing)",
    "Sunscreen and hat (sun exposure)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Pre-start — roof condition and weather check",
      hazard: "Fragile roofing, wet surfaces, wind, unknown structural condition",
      personsAtRisk: "Roofer",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Visual inspection of roof structure from below before access. Check weather forecast — no work in rain, ice or gusts above 40 km/h. Confirm structural engineer sign-off for fragile roofs.",
        ppe: "Non-slip safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Set up fall protection and barricades",
      hazard: "Falls from open edges, skylights, fragile sections",
      personsAtRisk: "Roofer, workers below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Install edge protection (guardrails at least 900 mm high) on all open edges before accessing the roof. Cover or barrier all skylights before personnel are on the roof.",
        isolate: "Barricade drop zone on the ground below — no personnel in the drop zone during work.",
        ppe: "Harness anchored to a certified static line or fixed anchor above 3 m. Tool lanyards on all tools used on the roof.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Roof access — ladder and scaffold",
      hazard: "Falls from ladder, overloading scaffold",
      personsAtRisk: "Roofer",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Ladder extends 1 m above roof edge. Secured at top and footed. Scaffold inspected and tagged in date.",
        admin: "Three points of contact on ladder at all times. One person on ladder at a time. Do not over-reach.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Install roofing material (metal sheet, tile, membrane)",
      hazard: "Cuts from metal edges, dropped materials, falls, noise",
      personsAtRisk: "Roofer, workers below",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Mesh / kickboards along scaffold edge to prevent material fall. Drop zone barricaded below.",
        admin: "Communicate before moving sheets — clear below. Two-person carry for sheets over 2.4 m. Stay back from the edge while handling sheets in wind.",
        ppe: "Cut-resistant gloves for metal roofing. Safety glasses when cutting. Hearing protection.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazard: "Loose offcuts, screws and nails — dropped hazard, sharp waste on roof",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Medium",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Collect all offcuts, screws and nails from the roof. Remove from drop zone. Magnet-sweep the ground. Remove fall protection in reverse order. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// PAINTING
// ─────────────────────────────────────────────────────────────────────────────

const painting: SwmsTemplate = {
  hrceType: "Work involving hazardous substances (solvents, thinners, lead paint) or working at height",
  licencesRequired: [
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Working at Heights certificate (where scaffold or height above 3 m is used)",
    "Asbestos awareness training (pre-2000 surfaces)",
    "Lead paint awareness training (pre-1980 surfaces)",
  ],
  plantsEquipment: [
    "Spray equipment (airless or HVLP)",
    "Scaffold or trestle (inspection tag in date)",
    "Extension ladder (inspected before use)",
    "Drop sheets and masking tape",
    "Paint roller and extension pole",
    "Pressure pot / pump",
    "Spill kit",
  ],
  ppeRequired: [
    "Safety boots",
    "Hi-viz vest",
    "Safety glasses / chemical splash goggles",
    "P2 / N95 respirator (oil-based paint, sanding, or enclosed spaces)",
    "P3 / full-face respirator (spray painting, lead paint)",
    "Disposable overalls (spray work)",
    "Nitrile gloves (solvents, thinners)",
    "Harness and lanyard (above 3 m)",
    "Hearing protection (where spray equipment is running)",
  ],
  steps: [
    {
      step: "1. Surface preparation — sand, scrape, wash",
      hazard: "Dust (silica, lead paint particles), solvent fumes, asbestos",
      personsAtRisk: "Painter, building occupants",
      initialLikelihood: "High",
      initialConsequence: "Medium",
      initialRisk: "High",
      controlMeasures: {
        substitute: "Use low-VOC products where possible.",
        engineer: "Use wet sanding or dust extraction for dry sanding. Seal off work area to contain dust.",
        admin: "Pre-2000 buildings — assume asbestos, test before sanding. Pre-1980 paint — assume lead, use wet methods. Remove building occupants from the work area.",
        ppe: "P2 respirator (dust), P3 full-face for confirmed lead or asbestos. Nitrile gloves, safety glasses, disposable overalls.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Spray painting (airless / HVLP)",
      hazard: "Atomised paint inhalation, solvent vapour, skin injection injury (airless)",
      personsAtRisk: "Painter, nearby workers",
      initialLikelihood: "High",
      initialConsequence: "Medium",
      initialRisk: "High",
      controlMeasures: {
        substitute: "Use water-based products where the finish quality allows.",
        engineer: "Ventilate enclosed spaces (forced air). Airless spray — never point at skin; tip guard on at all times.",
        admin: "No one else in the spray zone. Lock / barricade the space. Communicate before starting spray.",
        ppe: "P3 / full-face respirator, disposable overalls, nitrile gloves, safety glasses / goggles.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Working at height (scaffold, ladder, trestle)",
      hazard: "Fall from height, overloaded scaffold",
      personsAtRisk: "Painter",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Scaffold inspected and tagged in date. Ladder secured at top. Guardrails on all open scaffold edges.",
        admin: "Three points of contact on ladder. No over-reaching. One person on ladder at a time.",
        ppe: "Harness anchored to a certified point above 3 m.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Solvent and thinners handling",
      hazard: "Flammable vapour, skin / eye contact, inhalation",
      personsAtRisk: "Painter",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        isolate: "No ignition sources in areas where solvents are being used or stored.",
        admin: "Keep lids on containers when not in use. Ventilate. Store solvents in approved sealed containers. Dispose of rags in a sealed metal bin (fire risk).",
        ppe: "Nitrile gloves, safety glasses, P2 / OV respirator.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazard: "Solvent-soaked rags (fire), wet floors (slip), paint spills",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Place solvent-soaked rags in a sealed metal bin — do not leave in a pile (spontaneous combustion risk). Clean up spills. Dry wet floors. Remove drop sheets. Tools cleaned and to vehicle. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE GRINDING (covers concrete_laying)
// ─────────────────────────────────────────────────────────────────────────────

const concrete_grinding: SwmsTemplate = {
  hrceType: "Work involving generation of hazardous airborne dust (respirable crystalline silica)",
  licencesRequired: [
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Silica dust awareness training",
    "Plant operator competency (diamond grinder / polisher)",
    "Working at Heights certificate (where applicable)",
  ],
  plantsEquipment: [
    "Diamond grinding / polishing machine (with integrated dust shroud)",
    "HEPA-filtered industrial vacuum (H class or M class minimum)",
    "Water suppression system (for wet grinding)",
    "Extension leads (tested and tagged in date)",
    "RCD on every lead",
    "Anti-vibration grinder handles",
    "Wet / dry vac for clean-up",
    "Traffic management signs / cones (public areas)",
  ],
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Hard hat (where required)",
    "Safety glasses (impact resistant)",
    "P3 full-face respirator (silica dust — mandatory for dry grinding)",
    "Hearing protection (Class 5 — grinding noise above 85 dB)",
    "Anti-vibration gloves (hand-arm vibration from grinder)",
    "Knee pads",
  ],
  steps: [
    {
      step: "1. Site set-up & dust control plan",
      hazard: "Respirable crystalline silica dust — lung disease (silicosis, lung cancer)",
      personsAtRisk: "Grinder operator, bystanders",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Attach dust shroud to grinder and connect to HEPA vacuum before starting. Confirm vacuum suction is adequate — seal any gaps.",
        isolate: "Cordon off the work area. Tape / seal doorways in enclosed spaces to prevent silica dust migration.",
        admin: "Review dust control plan with PCBU 1. Never dry grind without extraction. Wet grinding preferred where surface allows.",
        ppe: "P3 full-face respirator on before entering the work area. Anti-vibration gloves, safety glasses, hearing protection (Class 5).",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Grinding / cutting operation",
      hazard: "Silica dust, noise (>100 dB), hand-arm vibration, flying debris, electrical",
      personsAtRisk: "Operator",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Dust extraction running and connected at all times. RCD on lead. Inspect blade / disc before use — no cracks or missing segments.",
        admin: "Operator only in the grinding zone. Limit grinder run time per session to manage vibration exposure. No bystanders within 3 m.",
        ppe: "P3 full-face respirator, Class 5 hearing protection, anti-vibration gloves, impact glasses, steel-cap boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Slurry / wet waste management",
      hazard: "Slips on wet concrete slurry, environmental contamination",
      personsAtRisk: "Operator, other site workers",
      initialLikelihood: "Medium",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        engineer: "Bunded collection tray under vacuum. Collect slurry — do not hose into stormwater drain.",
        admin: "Dispose of dried slurry as general waste or per site waste plan. Place wet floor signage.",
      },
      residualRisk: "Very Low",
    },
    {
      step: "4. HEPA vacuum & final clean-up",
      hazard: "Residual silica dust re-suspension during clean-up",
      personsAtRisk: "Operator",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "HEPA vacuum only — no dry sweeping or compressed air blowing. Wet mop after vacuuming.",
        admin: "Empty vacuum in a sealed bag outdoors. Wipe down equipment with damp cloth.",
        ppe: "P3 respirator on until final clean-up is complete and dust has settled.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Sign off & equipment check",
      hazard: "Trip hazards, damaged equipment, uncleared silica residue",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Inspect grinder disc / blades — store safely. Leads coiled and tagged status recorded. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// LINE MARKING (covers asphalt)
// ─────────────────────────────────────────────────────────────────────────────

const line_marking: SwmsTemplate = {
  hrceType: "Work in the vicinity of moving vehicles or mobile plant (traffic management)",
  licencesRequired: [
    "Traffic Management qualification (STMS or TCP, as required by the Traffic Management Plan)",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
    "Driver licence (for operating TMP vehicle)",
  ],
  plantsEquipment: [
    "Line marking machine (ride-on or walk-behind)",
    "Work vehicle (ute / van with flashing amber lights and TMP signage)",
    "Traffic cones, delineators, and signs (as per TMP)",
    "Arrow board / attenuator truck (where required)",
    "Stencils and templates",
    "Spray paint (water-based or solvent-based)",
    "Chalk / layout equipment",
    "Two-way radios",
  ],
  ppeRequired: [
    "Hi-viz vest (Class D — daytime; Class N — night work)",
    "Safety boots (steel cap)",
    "Safety glasses",
    "Gloves (nitrile for paint handling)",
    "Hearing protection (where equipment noise exceeds 85 dB)",
    "Sun protection (hat, sunscreen) for outdoor work",
    "Respirator (P2 for solvent-based paint in enclosed areas)",
  ],
  steps: [
    {
      step: "1. Site arrival & TMP set-up",
      hazard: "Moving traffic, plant striking workers during set-up",
      personsAtRisk: "All crew",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Arrow board / shadow vehicle positioned upstream before any personnel enter the carriageway.",
        isolate: "Set cones and signs as per the approved Traffic Management Plan (TMP). STMS verifies layout before crew enters.",
        admin: "All crew briefed on TMP, escape routes and emergency procedures before starting. Two-way radio communication maintained throughout. Hi-viz on before exiting the vehicle.",
        ppe: "Class D hi-viz, steel-cap boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Line layout & marking",
      hazard: "Paint fumes (solvent), slips on wet paint, traffic ingress through TMP",
      personsAtRisk: "Operator, traffic",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        substitute: "Use water-based paint where the job specification allows.",
        engineer: "Machine operator stays behind the machine — never in front. Keep pace with TMP — do not outrun the protection zone.",
        admin: "STMS monitors TMP at all times. Communicate machine movement via radio. Wet paint signs placed immediately after application.",
        ppe: "Hi-viz, safety glasses, nitrile gloves. P2 respirator for solvent-based paint.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Work near open traffic (no full lane closure)",
      hazard: "Vehicles entering the work zone, worker struck by errant vehicle",
      personsAtRisk: "All crew",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Maximum safe working distance from live traffic maintained as per NZTA Code of Practice. Shadow / attenuator vehicle upstream.",
        admin: "Designate escape routes for all crew — briefed before work starts. No worker to stand in the line of traffic. Radio check every 15 minutes.",
        ppe: "Class D hi-viz at all times.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Clean up & TMP removal",
      hazard: "Traffic re-entering work zone during TMP pack-down",
      personsAtRisk: "All crew",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Remove cones and signs in the correct sequence (furthest upstream last). Shadow vehicle remains until all crew are clear of traffic. STMS authorises each step of removal. Check paint is dry before cones are removed.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Sign off",
      hazard: "Equipment left on road surface, wet paint under traffic",
      personsAtRisk: "Motorists, crew",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Final site walk — confirm all TMP equipment removed. Paint dry and clearly visible. Sign out with PCBU 1. Notify NZTA or client of completion.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL (catch-all)
// ─────────────────────────────────────────────────────────────────────────────

const general: SwmsTemplate = {
  hrceType: "General construction work — update this field with the applicable high-risk work category for your task",
  licencesRequired: [
    "Trade qualification or apprenticeship (as applicable)",
    "White Card (General Construction Induction, where required)",
    "First Aid Certificate (within 2 years)",
  ],
  plantsEquipment: [
    "Power tools (guards in place, RCD on leads)",
    "Extension leads (tested and tagged in date)",
    "Ladder (inspected before use)",
    "Generator (petrol — outdoor use only)",
  ],
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Hard hat",
    "Safety glasses",
    "Gloves",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Site set-up",
      hazard: "Traffic, unknown ground conditions, overhead / underground services",
      personsAtRisk: "All workers on site",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Site induction / sign in. Identify any overhead and underground services with PCBU 1. Set up tool and material zone clear of traffic. Cones and signs where required.",
        ppe: "Hi-viz vest, safety boots, hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Perform work",
      hazard: "Trade-specific hazards — customise this step for your actual task",
      personsAtRisk: "Workers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Use appropriate guarding and equipment for the task.",
        admin: "Trained and competent workers only. Follow manufacturer instructions for all plant and equipment.",
        ppe: "Task-specific PPE as required.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Clean up & sign off",
      hazard: "Leftover materials, trip hazards, unsecured plant",
      personsAtRisk: "All site personnel",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Sweep / clear area. Remove all tools and materials. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const civil: SwmsTemplate = {
  hrceType: "Excavation work — trench or shaft excavation more than 1.5 m deep",
  licencesRequired: ["Traffic Management qualification (where TMP is required)", "Plant operator competency certificate (excavator, roller, grader)", "High Risk Work Licence — Rigging (where crane lifts are performed)"],
  plantsEquipment: ["Excavator", "Roller / compactor", "Dump truck / tipper", "Trench shoring / trench box", "Survey level and GPS", "Laser level", "Pneumatic hammer / rock breaker", "Water pump", "Traffic management devices (cones, barriers, signs)"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (Class D)", "Hard hat", "Safety glasses", "Gloves", "P2 dust mask (cutting or dry conditions)", "Hearing protection (plant operation)"],
  steps: [
    {
      step: "1. Pre-works — service location and TMP set-up",
      hazard: "Striking underground services; vehicle / pedestrian conflict",
      personsAtRisk: "All workers, public",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        eliminate: "Relocate work area if services cannot be safely avoided.",
        engineer: "Pothole to confirm service depths within 500 mm of any mapped service.",
        admin: "Dial Before You Dig (0800 474 335) confirmed. TMP implemented before any work starts. Site induction complete.",
        ppe: "Hi-viz Class D. Safety boots. Hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Excavation and earthmoving",
      hazard: "Trench collapse; plant striking workers; overhead powerlines",
      personsAtRisk: "Excavator operator, groundworkers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Trench box or shoring for excavations over 1.5 m deep. Boom height limiter near powerlines.",
        isolate: "Exclusion zone — no personnel within swing radius of excavator.",
        admin: "Spotter / banksman for all reversing plant. No entry to unsupported trench. Engineer sign-off for deep excavations.",
        ppe: "Hi-viz. Hard hat. Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Pipe / drainage installation",
      hazard: "Manual handling of pipes; trench entry; groundwater",
      personsAtRisk: "Groundworkers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Excavator to lower pipes. Pump groundwater before entry. Shoring maintained during pipe laying.",
        admin: "No entry to unsupported trench. Two-person team for pipe placement. Plan lift route before moving.",
        ppe: "Gloves. Safety boots. Hi-viz.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Backfill and compaction",
      hazard: "Plant strike; vibration; silica dust",
      personsAtRisk: "Groundworkers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Personnel clear of compactor operation zone.",
        admin: "Layer compaction to specification. Dust suppression (water) on dry fill.",
        ppe: "Hearing protection. P2 mask in dusty conditions. Hi-viz.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Reinstate and sign off",
      hazard: "Open excavation; traffic; trip hazards",
      personsAtRisk: "All workers, public",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Temporary reinstatement to safe trafficable standard. Remove TMP in reverse order. Sign out with PCBU 1.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const demolition: SwmsTemplate = {
  hrceType: "Demolition work on a structure that is load-bearing or may affect the structural integrity of the structure",
  licencesRequired: ["Demolition licence (Class A or B, WorkSafe NZ)", "Asbestos removal licence (where ACM is present)", "Plant operator competency"],
  plantsEquipment: ["Excavator / hydraulic demolition machine", "Concrete cruncher / pulveriser", "Skid steer loader", "Dust suppression system", "Air monitoring equipment", "PPE for asbestos (where required)"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "P2 respirator (dust)", "Heavy-duty gloves", "Hearing protection", "Tyvek overalls (asbestos adjacent work)"],
  steps: [
    {
      step: "1. Pre-demolition — services isolation and asbestos clearance",
      hazard: "Live services; asbestos disturbance; structural instability",
      personsAtRisk: "All workers, public",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        eliminate: "Licensed removalist removes all asbestos before demolition begins.",
        isolate: "All services isolated and capped by licensed trades. Asbestos clearance certificate on site.",
        admin: "Public exclusion zone / hoarding erected. Demolition sequence documented and approved. Site induction complete.",
        ppe: "Hard hat. Hi-viz. P2 respirator. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Hand strip and strip out",
      hazard: "Manual handling; dust; lead paint; falling debris",
      personsAtRisk: "Workers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Wet methods for dusty strip-out. Barricade drop zone below.",
        admin: "P2/P3 respirator. Two-person lift over 23 kg. Demolition sequence followed.",
        ppe: "P2/P3 respirator. Hard hat. Safety glasses. Gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Mechanical demolition",
      hazard: "Plant strike; structural collapse; debris projection",
      personsAtRisk: "Plant operator, groundworkers, public",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Strict exclusion zone — all personnel and public clear of demolition zone.",
        engineer: "Demolition sequence followed. Structural engineer on call for complex elements.",
        admin: "Spotter for all plant movement. No deviation from approved sequence without engineer sign-off.",
        ppe: "Hard hat. Hi-viz. Safety glasses. Hearing protection.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Waste segregation and removal",
      hazard: "Asbestos waste; sharp debris; manual handling",
      personsAtRisk: "Workers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Asbestos waste double-bagged, labelled, manifested and taken to approved disposal facility. Bins not overfilled.",
        ppe: "Gloves. Safety boots. Eye protection for debris handling.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Site make-safe and sign off",
      hazard: "Open excavations; unstable edges; public access",
      personsAtRisk: "Public, future workers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Perimeter hoarding or fencing maintained until handover.",
        admin: "Open pits covered or barricaded. Loose debris cleared. Sign out with PCBU 1.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const scaffolding: SwmsTemplate = {
  hrceType: "Work that involves a risk of a person falling more than 3 m — scaffolding erection and dismantling",
  licencesRequired: ["Scaffolding certificate — Basic, Intermediate or Advanced (as applicable to the scaffold type and height)"],
  plantsEquipment: ["Scaffold tube and fittings or system scaffold (Kwikstage, Ringlock)", "Scaffold boards (rated)", "Base plates and sole boards", "Scaffold ties and anchors", "Mobile scaffold (Aluminium or steel)", "Rope and pulley for material handling"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Safety harness and lanyard (certified anchor during erection/dismantling)", "Tool bags and lanyards for all hand tools"],
  steps: [
    {
      step: "1. Ground preparation and base plate set-up",
      hazard: "Unstable ground; underground services; vehicle access",
      personsAtRisk: "Scaffolders",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Ground bearing capacity assessed. Base plates on sole boards.",
        admin: "Dial Before You Dig confirmed. Site induction complete. Traffic cones around work zone.",
        ppe: "Safety boots. Hi-viz. Hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Erect standards, ledgers and transoms",
      hazard: "Falls during leading-edge erection; dropped tube and couplers; manual handling",
      personsAtRisk: "Scaffolders, workers below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Erection sequence — tie scaffold as height increases. Drop zone barricaded below.",
        admin: "Harness on certified anchor for leading-edge work above 3 m. Tool bags and lanyards on all tools. Team carry for long tubes.",
        ppe: "Harness and lanyard. Safety boots. Hard hat. Gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Install boards, toe boards and guardrails",
      hazard: "Falls through incomplete deck; leading edge exposure; dropped boards",
      personsAtRisk: "Scaffolders",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Install boards from below using pole system where possible. Mesh / kickboards on completed lifts.",
        admin: "Harness on anchor during leading-edge board installation. Tie scaffold before working on the next lift.",
        ppe: "Harness and lanyard. Safety boots. Hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Scaffold inspection and handover",
      hazard: "Defective scaffold handed over to users — fall or collapse risk",
      personsAtRisk: "All future users",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Licensed scaffolder inspects completed scaffold. Inspection tag completed and attached. Load rating marked. User briefed on permitted use.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Dismantling",
      hazard: "Falls; dropped materials; scaffold instability",
      personsAtRisk: "Scaffolders, workers below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Dismantle in strict reverse order of erection. Harness on anchor throughout dismantling. Lower materials by rope — do not throw. Drop zone barricaded.",
        ppe: "Harness and lanyard. Hard hat. Safety boots. Gloves.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const bricklaying: SwmsTemplate = {
  hrceType: "Work that involves a risk of a person falling more than 3 m (elevated scaffold work)",
  licencesRequired: ["Scaffolding certificate (where erecting scaffold)", "Forklift licence (where operating forklift for pallet deliveries)"],
  plantsEquipment: ["Angle grinder with masonry disc", "Block saw (wet)", "Mortar mixer / drum mixer", "Scaffold (tube or system)", "Block grab / block clamp", "Forklift (for deliveries)", "Brick trowels, jointers, levels"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Waterproof gloves (mortar work)", "P2 dust mask (masonry cutting)", "Hearing protection (cutting)", "Knee pads"],
  steps: [
    {
      step: "1. Set-up — materials, scaffold and mortar mix",
      hazard: "Manual handling (bricks and blocks); mortar chemical burns; unstable ground",
      personsAtRisk: "Bricklayers, labourers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Position pallets with forklift close to work face. Scaffold erected and inspection tag in date.",
        admin: "Team lift for blocks over 23 kg. Site induction complete.",
        ppe: "Waterproof gloves for mortar mixing. Safety boots. Hi-viz.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Cut masonry (angle grinder / block saw)",
      hazard: "Silica dust; noise; projectiles; hand contact with disc",
      personsAtRisk: "Bricklayer, nearby workers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Wet cutting — water suppression on all cuts. Dust extraction on block saw.",
        isolate: "Cordon off cutting area — 3 m exclusion.",
        admin: "Inspect disc before use. Guard in place. No dry cutting.",
        ppe: "P2 respirator. Safety glasses / face shield. Hearing protection. Gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Lay brickwork / blockwork",
      hazard: "Manual handling; mortar chemical burns; working at height",
      personsAtRisk: "Bricklayers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Scaffold / elevating platform for wall work above 1.5 m. Kickboards / toe boards installed.",
        admin: "Waterproof gloves for mortar. Scaffold inspection tag in date. Change cement-wet clothing immediately.",
        ppe: "Waterproof gloves. Safety boots. Hard hat. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazard: "Cement wash to stormwater; masonry offcuts; slips",
      personsAtRisk: "All workers",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Collect and neutralise cement waste before draining. Bag masonry offcuts. Sweep area. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const glazing: SwmsTemplate = {
  hrceType: "Work that involves a risk of a person falling more than 3 m",
  licencesRequired: ["Glazing qualification or supervised apprentice", "EWP operator licence (where EWP is used for elevated glazing)"],
  plantsEquipment: ["Suction cup lifters (vacuum, rated for panel weight)", "A-frame glass storage trolley", "Glazing trolley / dolly", "EWP or scaffold (for elevated work)", "Silicone gun", "Grinder / nibbler for aluminium"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Glass-handling gloves (leather or kevlar)", "Harness and lanyard (above 3 m)", "Hearing protection"],
  steps: [
    {
      step: "1. Glass delivery and storage",
      hazard: "Glass breakage during unloading; manual handling of large panels; lacerations",
      personsAtRisk: "Glaziers, delivery driver",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Use glazing trolley / crane for panels over 1.5 m². Store upright on padded A-frame on firm level ground.",
        admin: "Two-person minimum for large panels. Plan lift route before moving.",
        ppe: "Glass-handling gloves. Safety boots. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Frame and opening preparation",
      hazard: "Power tool cuts; aluminium swarf; dust; working at height",
      personsAtRisk: "Glaziers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Guards on all power tools. EWP or scaffold for elevated frames.",
        admin: "Inspect frame opening for sharp edges before glass placement. Cordon off area below overhead work.",
        ppe: "Safety glasses. Gloves. Hard hat. Harness above 3 m.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Glass placement and installation",
      hazard: "Glass cut during placement; panel drop; falls; wind loading",
      personsAtRisk: "Glaziers, workers below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Drop zone barricaded below all elevated glass installation — no bystanders.",
        engineer: "Suction cups — check load rating before use. Two-person minimum. Secure against wind gust before releasing.",
        admin: "Communicate before lifting. Glazing gloves on at all times.",
        ppe: "Glass-handling gloves. Safety boots. Safety glasses. Harness above 3 m.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Seal, clean and sign off",
      hazard: "Sealant fumes; sharp aluminium swarf; glass offcuts",
      personsAtRisk: "Glaziers",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        engineer: "Ventilate when applying silicone in enclosed spaces.",
        admin: "Rigid container for glass waste. Sweep aluminium swarf. Sign out with PCBU 1.",
        ppe: "Gloves. Safety glasses.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const plastering: SwmsTemplate = {
  hrceType: "Work at height — ceiling and wall plastering from scaffold above 3 m",
  licencesRequired: ["Plastering trade qualification or apprenticeship", "Scaffolding certificate (where erecting own scaffold)"],
  plantsEquipment: ["Mortar / compound mixer", "Vacuum sander (dustless)", "Stilts (flat surfaces only)", "Scaffold / trestle", "Spray texture machine", "Hawk and trowel, straight edges"],
  ppeRequired: ["Safety boots", "Safety glasses / goggles (mixing)", "P2 dust mask (sanding)", "Waterproof gloves (wet plaster)", "Knee pads", "Hearing protection"],
  steps: [
    {
      step: "1. Set-up and material staging",
      hazard: "Manual handling (plaster bags); chemical burns (lime / cement); slips on spills",
      personsAtRisk: "Plasterers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Mechanical mixer — never hand-mix heavy batches. Position materials close to work face.",
        admin: "Drop sheets on all floors before starting. Team lift for bags over 23 kg.",
        ppe: "Waterproof gloves for mixing. Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Apply stop and plaster coats",
      hazard: "Chemical burns (lime / gypsum); working at height; slips on wet compound",
      personsAtRisk: "Plasterers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Scaffold / trestle inspection tag in date. Stilts on flat surfaces only.",
        admin: "Waterproof gloves and eye protection during mixing and application. Wet floor signs on drop-sheet areas.",
        ppe: "Waterproof gloves. Safety glasses. Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Sand and finish coats",
      hazard: "Gypsum / silica dust inhalation; working at height",
      personsAtRisk: "Plasterers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Vacuum sander (dustless) as first preference. Seal room off during sanding.",
        admin: "P2 respirator mandatory during all sanding. No dry sweeping.",
        ppe: "P2 respirator. Safety glasses. Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazard: "Wet compound spills (slips); dust; contaminated waste",
      personsAtRisk: "All workers",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "HEPA vacuum dry dust — no dry sweeping. Collect wet compound. Remove drop sheets. Dry floors. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const tiling: SwmsTemplate = {
  hrceType: "Work involving hazardous substances — tile adhesives and acid cleaners",
  licencesRequired: ["Tiling trade qualification or apprenticeship"],
  plantsEquipment: ["Wet tile saw", "Angle grinder with diamond blade", "Tile cutter (manual / score-and-snap)", "Mixing drill and paddle", "Grout float and sponge", "Suction cup lifter (large format tiles)"],
  ppeRequired: ["Safety boots (steel cap)", "Safety glasses", "Cut-resistant gloves (tile handling)", "Waterproof gloves (adhesive / grout)", "P2 dust mask (cutting)", "Rubber gloves and face shield (acid cleaning)", "Knee pads"],
  steps: [
    {
      step: "1. Surface preparation",
      hazard: "Dust from grinding / scarifying substrate; chemical primer exposure; manual handling",
      personsAtRisk: "Tilers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Vacuum grinder for surface prep. Apply primer with brush / roller.",
        admin: "P2 respirator for prep dust. Waterproof gloves for primer. Team lift for substrate boards.",
        ppe: "P2 respirator. Gloves. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Cut tiles",
      hazard: "Silica dust from tile cutting; noise; projectile tile fragments; lacerations",
      personsAtRisk: "Tilers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Wet saw preferred — water suppression on all cuts. No dry cutting.",
        isolate: "Cordon off cutting area.",
        admin: "P2 respirator mandatory. Inspect disc / blade before use.",
        ppe: "P2 respirator. Face shield / safety glasses. Hearing protection. Cut-resistant gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Lay tiles with adhesive",
      hazard: "Skin / eye contact with adhesive; manual handling (heavy format tiles); knee strain",
      personsAtRisk: "Tilers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Vacuum cup lifter for large-format tiles over 15 kg.",
        admin: "Ventilate in enclosed spaces. Knee pads for floor tiling.",
        ppe: "Waterproof gloves. Safety glasses. Knee pads.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Grout and acid clean",
      hazard: "Grout skin / eye irritation; acid cleaner — corrosive burns and fumes",
      personsAtRisk: "Tilers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Ventilate before and during acid cleaning. Eye wash on site.",
        admin: "Never mix acid with bleach. Dilute per label. Read SDS before use.",
        ppe: "Rubber gloves. Face shield. Apron. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazard: "Wet floor (slips); sharp tile offcuts; adhesive fumes",
      personsAtRisk: "All workers",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Rigid container for tile offcuts. Mop and dry floor. Ventilate. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const insulation: SwmsTemplate = {
  hrceType: "Work involving confined spaces — roof voids and sub-floor areas",
  licencesRequired: ["Insulation installer competency or on-the-job training", "Asbestos awareness training"],
  plantsEquipment: ["Blow-in insulation machine (where used)", "Hand stapler / brad nailer", "Torch / head lamp", "Measuring tape and knife", "Respirator"],
  ppeRequired: ["Safety boots", "Safety glasses", "P2 respirator (glasswool)", "Long-sleeved work shirt (glasswool)", "Gloves (glasswool)", "Knee pads (sub-floor work)"],
  steps: [
    {
      step: "1. Inspect roof space / sub-floor before entry",
      hazard: "Asbestos (pre-2000 buildings); live wiring; CO gas from gas appliances; unsafe access",
      personsAtRisk: "Insulators",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Ventilate roof space 10 min before entry. Gas test where gas appliances are present.",
        admin: "Visual inspection from hatch before entry. Confirm no ACM lagging or loose fill. Identify live wiring and downlights. Asbestos awareness — stop work if suspected.",
        ppe: "P2 respirator. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Install ceiling / wall / underfloor insulation",
      hazard: "Glasswool fibre skin / eye / respiratory irritation; working in roof space; falls through ceiling",
      personsAtRisk: "Insulators",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Supported plank in roof space — never step on plasterboard. Sub-floor standby person maintains comms.",
        admin: "Long sleeves and gloves for glasswool. P2 respirator throughout. Do not disturb suspected ACM.",
        ppe: "P2 respirator. Long sleeves. Gloves. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Clear zones — downlights, junction boxes",
      hazard: "Fire from insulation contact with recessed lights or junction boxes",
      personsAtRisk: "Building occupants",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Maintain 25 mm clearance around all recessed lights unless IC-rated. Never cover junction boxes or distribution boards.",
        admin: "Check rating plate on downlights before covering.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazard: "Glasswool fibres on skin; trip hazards from offcuts",
      personsAtRisk: "Insulators",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Wash hands and arms. Remove and bag offcuts. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const hvac: SwmsTemplate = {
  hrceType: "Work involving refrigerants (EPA-regulated); work at height; confined spaces",
  licencesRequired: ["NZ EPA refrigerant handler certification", "NZ Certificate in Refrigeration and Air Conditioning or equivalent", "Licensed electrician (for electrical connections)", "EWP operator licence (where EWP is used)"],
  plantsEquipment: ["Refrigerant recovery unit", "Refrigerant cylinders (recovery and charge)", "Manifold gauge set", "Vacuum pump", "Pipe bender and flare tool", "EWP or scaffold", "Multimeter and clamp meter"],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat (where required)", "Safety glasses", "Cryo-gloves and face shield (refrigerant handling)", "Hearing protection", "Harness and lanyard (above 3 m)"],
  steps: [
    {
      step: "1. Site set-up and isolation",
      hazard: "Live electrical; refrigerant leak from existing system; manual handling (heavy units)",
      personsAtRisk: "HVAC technicians",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "LOTO on electrical panel before working on indoor units. Recover refrigerant before cutting pipes.",
        engineer: "Crane or telehandler for condensing units over 23 kg.",
        admin: "Two-person team for heavy lifts. Site induction complete.",
        ppe: "Cryo-gloves and face shield for refrigerant work. EH-rated boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Install ducting, pipework and equipment",
      hazard: "Manual handling; working at height; sheet metal cuts (duct)",
      personsAtRisk: "HVAC technicians",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "EWP or scaffold for ceiling / roof work. Crane for heavy units.",
        admin: "Team lift for units over 23 kg. Harness above 3 m.",
        ppe: "Gloves for duct handling. Safety glasses. Harness. Hard hat.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Refrigerant recovery, vacuuming and charging",
      hazard: "Refrigerant release — skin freeze burns; asphyxiation in enclosed plant room",
      personsAtRisk: "Refrigeration technician",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Recovery unit on site — never vent refrigerant to atmosphere. Ventilate plant room before and during work.",
        admin: "NZ EPA certified handler only. Check manifold hoses for leaks before connecting.",
        ppe: "Cryo-gloves and full face shield. EH-rated safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Electrical connections and commissioning",
      hazard: "Live circuits; incorrect wiring; unintended energisation",
      personsAtRisk: "Electrician, HVAC tech",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "LOTO maintained until wiring is verified. Test for dead before touching.",
        admin: "Licensed electrician for all mains connections. Commission and test in sequence.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazard: "Refrigerant cylinder handling; tool trip hazards; uncommissioned systems energised",
      personsAtRisk: "All workers, building occupants",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Log recovery cylinder. Replace all electrical covers. Sign out with PCBU 1. Provide client handover documentation.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const fire_protection: SwmsTemplate = {
  hrceType: "Work at height — ceiling installation above 3 m; pressure testing of fire systems",
  licencesRequired: ["NZ Fire recognised installer / commissioner", "Licensed electrician (alarm panel connections)", "EWP operator licence (where EWP is used)"],
  plantsEquipment: ["Pipe threading machine", "Pipe wrench and cutter", "Hydraulic test pump (pressure testing)", "EWP or scaffold", "Drill press / right-angle drill", "Fire alarm tester"],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Harness and lanyard (above 3 m)", "Hearing protection"],
  steps: [
    {
      step: "1. Isolate system and set up",
      hazard: "Accidental sprinkler activation; live electrical; slip on wet floor",
      personsAtRisk: "All workers, building occupants",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Confirm isolation with building manager. LOTO on electrical panel. Cap all open sprinkler heads.",
        admin: "Notify building manager and fire monitoring company before work. Site induction complete.",
        ppe: "Safety boots. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Install pipework and sprinkler heads",
      hazard: "Working at height; manual handling (long pipe sections); cutting swarf",
      personsAtRisk: "Sprinkler installers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "EWP or scaffold for overhead installation. Harness above 3 m.",
        admin: "Two-person team for long pipe sections. Eye protection for pipe cutting.",
        ppe: "Harness. Hard hat. Safety glasses. Gloves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Pressure test",
      hazard: "High pressure water / nitrogen; fitting failure; hearing damage",
      personsAtRisk: "Installers, building occupants nearby",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Test to design specification only. Calibrated test gauge.",
        admin: "Stand clear of fittings under pressure. No bystanders in test zone. Record test results.",
        ppe: "Safety glasses. Hearing protection.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Commission and handover",
      hazard: "Alarm activation causing panic; suppressant accidental discharge; live electrical",
      personsAtRisk: "Building occupants",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Notify building occupants before any alarm test. Evacuate affected areas for suppressant tests. Licensed electrician signs off alarm panel. Record and sign off.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazard: "Wet floors (slips); pipe offcuts; sharp fittings",
      personsAtRisk: "All workers",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Mop and dry wet areas. Bag offcuts. Fire stop all penetrations. Sign out with PCBU 1. Leave as-built drawings.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const security: SwmsTemplate = {
  hrceType: "Work at height — CCTV and access control installation above 3 m",
  licencesRequired: ["Security installation competency (NZSA recognised)", "Licensed electrician (supervised — for mains connections)"],
  plantsEquipment: ["Cable drum stand", "Fish tape and conduit rods", "Drill / hammer drill", "Cable stripper and crimper tools", "Laptop for programming", "Ladder or EWP"],
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Safety glasses", "Gloves", "P2 dust mask (drilling into concrete)", "Harness and lanyard (above 3 m)"],
  steps: [
    {
      step: "1. Site survey and cable route planning",
      hazard: "Asbestos in pre-2000 ceiling spaces; live cable trays; unknown services",
      personsAtRisk: "Security installers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Check building age — assume asbestos in pre-2000 buildings. Identify live cable routes with PCBU 1. Site induction complete.",
        ppe: "P2 respirator in older ceiling spaces. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Cable installation",
      hazard: "Working at height; electrical exposure in live cable trays; manual handling (cable drums)",
      personsAtRisk: "Security installers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "LOTO on live cable trays before working.",
        engineer: "Cable drum on stand — not on floor. EWP or stable ladder for elevated cable runs.",
        admin: "Harness above 3 m. Three points of contact on ladder.",
        ppe: "Safety glasses. Gloves. Harness and lanyard (above 3 m). EH-rated boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Device installation (cameras, panels, sensors)",
      hazard: "Working at height; drilling dust; electrical connections",
      personsAtRisk: "Security installers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "EWP or stable ladder. Harness above 3 m.",
        admin: "P2 respirator for drilling into concrete or masonry. Licensed electrician for mains power.",
        ppe: "P2 respirator. Safety glasses. Harness. Hard hat where required.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Commission, test and sign off",
      hazard: "Live electrical; alarm activation; uncommissioned access points",
      personsAtRisk: "Occupants, installers",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Notify occupants before alarm testing. Test in sequence. Fire-stop all penetrations through fire-rated walls. Sign out with PCBU 1.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const landscaping: SwmsTemplate = {
  hrceType: "Work involving plant and machinery — ride-on mowers, chippers, and small plant",
  licencesRequired: ["Approved Handler Certificate (where applying ACVM-registered herbicides)", "Chainsaw certificate (where chainsaws are used)"],
  plantsEquipment: ["Ride-on mower", "Pedestrian mower", "Line trimmer / brushcutter", "Wood chipper", "Hedge trimmer", "Mini-excavator (where earthworks involved)", "Pressure washer", "Sprayer (herbicide / fertiliser)"],
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Safety glasses", "Hearing protection (Class 5 — machinery)", "Nitrile gloves (chemical handling)", "Sun hat and sunscreen SPF50+", "P2 dust mask (paver / concrete cutting)"],
  steps: [
    {
      step: "1. Site inspection and pre-start machinery check",
      hazard: "Hidden hazards (rocks, irrigation, children's toys); machinery defects",
      personsAtRisk: "Landscapers, bystanders",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Walk the entire area before mowing. Remove or mark rocks, holes and irrigation heads. Pre-start checklist on all machinery. Confirm children and pets are inside.",
        ppe: "Safety boots. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Mowing and trimming",
      hazard: "Flying debris (projectiles); rollover on slopes; noise; hand-arm vibration",
      personsAtRisk: "Operators, bystanders",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "ROPS on ride-on mowers — in locked position. Solid deck guards in place.",
        isolate: "Bystanders 15 m clear of mowing and trimming operations.",
        admin: "Assess slopes — mow parallel to contour or use weed-eater on steep slopes. No passengers on ride-on.",
        ppe: "Safety glasses. Hearing protection (Class 5). Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Chemical application (herbicide / fertiliser)",
      hazard: "Skin / eye contact; inhalation; spray drift to bystanders and waterways",
      personsAtRisk: "Operator, bystanders",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Read SDS and label before use. Mix per label rate. Do not spray in wind above 15 km/h. Notify occupants of spray program.",
        ppe: "Nitrile gloves. Safety glasses. Long sleeves. Approved Handler Certificate.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Hard landscaping and earthworks (where applicable)",
      hazard: "Manual handling (pavers, sleepers); silica dust (cutting); plant operation",
      personsAtRisk: "Landscapers",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        engineer: "Mechanical aid (mini-excavator, pallet jack) for heavy items. Wet cutting for pavers.",
        admin: "Team lift over 23 kg. P2 respirator for paver cutting. Exclusion zone around mini-excavator.",
        ppe: "P2 mask. Gloves. Safety glasses. Safety boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazard: "Chemical waste; machinery left running; sharp green waste",
      personsAtRisk: "Landscapers, public",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Engine off, keys out before leaving machinery unattended. Triple-rinse sprayer. Dispose of chemical waste per label. Bag green waste per site requirements. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const cleaning: SwmsTemplate = {
  hrceType: "Work at height — external window cleaning or EWP use above 3 m",
  licencesRequired: ["EWP operator licence (where EWP is used for window cleaning)", "Approved Handler Certificate (where using ACVM-registered cleaning agents)"],
  plantsEquipment: ["Cleaning trolley", "Mop and bucket", "Vacuum cleaner (HEPA)", "EWP or ladder (for high-level cleaning)", "Pressure washer", "Sprayer / backpack"],
  ppeRequired: ["Non-slip safety boots / footwear", "Hi-viz vest (external / public areas)", "Nitrile gloves (chemicals)", "Rubber gloves and face shield (acid cleaning)", "Safety glasses", "P2 respirator (mould remediation)", "Harness and lanyard (external height work)"],
  steps: [
    {
      step: "1. Chemical check and area set-up",
      hazard: "Wrong chemical selected; improper mixing; bystander exposure",
      personsAtRisk: "Cleaners, building occupants",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Read SDS before using any product. Never mix bleach with acid. Correct dilution per label. Notify occupants of treatment areas. Wet floor signs placed before mopping.",
        ppe: "Nitrile gloves. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Internal cleaning",
      hazard: "Slips on wet floors; chemical exposure; biological hazard (sharps, blood)",
      personsAtRisk: "Cleaners",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Section-by-section mopping — leave dry path. Non-slip footwear. Sharps in rigid container. Double-bag biological waste. Ventilate when using strong chemicals.",
        ppe: "Nitrile gloves. Safety glasses. Non-slip boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. High-level and external cleaning",
      hazard: "Falls from height; dropped cleaning equipment; chemical splash",
      personsAtRisk: "Cleaners, public below",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Licensed EWP operator. Harness on anchor for external work above 3 m.",
        isolate: "Spotter / barricade below elevated cleaning work.",
        admin: "Inspect ladder before use. Three points of contact. Tool lanyard on squeegee and equipment.",
        ppe: "Harness. Safety glasses. Non-slip boots.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Waste removal",
      hazard: "Sharps in waste; biological contamination; heavy bins",
      personsAtRisk: "Cleaners",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Trolley for bins. Never reach blind into waste bags. Sharps in rigid container only. Double-bag biological waste. Wash hands after.",
        ppe: "Nitrile gloves. Safety glasses.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Sign off",
      hazard: "Wet floors; chemical residue; equipment left running",
      personsAtRisk: "All workers, occupants",
      initialLikelihood: "Low",
      initialConsequence: "Low",
      initialRisk: "Low",
      controlMeasures: {
        admin: "Remove wet floor signs only when dry. Secure all chemicals in vehicle. Equipment off and stored. Sign out with PCBU 1.",
      },
      residualRisk: "Very Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const welding: SwmsTemplate = {
  hrceType: "Hot work — welding, cutting and heating that may cause fire or explosion",
  licencesRequired: ["NZQA welding qualification or recognised industry competency", "Hot work permit (site-specific — where required by PCBU 1)", "Oxy-acetylene operator competency"],
  plantsEquipment: ["MIG / TIG / stick welder", "Angle grinder", "Oxy-acetylene set with flashback arrestors", "Local exhaust ventilation (LEV) / fume extractor", "Welding screens / curtains", "Fire extinguisher (CO2 or dry powder)", "Chipping hammer and wire brush"],
  ppeRequired: ["Safety boots (steel cap)", "Auto-darkening welding helmet (correct shade)", "Leather welding gloves", "Flame-resistant long-sleeved shirt", "Safety glasses (under helmet)", "Leather / flame-resistant apron", "P3 respirator (fumes in confined / enclosed spaces)", "Hearing protection (grinding)"],
  steps: [
    {
      step: "1. Hot work permit and area preparation",
      hazard: "Sparks igniting flammable materials; bystanders exposed to arc radiation",
      personsAtRisk: "Welders, nearby workers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        eliminate: "Remove all flammable materials within 10 m of welding zone.",
        isolate: "Welding screens / curtains placed to protect bystanders from arc radiation.",
        admin: "Hot work permit obtained where required by PCBU 1. Fire extinguisher immediately accessible.",
        ppe: "Flame-resistant clothing. Leather gloves. Auto-darkening helmet.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Set up welding equipment and gas cylinders",
      hazard: "Electric shock from welding plant; oxy-acetylene hose failure / flashback; cylinder topple",
      personsAtRisk: "Welder",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Inspect leads and hoses before use. Flashback arrestors on both oxy and acetylene hoses. Cylinders chained upright. GFCI on mains supply.",
        admin: "Never grease oxygen fittings. No smoking within 5 m of cylinders. Open cylinder valves slowly.",
        ppe: "Gloves. Safety glasses during set-up.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Weld / cut",
      hazard: "Welding fumes; arc radiation; fire; electric shock; hot metal",
      personsAtRisk: "Welder, nearby workers",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "LEV / fume extractor positioned at source. Ventilate enclosed spaces.",
        admin: "P3 respirator in enclosed or poorly ventilated spaces. No welding on galvanised or coated metals without LEV and P3.",
        ppe: "Auto-darkening helmet (correct shade). Leather gloves. Flame-resistant shirt. Apron. P3 respirator where required.",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Angle grind and finish",
      hazard: "Disc fragmentation; sparks; cuts; noise; vibration",
      personsAtRisk: "Welder",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        engineer: "Correct disc for task — never use cutting disc for grinding. Guard in place. Inspect disc — no cracks.",
        admin: "Stand to the side of the disc plane. Do not over-force the grinder.",
        ppe: "Face shield and safety glasses. Leather gloves. Hearing protection.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Fire watch and sign off",
      hazard: "Smouldering materials after welding; hot metal contact by others",
      personsAtRisk: "All workers",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "30-minute fire watch after welding — mandatory. Label hot metal 'HOT — DO NOT TOUCH'. Close cylinder valves and bleed lines. Remove welding screens. Sign out with PCBU 1.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

const pest_control: SwmsTemplate = {
  hrceType: "Work involving hazardous substances — HSNO controlled pesticides; confined space entry",
  licencesRequired: ["Approved Handler Certificate (HSNO controlled substances)", "Pest management qualification or industry certification (NZPMA)", "Confined Space Entry certificate (where applicable)", "EWP operator licence (where used for roof access)"],
  plantsEquipment: ["Knapsack / motorised sprayer", "Bait station applicator", "Fumigation equipment (where used)", "Gas detector", "Confined space rescue kit", "Harness and anchor (roof access)"],
  ppeRequired: ["Safety boots", "Hi-viz vest (site areas)", "Nitrile gloves", "Safety glasses / goggles", "P2 respirator (confined space / infested areas)", "Tyvek overalls (fumigation or infested areas)", "Harness and lanyard (roof / height access)"],
  steps: [
    {
      step: "1. Site inspection and treatment planning",
      hazard: "Unknown confined spaces; bystander exposure; chemical selection errors",
      personsAtRisk: "Pest controller, occupants",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Inspect site before treatment. Identify confined spaces, heights and sensitive areas. Select correct chemical per pest, label and SDS. Notify occupants / building manager before treatment.",
      },
      residualRisk: "Low",
    },
    {
      step: "2. Mix and prepare chemicals",
      hazard: "Skin / eye contact during mixing; spills; incorrect concentration",
      personsAtRisk: "Pest controller",
      initialLikelihood: "Medium",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        admin: "Read SDS. Mix per label rate only. Approved Handler Certificate mandatory. Do not overfill tank.",
        ppe: "Nitrile gloves. Safety glasses. Long sleeves.",
      },
      residualRisk: "Low",
    },
    {
      step: "3. Apply treatment",
      hazard: "Chemical exposure; spray drift; confined space hazards; working at height",
      personsAtRisk: "Pest controller, bystanders",
      initialLikelihood: "High",
      initialConsequence: "High",
      initialRisk: "High",
      controlMeasures: {
        isolate: "Cordon off treatment area — no bystanders during application. Confined space permit for void entry.",
        admin: "Wind check for outdoor spray — max 15 km/h. Harness above 3 m. Gas test before confined space entry. Standby person for confined space.",
        ppe: "Nitrile gloves. Safety glasses. P2 respirator (confined space). Harness (height access).",
      },
      residualRisk: "Low",
    },
    {
      step: "4. Install / check bait stations",
      hazard: "Rodent carcasses (biological); chemical bait exposure; confined space",
      personsAtRisk: "Pest controller",
      initialLikelihood: "Medium",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Nitrile gloves. P2 respirator in infested areas. Double-bag carcasses. Secure bait stations — tamper-resistant where children or non-target animals are present.",
        ppe: "Nitrile gloves. P2 respirator.",
      },
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazard: "Chemical waste disposal; contaminated PPE; residual treatment in occupied areas",
      personsAtRisk: "Pest controller, occupants",
      initialLikelihood: "Low",
      initialConsequence: "Medium",
      initialRisk: "Medium",
      controlMeasures: {
        admin: "Triple-rinse spray equipment. Dispose of chemical waste per label and council requirements. Remove contaminated PPE carefully. Leave service report with PCBU 1. Sign out.",
      },
      residualRisk: "Low",
    },
  ],
  emergencyContacts: STANDARD_EMERGENCY_CONTACTS,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, SwmsTemplate> = {
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

export function getSwmsTemplate(tradeKey: string | null | undefined): SwmsTemplate {
  if (!tradeKey) return general;
  return TEMPLATES[tradeKey] ?? general;
}
