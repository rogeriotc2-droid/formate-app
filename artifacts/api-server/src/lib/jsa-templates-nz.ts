/**
 * Trade-specific starter templates for new JSA documents (NZ/AU).
 *
 * When a tradie creates their first JSA we seed it with a standard work
 * description, job steps, hazards, controls and PPE for their trade.
 * They review on job 1 — sticky fields carry their version forward from then on.
 *
 * Field keys MUST match JsaData in artifacts/safeiq/src/pages/jsa/detail.tsx.
 */

type JsaStep = {
  step: string;
  hazards: string;
  controls: string;
  risk: string;
  residualRisk: string;
};

export type JsaNzTemplate = {
  workDescription: string;
  ppeRequired: string[];
  steps: JsaStep[];
  emergencyPlan: string;
  musterPoint: string;
  permitRequired: string;
};

const STANDARD_EMERGENCY_PLAN =
  "1) Stop work. Make the area safe.\n" +
  "2) Call 111 for serious injury, fire or major spill.\n" +
  "3) Notify the site supervisor / PCBU 1 immediately.\n" +
  "4) Administer first aid as trained — do not move the injured person unless in immediate danger.\n" +
  "5) Notify WorkSafe NZ (0800 030 040) for notifiable events (serious injury, death, dangerous incident).\n" +
  "6) Preserve the scene for investigation.";

const STANDARD_MUSTER = "Confirm on site induction — typically front gate or car park area.";

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICAL
// ─────────────────────────────────────────────────────────────────────────────

const electrical: JsaNzTemplate = {
  workDescription:
    "Electrical installation, fault-finding, maintenance and testing — including wiring, switchboards, circuits and connected equipment. All work performed by EWRB-registered electricians.",
  permitRequired: "Electrical Isolation Permit",
  ppeRequired: [
    "Safety boots (EH-rated)",
    "Hi-viz vest",
    "Hard hat (where required on site)",
    "Safety glasses",
    "Insulated gloves (Class 0 minimum for LV work)",
    "Arc-rated clothing (for live work or switchboard opening)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Site arrival & circuit isolation",
      hazards: "Live circuits, electric shock, arc flash, unknown site conditions",
      controls:
        "Site induction / sign in. Identify circuit and isolation point. Apply LOTO — lock at the board, tag with personal lock. Test for dead (live → dead → live) before touching any conductor. Insulated tools only.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Inspect leads and RCDs",
      hazards: "Damaged leads, faulty RCDs — electric shock or fire",
      controls:
        "Visual check of every lead before use — no exposed wire, cuts or damaged plugs. Test & tag in date (check tag colour). RCD plugged in and tested on every lead before use. Replace any damaged lead immediately.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "3. Perform electrical work",
      hazards: "Electric shock, arc flash, working at height, power tool injuries, cuts",
      controls:
        "Maintain LOTO throughout. Treat all circuits as live until tested dead. Trained and registered electrician only. Keep others clear of the work area. Inspect ladder before use — three points of contact. Harness above 3 m. RCD on every lead. Eye protection when using power tools.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Test & commission",
      hazards: "Re-energising, live testing, incorrect sequence",
      controls:
        "Test in correct sequence: insulation resistance → polarity → earth fault loop → RCD trip time. Communicate to site before re-energising. Trained electrician only. Insulated gloves and safety glasses.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazards: "Exposed terminals, offcuts, trip hazards, live circuits",
      controls:
        "Cap or cover all exposed terminals. Remove LOTO only after verifying work is complete and area is safe. Sweep area. Tools to vehicle. Sign out with PCBU 1. Issue Certificate of Compliance where required.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// PLUMBING (covers gas_fitting, drainage)
// ─────────────────────────────────────────────────────────────────────────────

const plumbing: JsaNzTemplate = {
  workDescription:
    "Plumbing, drainage and gasfitting — installation, maintenance and repair of hot/cold water, drainage, sanitary and gas systems. All work performed by PGDB-registered practitioners.",
  permitRequired: "No",
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Safety glasses",
    "Nitrile gloves (drainage / sewage work)",
    "Leather gloves (general)",
    "Knee pads",
    "P2 respirator (asbestos suspicion — pre-2000 buildings)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Site arrival & isolation",
      hazards: "Live water or gas supply, unknown site conditions",
      controls:
        "Site induction / sign in. Locate water main, gas meter and electrical panel with PCBU 1. Shut off water or gas at the main. Tag the valve. Confirm isolation before cutting.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "2. Drain down / depressurise",
      hazards: "Residual pressure, scalding water, sewage exposure",
      controls:
        "Open lowest drain point. Allow full pressure release. Let hot water cool before opening fittings. Capture contaminated water — do not discharge to stormwater. Nitrile gloves, safety glasses, apron for sewage work.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "3. Cut & install",
      hazards: "Sharps (pipe offcuts), solvent cement fumes, manual handling",
      controls:
        "Cut-resistant gloves when handling cut pipe. Use PVC solvent cement in a well-ventilated area — keep lid on when not in use. Two-person lift for items over 23 kg. Trolley / pipe jacks for heavy cylinders and fixtures.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "4. Gas work — braze & leak test",
      hazards: "Gas leak, explosion, burns from brazing torch, LPG cylinder",
      controls:
        "Certifying Gasfitter only. Isolate gas at meter or cylinder valve. No ignition sources in the work area. Calibrated gas detector used before and after brazing. Soap-test all joints after commissioning. Cylinder upright and secured at all times. Face shield for brazing.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Pressure test & commission",
      hazards: "Sudden release of pressurised water or gas",
      controls:
        "Test to specification — never over-pressure. Stand clear of fittings during test. Record test pressure and hold time. Tempering valve commissioned to 55°C max. Issue gas safety certificate where required.",
      risk: "Low",
      residualRisk: "Very Low",
    },
    {
      step: "6. Clean up & sign off",
      hazards: "Wet floors (slips), pipe offcuts (sharps), contaminated water",
      controls:
        "Mop or dry wet areas. Bag all offcuts and sharps. Remove tools to vehicle. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// CARPENTRY
// ─────────────────────────────────────────────────────────────────────────────

const carpentry: JsaNzTemplate = {
  workDescription:
    "Carpentry and joinery — framing, fix-out, decking, formwork, cabinetry installation and repairs. All restricted building work performed by a Licensed Building Practitioner (LBP).",
  permitRequired: "No",
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
      hazards: "Traffic, overhead / underground services, unsecured materials",
      controls:
        "Site induction / sign in. Identify all overhead and underground services with PCBU 1. Set up tool and material zone clear of pedestrian and vehicle paths. Cones and signs where required. Hi-viz vest, safety boots, hard hat.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "2. Set out & cut",
      hazards: "Saw cuts, kickback, wood dust, noise",
      controls:
        "Guards in place and operational on all power saws. RCD on every lead. Workpiece secured with clamps before cutting. Push stick for narrow rips on table saw. Trained operator only. Safety glasses, hearing protection (Class 5), P2 dust mask, cut-resistant gloves.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Fix / install (nail gun, framing, fix-out)",
      hazards: "Nail gun injury, falls from height, manual handling",
      controls:
        "Sequential trip trigger only on nail guns — no bypassing the safety. Harness anchored to a certified point above 3 m. No one below while fixing overhead. Scaffold inspected and tagged in date. Two-person lift for sheet material over 23 kg.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Treated timber handling",
      hazards: "Skin and eye contact with preservative (CCA / ACQ)",
      controls:
        "Cut outdoors or in ventilated area. Do not burn offcuts. Wash hands and arms before eating, drinking or smoking. Gloves and P2 dust mask when cutting treated timber.",
      risk: "Low",
      residualRisk: "Very Low",
    },
    {
      step: "5. Clean up & sign off",
      hazards: "Loose nails, offcuts, trip hazards",
      controls:
        "Sweep area. Magnet-sweep for loose nails. Bag offcuts. Leads coiled and off the floor. Tools to vehicle. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOFING
// ─────────────────────────────────────────────────────────────────────────────

const roofing: JsaNzTemplate = {
  workDescription:
    "Roofing installation, repair and re-roofing — including metal, tile, membrane, flashings and spouting. All work at height performed with compliant fall protection.",
  permitRequired: "Working at Heights Permit",
  ppeRequired: [
    "Safety boots (non-slip sole)",
    "Hi-viz vest",
    "Hard hat (on scaffold and below roof work)",
    "Safety glasses",
    "Safety harness and lanyard (above 3 m)",
    "Cut-resistant gloves (metal roofing)",
    "Sunscreen and hat (outdoor sun exposure)",
    "Hearing protection",
  ],
  steps: [
    {
      step: "1. Pre-start — roof condition and weather check",
      hazards: "Fragile roofing, wet surfaces, wind, unknown structural condition",
      controls:
        "Visual inspection of roof from below before access. Check weather forecast — no work in rain, ice or gusts above 40 km/h. Confirm structural condition with PCBU 1 for fragile roofs. Non-slip safety boots.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Set up fall protection and barricades",
      hazards: "Falls from open edges, skylights, fragile sections, dropped tools",
      controls:
        "Install guardrails (min 900 mm) on all open edges before roof access. Cover or barrier all skylights before any person is on the roof. Barricade drop zone on the ground below — no personnel in the drop zone. Harness anchored to a certified anchor above 3 m. Tool lanyards on all tools used on the roof.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Ladder and scaffold access",
      hazards: "Falls from ladder, overloaded scaffold",
      controls:
        "Ladder extends 1 m above the roof edge. Secured at top and footed. Scaffold inspected and tag in date. Three points of contact on ladder. One person at a time. Do not over-reach.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Install roofing material",
      hazards: "Cuts from metal edges, dropped sheets, falls, noise",
      controls:
        "Kickboards on scaffold edge to prevent material falling. Drop zone barricaded below. Communicate before moving large sheets — clear below. Two-person carry for sheets over 2.4 m. Cut-resistant gloves for metal roofing. Hearing protection when using grinder or nail gun.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & TMP removal",
      hazards: "Loose offcuts, screws and nails on the roof, sharp waste",
      controls:
        "Collect all offcuts, screws and nails from the roof before descending. Remove drop zone barricades. Magnet-sweep the ground. Remove fall protection in reverse order. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// PAINTING
// ─────────────────────────────────────────────────────────────────────────────

const painting: JsaNzTemplate = {
  workDescription:
    "Interior and exterior painting, surface preparation and coating application — including sanding, priming and topcoating. All lead paint and asbestos-related work managed per WorkSafe NZ guidelines.",
  permitRequired: "No",
  ppeRequired: [
    "Safety boots",
    "Hi-viz vest",
    "Safety glasses / chemical splash goggles",
    "P2 respirator (oil-based paint, sanding, enclosed spaces)",
    "P3 / full-face respirator (spray painting, confirmed lead paint)",
    "Disposable overalls (spray work)",
    "Nitrile gloves (solvents, thinners)",
    "Harness and lanyard (above 3 m on scaffold)",
    "Hearing protection (spray equipment)",
  ],
  steps: [
    {
      step: "1. Surface preparation — sand, scrape, wash",
      hazards: "Dust (silica, lead particles), asbestos, solvent fumes",
      controls:
        "Pre-2000 buildings — assume asbestos until tested, stop work if disturbed. Pre-1980 paint — assume lead, use wet methods. Wet sanding or dust extraction for dry sanding. Seal off work area to contain dust. P2 respirator (dust), P3 full-face for confirmed lead or asbestos. Remove building occupants from the area.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Apply paint (brush, roller or spray)",
      hazards: "Solvent vapour inhalation, skin / eye contact, airless spray injection injury",
      controls:
        "Ventilate enclosed spaces (forced air). No ignition sources where solvent-based products are used. Airless spray — tip guard on at all times, never point at skin. No bystanders in spray zone. P3 / full-face respirator, disposable overalls, nitrile gloves, safety glasses.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Working at height (scaffold, ladder, trestle)",
      hazards: "Falls from height, overloaded scaffold",
      controls:
        "Scaffold inspected and tagged in date. Guardrails on all open edges. Ladder secured at top. Three points of contact. No over-reaching. Harness anchored to a certified point above 3 m.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Solvent and thinner handling and storage",
      hazards: "Flammable vapour, fire from solvent-soaked rags",
      controls:
        "Keep lids on containers when not in use. No ignition sources where solvents are stored or used. Place solvent-soaked rags in a sealed metal bin — never leave in a pile (spontaneous combustion risk). Dispose of waste per local council requirements.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & sign off",
      hazards: "Wet paint floors (slips), solvent-soaked rags (fire), paint spills",
      controls:
        "Place all solvent rags in sealed metal bin. Dry wet floors. Remove drop sheets. Clean brushes and equipment. Tools and equipment to vehicle. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCRETE GRINDING (covers concrete_laying)
// ─────────────────────────────────────────────────────────────────────────────

const concrete_grinding: JsaNzTemplate = {
  workDescription:
    "Concrete diamond grinding and surface preparation — including dust extraction, slurry management and HEPA vacuuming. Silica Exposure Control Plan in place for all grinding operations.",
  permitRequired: "No",
  ppeRequired: [
    "Safety boots (steel cap)",
    "Hi-viz vest",
    "Hard hat (where required)",
    "Safety glasses (impact resistant)",
    "P3 full-face respirator (mandatory for dry grinding — silica dust)",
    "Hearing protection (Class 5 — grinding noise above 85 dB)",
    "Anti-vibration gloves",
    "Knee pads",
  ],
  steps: [
    {
      step: "1. Site set-up & dust control",
      hazards: "Respirable crystalline silica dust — silicosis, lung cancer",
      controls:
        "Attach dust shroud to grinder and connect to HEPA vacuum before starting. Confirm vacuum suction is working — seal any gaps around the shroud. Cordon off the work area. Seal doorways in enclosed spaces to prevent silica dust migration. Review Silica Exposure Control Plan with crew. P3 full-face respirator on before entering the work area.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Grinding / cutting operation",
      hazards: "Silica dust, noise (>100 dB), hand-arm vibration, flying debris, electrical hazard",
      controls:
        "Dust extraction running and connected at all times. Inspect blade / disc before use — no cracks or missing segments. RCD on every lead. Operator only in the grinding zone. Limit grinder run time per session to manage vibration exposure. No bystanders within 3 m. P3 full-face respirator, Class 5 hearing protection, anti-vibration gloves.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Slurry / wet waste management",
      hazards: "Slips on wet concrete slurry, stormwater contamination",
      controls:
        "Collect slurry in bunded tray — do not hose to stormwater drain. Place wet floor signs. Dispose of dried slurry as general solid waste (or per the site waste management plan).",
      risk: "Low",
      residualRisk: "Very Low",
    },
    {
      step: "4. HEPA vacuum & clean-up",
      hazards: "Residual silica dust re-suspension during clean-up",
      controls:
        "HEPA vacuum only — absolutely no dry sweeping or compressed air blowing. Wet mop after vacuuming. Empty vacuum bag outdoors in a sealed bag. Wipe equipment with a damp cloth. P3 respirator on until all clean-up is complete and dust has settled.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Sign off & equipment check",
      hazards: "Damaged equipment, uncleared silica residue",
      controls:
        "Inspect grinder disc / blades — quarantine any damaged items. Leads coiled, status noted on test tag log. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// LINE MARKING (covers asphalt)
// ─────────────────────────────────────────────────────────────────────────────

const line_marking: JsaNzTemplate = {
  workDescription:
    "Line marking and floor/road surface preparation — including layout, paint application, curing and grinding / line removal where required. All traffic management in accordance with the approved Traffic Management Plan (TMP).",
  permitRequired: "No",
  ppeRequired: [
    "Hi-viz vest (Class D daytime; Class N for night work)",
    "Safety boots (steel cap)",
    "Safety glasses",
    "Nitrile gloves (paint handling)",
    "Hearing protection (where equipment noise exceeds 85 dB)",
    "Sun protection — hat and sunscreen (outdoor work)",
    "P2 respirator (solvent-based paint in enclosed areas)",
  ],
  steps: [
    {
      step: "1. Site arrival & TMP set-up",
      hazards: "Moving traffic striking workers during set-up",
      controls:
        "Arrow board / shadow vehicle positioned upstream before any worker enters the carriageway. Set cones and signs as per the approved TMP. STMS verifies the layout is correct before crew enters the road. All crew briefed on the TMP, escape routes and emergency plan before starting. Two-way radios operational. Hi-viz on before exiting the vehicle.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Layout & chalk-up",
      hazards: "Traffic ingress through TMP, slips on wet surface",
      controls:
        "Stay within the protected work zone at all times. STMS monitors the TMP while layout is in progress. Communicate positions via radio. Hi-viz vest and steel-cap boots.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "3. Line marking — machine operation",
      hazards: "Paint fumes (solvent), slips on wet paint, traffic ingress",
      controls:
        "Machine operator stays behind the machine at all times. Keep pace with TMP — do not outrun the protection zone. STMS maintains the TMP throughout. Wet paint signs placed immediately after application. P2 respirator for solvent-based paint. Nitrile gloves, safety glasses.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Working near open traffic (partial closure)",
      hazards: "Vehicle entering work zone, worker struck",
      controls:
        "Maximum safe working distance from live traffic per NZTA Code of Practice. Shadow / attenuator vehicle upstream. Escape routes confirmed and communicated to all crew. No worker in the direct line of traffic. Radio check every 15 minutes.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up & TMP removal",
      hazards: "Traffic re-entering zone during pack-down, wet paint under traffic",
      controls:
        "Remove cones and signs in the correct sequence — furthest upstream last. Shadow vehicle remains until all crew are clear of traffic. STMS authorises each removal step. Confirm paint is dry before reopening to traffic. Final site walk to check all TMP equipment removed. Sign out with PCBU 1.",
      risk: "Medium",
      residualRisk: "Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL (catch-all)
// ─────────────────────────────────────────────────────────────────────────────

const general: JsaNzTemplate = {
  workDescription:
    "General trade work — update this description with the specific task being performed today.",
  permitRequired: "No",
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
      hazards: "Traffic, unknown ground conditions, overhead / underground services",
      controls:
        "Site induction / sign in. Identify all overhead and underground services with PCBU 1. Set up tool and material zone clear of pedestrian and vehicle paths. Cones and signs where required. Full PPE on before entering the work zone.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "2. Perform work",
      hazards: "Trade-specific — customise this step for your actual task",
      controls:
        "Trained and competent workers only. Follow manufacturer instructions for all plant and equipment. Guards in place and operational. RCD on every lead. Task-specific PPE as required.",
      risk: "Medium",
      residualRisk: "Low",
    },
    {
      step: "3. Clean up & sign off",
      hazards: "Leftover materials, trip hazards, unsecured plant",
      controls:
        "Clear and sweep the area. Remove all tools and materials. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
};

const civil: JsaNzTemplate = {
  workDescription: "Civil construction and earthworks — excavation, trenching, backfilling, compaction, drainage installation, and earthmoving plant operation on a construction or infrastructure site.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (Class D)", "Hard hat", "Safety glasses", "Gloves", "P2 dust mask (cutting / dry fill)", "Hearing protection (plant operation)"],
  steps: [
    {
      step: "1. Service location and TMP set-up",
      hazards: "Striking underground services (gas, electrical, water); vehicle and pedestrian conflict",
      controls: "Dial Before You Dig (0800 474 335) confirmed before any excavation. Pothole to verify service depths within 500 mm of any mapped line. TMP implemented and traffic management devices in place before work starts. Site induction complete. Hi-viz Class D.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Excavation and earthmoving",
      hazards: "Trench collapse / cave-in; plant striking workers; overhead powerlines",
      controls: "Trench box or shoring for excavations over 1.5 m deep. No entry to unsupported trench — no exceptions. Exclusion zone — no personnel within swing radius of excavator. Spotter / banksman for all reversing plant. Boom height limiter when working near overhead powerlines.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Pipe and drainage installation",
      hazards: "Manual handling (pipes, kerbs); trench entry; groundwater",
      controls: "Excavator to lower pipes into trench. Pump groundwater before any personnel entry. Shoring maintained during pipe laying. No entry to unsupported trench. Two-person team for heavy pipe sections.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Backfill and compaction",
      hazards: "Plant strike; whole-body vibration; silica dust from dry fill",
      controls: "Personnel clear of compactor operation zone at all times. Layer compaction to specification. Dust suppression (water) on dry granular fill. Hearing protection for plant operators. P2 mask in dusty conditions.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "5. Reinstate and sign off",
      hazards: "Open excavation; traffic; trip hazards from temporary reinstatement",
      controls: "Temporary reinstatement to safe trafficable standard before leaving. Remove TMP in reverse order. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "Excavation permit (site-specific) + Traffic Management Plan (TMP) where road or shared access is affected",
};

const demolition: JsaNzTemplate = {
  workDescription: "Demolition of structures — including strip-out, hand demolition, and mechanical demolition. Asbestos clearance certificate required before demolition begins.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "P2 / P3 respirator (dust and asbestos adjacent)", "Heavy-duty gloves", "Hearing protection", "Tyvek overalls (asbestos adjacent work)"],
  steps: [
    {
      step: "1. Pre-demolition — services isolated, asbestos cleared",
      hazards: "Live services (gas, electrical, water); asbestos disturbance; structural instability",
      controls: "All services isolated and capped by licensed trades before demolition starts. Asbestos clearance certificate on site. Demolition sequence documented and followed. Public exclusion zone / hoarding erected. Site induction complete.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Hand strip and strip-out",
      hazards: "Manual handling; dust (silica, lead paint); falling debris",
      controls: "P2/P3 respirator mandatory. Wet methods for dusty strip-out. Two-person lift for items over 23 kg. Hard hat and safety glasses. Demolition sequence followed.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Mechanical demolition",
      hazards: "Plant striking workers; structural collapse; debris projection; dust",
      controls: "Strict exclusion zone — all personnel and public clear of demolition zone during mechanical demolition. Demolition sequence followed by the book. Spotter for all plant movement. Structural engineer on call for complex elements. Dust suppression active.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Waste segregation and removal",
      hazards: "Asbestos waste; sharp debris; manual handling; contaminated materials",
      controls: "Asbestos waste double-bagged, labelled with asbestos waste sticker, manifested and taken to an approved disposal facility only. Bins not overfilled. Gloves and eye protection for debris handling.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Site make-safe and sign off",
      hazards: "Open foundations; unstable exposed edges; public access to site",
      controls: "Perimeter hoarding or fencing maintained. Open pits covered or barricaded. Loose debris cleared. Sign out with PCBU 1.",
      risk: "Moderate",
      residualRisk: "Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "Demolition permit (local council) + Asbestos removal notification (WorkSafe NZ) where applicable",
};

const scaffolding: JsaNzTemplate = {
  workDescription: "Erection, alteration and dismantling of scaffolding — including tube-and-coupler scaffold, system scaffold (Kwikstage/Ringlock), and mobile scaffolding.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Safety harness and lanyard (certified anchor — erection and dismantling)", "Tool bags and lanyards for all hand tools at height"],
  steps: [
    {
      step: "1. Ground preparation and base set-up",
      hazards: "Unstable or soft ground; underground services; vehicle access conflict",
      controls: "Ground bearing capacity assessed. Base plates on sole boards. Dial Before You Dig confirmed. Traffic cones around work zone. Site induction complete.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Erect standards, ledgers and transoms",
      hazards: "Falls during leading-edge work; dropped tube and couplers; manual handling (heavy tubes)",
      controls: "Harness on certified anchor for all leading-edge work above 3 m. Tool bags and lanyards on all tools. Team carry for long tubes. Drop zone barricaded below — no bystanders. Tie scaffold as height increases.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Install boards, toe boards and guardrails",
      hazards: "Falls through incomplete deck; leading-edge exposure; dropped boards",
      controls: "Install boards from below using pole system where possible. Harness on anchor during leading-edge board installation. Mesh / kickboards on all completed lifts. Tie scaffold before working on the next lift.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Scaffold inspection and handover",
      hazards: "Defective scaffold handed to users — fall or collapse risk",
      controls: "Licensed scaffolder inspects completed scaffold. Inspection tag completed and attached at access point. Load rating clearly marked. User briefed on permitted use and prohibited modifications.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Dismantling",
      hazards: "Falls; dropped materials onto workers below; scaffold instability during dismantling",
      controls: "Dismantle in strict reverse order. Harness on anchor throughout dismantling. Lower materials by rope — absolutely no throwing. Drop zone barricaded.",
      risk: "High",
      residualRisk: "Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "Scaffolding certificate (Basic / Intermediate / Advanced — appropriate to height and type)",
};

const bricklaying: JsaNzTemplate = {
  workDescription: "Bricklaying, blocklaying and masonry construction — including walls, piers, retaining structures, and associated mortar mixing and masonry cutting.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Waterproof gloves (mortar work)", "P2 dust mask (masonry cutting)", "Hearing protection (cutting)", "Knee pads"],
  steps: [
    {
      step: "1. Set-up — materials and scaffold",
      hazards: "Manual handling (bricks and blocks); mortar chemical burns; unstable ground under scaffold",
      controls: "Site induction. Position pallets with forklift close to work face. Scaffold erected and inspection tag in date. Team lift for blocks over 23 kg. Waterproof gloves for mortar mixing.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Cut masonry (angle grinder or block saw)",
      hazards: "Silica dust inhalation; noise; projectile fragments; hand contact with disc",
      controls: "Wet cutting mandatory — water suppression on all masonry cuts. No dry cutting. Dust extraction on block saw. Cordon off cutting area. Inspect disc before use — no cracks, guard in place. P2 respirator, face shield and hearing protection on during all cutting.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Lay brickwork and blockwork",
      hazards: "Manual handling; mortar chemical burns (lime / cement); working at height",
      controls: "Scaffold inspection tag in date. Kickboards / toe boards on scaffold. Waterproof gloves for all mortar work. Change cement-soaked clothing immediately. Hard hat below active work.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazards: "Cement wash to stormwater; masonry offcuts; slips on wet mortar spill",
      controls: "Collect and neutralise cement waste before draining (pH >11). Bag masonry offcuts. Sweep area. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const glazing: JsaNzTemplate = {
  workDescription: "Glazing and aluminium joinery installation — including windows, doors, curtain wall, balustrades, and glass replacement.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest", "Hard hat", "Safety glasses", "Glass-handling gloves (leather or kevlar)", "Harness and lanyard (above 3 m)"],
  steps: [
    {
      step: "1. Glass delivery and storage",
      hazards: "Glass breakage during unloading; lacerations from broken glass; manual handling of large panels",
      controls: "Use glazing trolley or crane for panels over 1.5 m². Store upright on padded A-frame on firm, level ground. Two-person minimum for large panels. Glass-handling gloves on at all times.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Frame and opening preparation",
      hazards: "Power tool cuts; aluminium swarf; dust; working at height",
      controls: "Guards on all power tools. Safety glasses. EWP or scaffold for elevated frames — inspection tag in date. Harness above 3 m. Cordon off area below overhead work.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "3. Glass placement and installation",
      hazards: "Glass panel drop; lacerations during placement; falls; wind loading on large panels",
      controls: "Drop zone barricaded below all elevated glass installation — no bystanders. Suction cups — check load rating before use. Two-person minimum for panel placement. Communicate before lifting. Secure panel against wind gust before releasing. Glass-handling gloves on.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Seal and clean up",
      hazards: "Sealant fumes in enclosed spaces; sharp aluminium swarf; glass offcuts",
      controls: "Ventilate when applying silicone in enclosed spaces. Rigid container for glass waste — never in rubbish bags. Sweep aluminium swarf. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const plastering: JsaNzTemplate = {
  workDescription: "Interior plastering and gib stopping — including stopping, sanding, texture coating, and surface preparation in residential and commercial buildings.",
  ppeRequired: ["Safety boots", "Safety glasses / goggles (mixing)", "P2 dust mask (sanding)", "Waterproof gloves (wet plaster)", "Knee pads"],
  steps: [
    {
      step: "1. Set-up and material staging",
      hazards: "Manual handling (plaster bags); lime / cement chemical burns during mixing; slips on spills",
      controls: "Mechanical mixer for mixing — never hand-mix heavy batches. Position materials close to work face. Drop sheets on all floors. Team lift for bags over 23 kg. Waterproof gloves for all mixing.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Apply stop and plaster coats",
      hazards: "Chemical burns (lime / gypsum); working at height (ceiling, scaffold, stilts); slips on wet compound",
      controls: "Scaffold / trestle inspection tag in date. Stilts on flat, clear surfaces only. Waterproof gloves and eye protection during mixing and application. Wet floor signs where applicable.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "3. Sand and finish",
      hazards: "Gypsum / silica dust inhalation during sanding; working at height",
      controls: "Vacuum sander (dustless system) as first preference. P2 respirator mandatory for all sanding. Seal room off to prevent dust spread to other areas. No dry sweeping — HEPA vacuum or wet mop only.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazards: "Wet compound on floors (slips); contaminated waste; dust",
      controls: "HEPA vacuum dry dust. Collect wet compound. Remove drop sheets. Dry all floor surfaces. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const tiling: JsaNzTemplate = {
  workDescription: "Floor and wall tiling — including substrate preparation, tile cutting (wet saw and angle grinder), adhesive application, grouting, and sealing.",
  ppeRequired: ["Safety boots (steel cap)", "Safety glasses", "Cut-resistant gloves (tile handling)", "Waterproof gloves (adhesive / grout)", "P2 dust mask (cutting)", "Rubber gloves and face shield (acid cleaning)", "Knee pads"],
  steps: [
    {
      step: "1. Surface preparation",
      hazards: "Dust from grinding or scarifying substrate; chemical primer skin / eye contact; manual handling",
      controls: "Vacuum grinder for substrate prep. Waterproof gloves for primer application. P2 respirator for prep dust. Team lift for substrate boards over 23 kg.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Cut tiles",
      hazards: "Silica dust from tile cutting; noise; projectile tile fragments; lacerations",
      controls: "Wet tile saw as first preference — water suppression on all cuts. No dry cutting. P2 respirator mandatory during cutting. Face shield and hearing protection. Inspect disc before use. Cut-resistant gloves for handling cut tiles.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Lay tiles with adhesive",
      hazards: "Adhesive skin / eye contact; manual handling (large-format tiles); knee and back strain",
      controls: "Vacuum cup lifter for tiles over 15 kg. Waterproof gloves for adhesive. Ventilate in enclosed spaces. Knee pads for floor tiling.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "4. Grout and acid clean",
      hazards: "Grout skin and eye irritation; acid cleaner corrosive burns and fumes",
      controls: "Waterproof gloves for grouting. Read SDS before acid cleaning — never mix acid with bleach. Rubber gloves, face shield and apron for acid cleaning. Ventilate. Eye wash on site.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazards: "Wet floor (slips); sharp tile offcuts; adhesive fumes in enclosed space",
      controls: "Rigid container for tile offcuts. Mop and dry floor. Ventilate. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const insulation: JsaNzTemplate = {
  workDescription: "Insulation installation — including glasswool, polyester, rigid foam, and reflective foil insulation in wall, ceiling and underfloor locations.",
  ppeRequired: ["Safety boots", "Safety glasses", "P2 respirator (glasswool)", "Long-sleeved work shirt (glasswool)", "Gloves (glasswool)", "Knee pads (sub-floor)"],
  steps: [
    {
      step: "1. Inspect space before entry",
      hazards: "Asbestos (pre-2000 buildings); live wiring; CO gas from gas appliances; heat in roof space",
      controls: "Visual inspection from hatch before entering roof space. Confirm no ACM lagging or loose fill visible. Identify live wiring and recessed downlights. Ventilate roof space 10 minutes before entry. Asbestos awareness — stop work if suspected, notify PCBU 1.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Install insulation",
      hazards: "Glasswool fibre irritation (respiratory, skin, eye); falls through ceiling plasterboard; confined space",
      controls: "P2 respirator on before handling glasswool. Long sleeves and gloves — no bare skin contact with glasswool. Supported plank in roof space — never walk on plasterboard ceiling. Sub-floor standby person with two-way comms.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "3. Clear zones around downlights and junction boxes",
      hazards: "Fire risk from insulation contact with recessed lights or uncovered junction boxes",
      controls: "Maintain 25 mm clearance around all recessed lights unless they carry an IC (insulation contact) rating. Never cover junction boxes, distribution boards, or heat-generating equipment.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Clean up and sign off",
      hazards: "Glasswool fibres remaining on skin; offcut trip hazards",
      controls: "Wash hands and arms thoroughly after work. Remove and bag all insulation offcuts. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const hvac: JsaNzTemplate = {
  workDescription: "HVAC and refrigeration installation, commissioning and maintenance — including ducting, pipework, refrigerant handling (EPA-regulated), electrical connections, and working at height.",
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Safety glasses", "Cryo-gloves and full face shield (refrigerant handling)", "Hearing protection", "Harness and lanyard (above 3 m)"],
  steps: [
    {
      step: "1. Site set-up and isolation",
      hazards: "Live electrical circuits; refrigerant leak from existing systems; manual handling of heavy units",
      controls: "LOTO on electrical panel before working on indoor units. Recover refrigerant from existing systems before cutting pipes. Two-person team for units over 23 kg. Crane or telehandler for heavy condensing units. Site induction complete.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Install ducting, pipework and equipment",
      hazards: "Manual handling; working at height; sheet metal cuts from ductwork",
      controls: "EWP or scaffold for ceiling and roof installation. Harness on anchor above 3 m. Two-person team for heavy units. Gloves for sheet metal duct handling — raw duct edges are razor-sharp.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Refrigerant recovery, vacuuming and charging",
      hazards: "Refrigerant release — freeze burns; asphyxiation in enclosed plant rooms; atmospheric release (EPA offence)",
      controls: "NZ EPA certified refrigerant handler only. Recovery unit on site at all times — never vent refrigerant to atmosphere. Ventilate plant room before and during refrigerant work. Cryo-gloves and full face shield for all refrigerant connections.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Electrical connections and commissioning",
      hazards: "Live circuits; incorrect wiring; unintended energisation of equipment",
      controls: "Licensed electrician for all mains power connections. LOTO maintained until wiring verified. Test for dead before touching any conductor. Commission and test systems in sequence — communicate before energising.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazards: "Refrigerant cylinder handling; uncommissioned systems left energised; tool trip hazards",
      controls: "Log recovery cylinder. Replace all electrical covers and guards. Sign out with PCBU 1. Provide client with handover and commissioning documentation.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "NZ EPA refrigerant handler certification required for refrigerant handling",
};

const fire_protection: JsaNzTemplate = {
  workDescription: "Fire protection system installation and maintenance — including sprinkler systems, fire suppression, fire alarms, detection, and passive fire protection.",
  ppeRequired: ["Safety boots (EH-rated)", "Hi-viz vest", "Hard hat", "Safety glasses", "Gloves", "Harness and lanyard (above 3 m)", "Hearing protection"],
  steps: [
    {
      step: "1. Isolate system and set up",
      hazards: "Accidental sprinkler activation; live electrical; slip on wet floor from prior leak",
      controls: "Confirm isolation with building manager and notify fire monitoring company before work. LOTO on electrical panel. Cap all open sprinkler heads. Site induction complete.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Install pipework, sprinkler heads and detection devices",
      hazards: "Working at height; manual handling of long pipe sections; cutting swarf in eyes",
      controls: "EWP or scaffold for overhead installation. Harness on anchor above 3 m. Two-person team for long pipe sections. Safety glasses for all pipe cutting operations.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Pressure test the system",
      hazards: "High-pressure water or nitrogen; fitting failure under pressure; hearing damage",
      controls: "Test to design specification only — do not exceed rated pressure. Calibrated test gauge. Stand clear of all fittings under pressure. No bystanders in test zone. Record all test results.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Commission and handover",
      hazards: "Alarm activation causing panic; suppressant accidental discharge; live electrical connections",
      controls: "Notify building occupants before any alarm test. Evacuate affected areas before suppressant discharge testing. Licensed electrician signs off alarm panel connections. Record and sign off all commissioning results.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazards: "Wet floors (slips); pipe offcuts; penetrations through fire-rated walls not sealed",
      controls: "Mop and dry wet areas. Bag pipe offcuts. Fire-stop all cable and pipe penetrations through fire-rated walls before leaving site. Sign out with PCBU 1. Leave as-built drawings with building manager.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "NZ Fire recognised installer certification; building consent (where required by local council)",
};

const security: JsaNzTemplate = {
  workDescription: "Security system installation — including alarms, access control, CCTV, intercoms, and associated low-voltage cabling and commissioning.",
  ppeRequired: ["Safety boots (EH-rated)", "Safety glasses", "Gloves", "P2 dust mask (drilling into concrete or masonry)", "Harness and lanyard (above 3 m)"],
  steps: [
    {
      step: "1. Site survey and cable route planning",
      hazards: "Asbestos in ceiling spaces of pre-2000 buildings; live cable trays; unknown services",
      controls: "Check building age — assume asbestos in pre-2000 buildings. P2 respirator in older ceiling spaces. Identify live cable routes with PCBU 1 before accessing ceiling space. Site induction complete.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Cable installation",
      hazards: "Working at height; electrical exposure in live cable trays; manual handling (cable drums)",
      controls: "LOTO on live cable trays before working. Cable drum on stand. EWP or stable ladder for elevated cable runs. Harness above 3 m. Three points of contact on ladder at all times.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "3. Device installation",
      hazards: "Working at height; drilling dust (concrete and masonry); mains electrical connections",
      controls: "EWP or stable ladder. Harness above 3 m. P2 respirator for drilling into concrete or masonry. Licensed electrician for all mains power connections.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "4. Commission, test and sign off",
      hazards: "Alarm activation; uncommissioned access control points; open cable penetrations",
      controls: "Notify occupants before alarm testing. Test systems in sequence. Fire-stop all cable penetrations through fire-rated walls before leaving. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const landscaping: JsaNzTemplate = {
  workDescription: "Landscaping and grounds maintenance — including mowing, trimming, planting, irrigation, paving, and the use of ride-on and hand-held machinery.",
  ppeRequired: ["Safety boots (steel cap)", "Hi-viz vest (road or public areas)", "Safety glasses", "Hearing protection (Class 5 — machinery)", "Nitrile gloves (chemical handling)", "Sun hat and sunscreen SPF50+", "P2 dust mask (paver cutting)"],
  steps: [
    {
      step: "1. Site inspection and machinery pre-start check",
      hazards: "Hidden hazards (rocks, irrigation heads, holes); machinery defects; children and pets",
      controls: "Walk entire area before mowing. Remove or mark rocks, holes and irrigation heads. Confirm children and pets are inside. Pre-start checklist on all machinery. Report any machinery defects — do not operate defective equipment.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Mow and trim",
      hazards: "Flying debris (projectiles); rollover on slopes; noise; hand-arm vibration",
      controls: "ROPS on ride-on mowers — in locked-up position. Solid deck guards in place. Bystanders 15 m clear of all mowing and trimming. Mow parallel to slope — not across. No passengers on ride-on mowers. Hearing protection (Class 5). Safety glasses.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Chemical application (herbicide / fertiliser)",
      hazards: "Skin and eye contact with chemicals; inhalation; spray drift onto bystanders or waterways",
      controls: "Read SDS and label before use. Mix per label rate only. Do not spray in wind above 15 km/h. Notify occupants of spray program. Approved Handler Certificate where required. Nitrile gloves and safety glasses.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "4. Hard landscaping (paving, retaining walls, earthworks)",
      hazards: "Manual handling (pavers, sleepers); silica dust from cutting; mini-excavator plant strike",
      controls: "Mechanical aid (mini-excavator, pallet jack) for heavy items. Team lift over 23 kg. Wet cutting for pavers and concrete. P2 respirator during paver cutting. Exclusion zone around mini-excavator.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazards: "Chemical waste disposal; machinery left unattended running; sharp green waste",
      controls: "Engine off and keys out before leaving machinery unattended. Triple-rinse sprayer. Dispose of chemical waste per label and council requirements. Bag green waste per site requirements. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const cleaning: JsaNzTemplate = {
  workDescription: "Commercial cleaning — including internal office and industrial cleaning, high-level and window cleaning, pressure washing, and chemical cleaning.",
  ppeRequired: ["Non-slip safety boots / footwear", "Hi-viz vest (external / public areas)", "Nitrile gloves (chemicals)", "Rubber gloves and face shield (acid cleaning)", "Safety glasses", "P2 respirator (mould remediation)", "Harness and lanyard (external height work above 3 m)"],
  steps: [
    {
      step: "1. Chemical selection and area set-up",
      hazards: "Wrong chemical selected; improper mixing; bystander exposure to chemicals",
      controls: "Read SDS before using any product. Never mix bleach with acid (releases toxic chlorine gas). Correct dilution per label only. Notify building occupants of treatment areas before starting. Wet floor signs placed before mopping.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Internal cleaning",
      hazards: "Slips on wet floors; chemical exposure; biological hazards (sharps, blood, mould)",
      controls: "Section-by-section mopping — always leave a dry path for egress. Non-slip footwear. Sharps in rigid sharps container — never in rubbish bags. Double-bag biological waste. Ventilate when using strong chemicals. P2 respirator for mould remediation.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "3. High-level and external cleaning",
      hazards: "Falls from height; dropped equipment onto public below; chemical splash to eyes",
      controls: "Licensed EWP operator for external EWP work. Harness on anchor above 3 m. Spotter and barricade below elevated cleaning work. Inspect ladder before use — three points of contact. Tool lanyard on cleaning equipment used at height.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Waste removal",
      hazards: "Sharps in waste bags; biological contamination; heavy bins causing manual handling injury",
      controls: "Trolley for waste bins. Never reach blind into waste bags. Sharps in rigid container only. Double-bag biological waste. Wash hands and face after handling waste.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "5. Sign off",
      hazards: "Wet floor left without signs; chemical residue on surfaces; equipment left running",
      controls: "Remove wet floor signs only when floor is completely dry. Secure all chemicals in vehicle. All equipment switched off and stored. Sign out with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "No",
};

const welding: JsaNzTemplate = {
  workDescription: "Welding and fabrication — including MIG, TIG, stick (MMAW) and oxy-acetylene welding, plasma and oxy cutting, and angle grinding.",
  ppeRequired: ["Safety boots (steel cap)", "Auto-darkening welding helmet (correct shade for process)", "Leather welding gloves", "Flame-resistant long-sleeved shirt", "Safety glasses (under helmet)", "Leather / flame-resistant apron", "P3 respirator (fumes in confined / poorly ventilated spaces)", "Hearing protection (grinding)"],
  steps: [
    {
      step: "1. Hot work permit and area preparation",
      hazards: "Sparks igniting flammable materials within 10 m; bystanders exposed to arc radiation; fire spreading after welding ends",
      controls: "Hot work permit obtained where required by PCBU 1. Remove or shield all flammable materials within 10 m. Welding screens and curtains placed to protect bystanders from arc radiation. Fire extinguisher immediately accessible. Fire watch arranged.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "2. Set up welding equipment and cylinders",
      hazards: "Electric shock from welding leads; oxy-acetylene hose failure or flashback; cylinder topple",
      controls: "Inspect all leads and hoses before use — no damaged insulation. Flashback arrestors on both oxy and acetylene hoses. Cylinders chained upright at all times. GFCI / RCD on mains supply. Never grease oxygen fittings. No smoking within 5 m of gas cylinders.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Weld and cut",
      hazards: "Welding fumes (manganese, hexavalent chromium, zinc if galvanised); arc radiation; electric shock; fire",
      controls: "Local exhaust ventilation (LEV) at source as first preference. Force ventilate in enclosed spaces. P3 respirator where LEV is insufficient or for galvanised / coated metals. Auto-darkening helmet, correct shade. Leather gloves and flame-resistant shirt. No bare skin exposed. Fire watch.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Angle grind and finish",
      hazards: "Disc fragmentation; sparks; cuts from metal edges; noise; hand-arm vibration",
      controls: "Select correct disc type for task — never use a cutting disc for grinding. Inspect disc — no cracks or missing segments. Guard in place. Stand to the side of the disc plane. Face shield and safety glasses. Hearing protection.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "5. Fire watch and sign off",
      hazards: "Smouldering materials reigniting after welding; hot metal contact by others",
      controls: "30-minute fire watch after all welding — no exceptions. Label hot metal 'HOT — DO NOT TOUCH'. Close all cylinder valves and bleed lines. Remove welding screens. Sign out with PCBU 1.",
      risk: "Moderate",
      residualRisk: "Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "Hot work permit (site-specific — where required by PCBU 1 site rules)",
};

const pest_control: JsaNzTemplate = {
  workDescription: "Pest control services — including rodent baiting, insect treatment, fumigation, bird management, and associated chemical application in residential and commercial premises.",
  ppeRequired: ["Safety boots", "Nitrile gloves", "Safety glasses / goggles", "P2 respirator (confined space / infested areas)", "Tyvek overalls (fumigation or heavily infested areas)", "Harness and lanyard (roof or height access above 3 m)"],
  steps: [
    {
      step: "1. Site inspection and treatment planning",
      hazards: "Unknown confined spaces; bystander and non-target animal exposure; wrong chemical selection",
      controls: "Inspect site before treatment. Identify confined spaces and height risks. Select correct chemical per pest, label and SDS. Notify building manager and occupants before treatment. Confirm re-entry interval per label.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "2. Mix and prepare chemicals",
      hazards: "Skin and eye contact during mixing; incorrect concentration; spills",
      controls: "Read SDS and label before mixing. Approved Handler Certificate for HSNO controlled substances. Mix per label rate only — never exceed. Do not overfill spray tank. Nitrile gloves and safety glasses during mixing.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "3. Apply treatment",
      hazards: "Pesticide exposure (skin, eye, inhalation); spray drift onto bystanders or waterways; confined space entry; working at height",
      controls: "Cordon off treatment area — no bystanders or non-target animals during application. Wind check for outdoor spray — max 15 km/h. Confined space permit for any void entry. Gas test before confined space entry. Standby person with two-way comms. Harness above 3 m for roof access.",
      risk: "High",
      residualRisk: "Low",
    },
    {
      step: "4. Check and install bait stations",
      hazards: "Rodent carcasses (biological); chemical bait exposure; tamper access by children or non-target animals",
      controls: "Nitrile gloves when handling bait stations and carcasses. P2 respirator in heavily infested spaces. Double-bag carcasses and seal. Tamper-resistant bait stations where children, pets or non-target animals may be present.",
      risk: "Moderate",
      residualRisk: "Low",
    },
    {
      step: "5. Clean up and sign off",
      hazards: "Chemical waste disposal; contaminated PPE; residual treatment in occupied areas before re-entry interval",
      controls: "Triple-rinse spray equipment. Dispose of chemical waste per label and local council requirements. Remove contaminated PPE carefully — bag and seal. Confirm re-entry interval has elapsed before allowing re-entry. Leave service report with PCBU 1.",
      risk: "Low",
      residualRisk: "Very Low",
    },
  ],
  emergencyPlan: STANDARD_EMERGENCY_PLAN,
  musterPoint: STANDARD_MUSTER,
  permitRequired: "Approved Handler Certificate (HSNO controlled substances); confined space permit (where entering voids)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<string, JsaNzTemplate> = {
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

export function getJsaNzTemplate(tradeKey: string | null | undefined): JsaNzTemplate {
  if (!tradeKey) return general;
  return TEMPLATES[tradeKey] ?? general;
}
