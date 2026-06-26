import { useRoute } from "wouter";
import { useGetSssp, useListSites } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useEffect } from "react";

// ─── Shared types (mirror detail.tsx) ───────────────────────────────────────

type Pcbu = {
  company?: string; tradingName?: string; role?: string; contact?: string;
  phone?: string; email?: string; website?: string; safetyRep?: string;
  safetyRepPhone?: string; firstAid?: string; firstAidPhone?: string;
  logoUrl?: string;
};
type Hazard = { hazard: string; initialRisk: string; controlLevel: string; controls: string; residualRisk: string; toolbox: boolean };
type TaskStep = { step: string; hazards: string; initialRisk: string; controls: string; controlLevel: string; residualRisk: string };
type Substance = { product: string; unNumber: string; state: string; hazardType: string; maxQty: string; storage: string; segregation: string; sdsLocation: string; controls: string; ppe: string; initialRisk: string; residualRisk: string };
type SsspData = {
  siteAddress?: string; activities?: string;
  workSafeNotification?: string; taskAnalysisRequired?: string; hazardRegisterProvided?: string; hazardousSubstancesOnSite?: string;
  pcbu1?: Pcbu; pcbu2?: Pcbu;
  hazards?: Hazard[]; taskSteps?: TaskStep[]; ppeRequired?: string[];
  substances?: Substance[];
  nearestHospital?: string; hospitalAddress?: string; hospitalPhone?: string; musterPoint?: string;
  emergencyProcedures?: string; emergencyContacts?: { name: string; role: string; phone: string }[];
  commToolboxFreq?: string; commPreStartFreq?: string; commProgressFreq?: string;
  trainingItems?: string[]; inductionProcess?: string;
  pcbu1SignedBy?: string; pcbu1SignedDate?: string; pcbu2SignedBy?: string; pcbu2SignedDate?: string;
  pcbu1SignatureImage?: string; pcbu2SignatureImage?: string;
  photos?: { id: string; objectPath: string; caption?: string; createdAt?: string }[];
};

const ORANGE = "#E87722";
const DARK = "#1F2937";
const LIGHT_BG = "#F9FAFB";
const BORDER = "#D1D5DB";

const riskBg = (r?: string) => {
  if (r === "Critical" || r === "High") return "#FEE2E2";
  if (r === "Moderate") return "#FEF9C3";
  if (r === "Low") return "#DCFCE7";
  return "#DBEAFE";
};
const riskColor = (r?: string) => {
  if (r === "Critical" || r === "High") return "#991B1B";
  if (r === "Moderate") return "#92400E";
  if (r === "Low") return "#166534";
  return "#1D4ED8";
};

// ─── Print-specific global styles injected into <head> ───────────────────────
const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: ${DARK}; background: white; }
  h1 { font-size: 22pt; font-weight: 900; color: ${ORANGE}; margin-bottom: 4px; }
  h2 { font-size: 13pt; font-weight: 800; color: ${ORANGE}; margin: 18px 0 6px; border-bottom: 2px solid ${ORANGE}; padding-bottom: 4px; }
  h3 { font-size: 10pt; font-weight: 700; color: ${DARK}; margin: 12px 0 4px; }
  p { line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 12px; }
  th { background: ${ORANGE}; color: white; font-weight: 700; padding: 5px 6px; text-align: left; border: 0.5pt solid ${BORDER}; }
  td { padding: 4px 6px; border: 0.5pt solid ${BORDER}; vertical-align: top; line-height: 1.4; }
  tr:nth-child(even) td { background: ${LIGHT_BG}; }
  .kv-table td:first-child { background: ${LIGHT_BG}; font-weight: 600; width: 38%; }
  .section { margin-bottom: 20px; }
  .page-break { page-break-before: always; }
  .no-print { display: flex !important; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 7.5pt; font-weight: 700; }
  .sig-block { border: 0.5pt solid ${BORDER}; padding: 10px 12px; min-height: 60px; flex: 1; }
  .sig-line { border-bottom: 1pt solid ${DARK}; min-height: 32px; margin-top: 6px; }
  .cover-kv td:first-child { font-weight: 700; width: 140px; font-size: 11pt; }
  .cover-kv td { font-size: 11pt; padding: 7px 10px; border-bottom: 0.5pt solid ${BORDER}; border-left: none; border-right: none; border-top: none; }
  @media print {
    .no-print { display: none !important; }
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    body { font-size: 9pt; }
    h1 { font-size: 20pt; }
    h2 { font-size: 12pt; }
    .page-break { page-break-before: always; }
  }
`;

export default function SsspPrint() {
  const [, params] = useRoute("/sssps/:id/print");
  const id = Number(params?.id);
  const { data: sssp, isLoading } = useGetSssp(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();

  useEffect(() => {
    if (!isLoading && sssp) {
      document.title = `SSSP — ${sssp.projectName}`;
    }
  }, [isLoading, sssp]);

  if (isLoading) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>Loading…</div>
  );
  if (!sssp) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#c00" }}>SSSP not found.</div>
  );

  const d = (sssp.data as SsspData) ?? {};
  const siteName = sites?.find(s => s.id === sssp.siteId)?.name;
  const today = format(new Date(), "d MMMM yyyy");
  const jobDate = d.pcbu2SignedDate ? format(new Date(d.pcbu2SignedDate), "d MMMM yyyy") : today;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Print toolbar — hidden when printing */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100, background: DARK, color: "white",
        padding: "10px 20px", display: "flex", alignItems: "center", gap: 12,
        fontSize: 13, fontFamily: "sans-serif",
      }}>
        <span style={{ fontWeight: 800 }}><span style={{ color: "#ffffff" }}>FOR</span><span style={{ color: ORANGE }}>MATE</span></span>
        <span style={{ color: "#9CA3AF" }}>·</span>
        <span>{sssp.projectName}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => { window.location.href = window.location.pathname.replace(/\/print$/, ""); }}
          style={{ background: "transparent", border: "1px solid #4B5563", color: "white", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          ← Back
        </button>
        <button
          onClick={() => { window.location.href = window.location.pathname.replace(/\/print$/, "") + "?action=send"; }}
          style={{ background: "transparent", border: `1px solid ${ORANGE}`, color: ORANGE, padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Send to PCBU 1
        </button>
        <button onClick={() => window.print()}
          style={{ background: ORANGE, border: "none", color: "white", padding: "6px 18px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          Print / Save PDF
        </button>
      </div>
      {!d.pcbu2SignatureImage && (
        <div className="no-print" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontFamily: "sans-serif" }}>
          <span style={{ color: "#475569", fontWeight: 600 }}>Document ready.</span>
          <span style={{ color: "#64748b" }}>Add your signature, then come back to send or print.</span>
          <button onClick={() => { window.location.href = window.location.pathname.replace(/\/print$/, ""); }}
            style={{ background: "#334155", border: "none", color: "white", padding: "4px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>
            Add signature
          </button>
        </div>
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── COVER PAGE ── */}
        <div style={{ minHeight: "85vh", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 40 }}>
          <div>
            {d.pcbu2?.logoUrl ? (
              <img
                src={`/api/storage${d.pcbu2.logoUrl}`}
                alt={d.pcbu2.company ?? "Company logo"}
                style={{ maxHeight: 64, maxWidth: 240, objectFit: "contain", marginBottom: 32, display: "block" }}
              />
            ) : (
              <div style={{ border: `2px dashed ${BORDER}`, borderRadius: 6, padding: "12px 20px", display: "inline-block", marginBottom: 32, color: "#9CA3AF", fontSize: 9 }}>
                COMPANY LOGO
              </div>
            )}

            <h1 style={{ fontSize: 26, fontWeight: 900, color: ORANGE, marginBottom: 6 }}>Site-Specific Safety Plan</h1>
            <p style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 32 }}>
              Prepared in line with the Site Safe NZ SSSP framework (V22019JUNE) · WorkSafe New Zealand
            </p>

            <table className="cover-kv" style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
              <tbody>
                {[
                  ["Date", jobDate],
                  ["Site Address", d.siteAddress || siteName || "—"],
                  ["Activities", d.activities || "—"],
                  ["PCBU 1 (Principal)", d.pcbu1?.company || "—"],
                  ["PCBU 2 (Contractor)", d.pcbu2?.company || "RTC Concrete Grinding Ltd"],
                  ["Project Name", sssp.projectName],
                  ["Document Status", sssp.status.toUpperCase()],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontWeight: 700, width: 160, padding: "7px 8px", borderBottom: `0.5pt solid ${BORDER}`, fontSize: 11, color: DARK }}>{k}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `0.5pt solid ${BORDER}`, fontSize: 11 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, fontSize: 8.5, color: "#9CA3AF" }}>
            Generated by Formate · {today} · Confidential — for site use only
          </div>
        </div>

        {/* ── SECTION 1 — AGREEMENT ── */}
        <div className="page-break section">
          <h2>1. Site-Specific Health &amp; Safety Agreement</h2>
          <p style={{ marginBottom: 12, color: "#6B7280", fontSize: 9 }}>
            This agreement establishes the basis on which businesses agree to work together on this site.
            It forms part of the Site-Specific Safety Plan between the parties below.
          </p>

          <h3>PCBU 1 — Principal / Main Contractor / Client</h3>
          <PcbuTable pcbu={d.pcbu1} fallbackRole="PCBU 1 — Principal / Main Contractor / Client" />

          <h3 style={{ marginTop: 12 }}>PCBU 2 — Contractor</h3>
          <PcbuTable pcbu={d.pcbu2} fallbackCompany="RTC Concrete Grinding Ltd" fallbackRole="PCBU 2 — Subcontractor" />

          <h3 style={{ marginTop: 14 }}>Agreement Details</h3>
          <table className="kv-table">
            <tbody>
              {[
                ["WorkSafe notification required?", d.workSafeNotification || "—"],
                ["Task Analysis required?", d.taskAnalysisRequired || "—"],
                ["Hazard register provided?", d.hazardRegisterProvided || "—"],
                ["Hazardous substances on site?", d.hazardousSubstancesOnSite || "—"],
                ["Emergency Response Plan attached?", "Yes — see Emergency Response section"],
                ["SDS available on site?", (d.substances?.length ?? 0) > 0 ? "Yes — vehicle SDS folder + digital copies" : "—"],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v as string}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 2 — HAZARD REGISTER ── */}
        {(d.hazards ?? []).length > 0 && (
          <div className="page-break section">
            <h2>2. Site / Job Hazard &amp; Risk Register</h2>
            <p style={{ marginBottom: 8, fontSize: 9, color: "#6B7280" }}>
              Site: <strong>{d.siteAddress || siteName || "—"}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              PCBU 1: <strong>{d.pcbu1?.company || "—"}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              PCBU 2: <strong>{d.pcbu2?.company || "RTC Concrete Grinding Ltd"}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>Hazard / Risk</th>
                  <th style={{ width: "10%" }}>Initial Risk</th>
                  <th style={{ width: "30%" }}>Controls in Place</th>
                  <th style={{ width: "22%" }}>Control Level</th>
                  <th style={{ width: "10%" }}>Residual Risk</th>
                  <th style={{ width: "6%" }}>Toolbox</th>
                </tr>
              </thead>
              <tbody>
                {(d.hazards ?? []).map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{h.hazard}</td>
                    <td><span className="badge" style={{ background: riskBg(h.initialRisk), color: riskColor(h.initialRisk) }}>{h.initialRisk}</span></td>
                    <td>{h.controls}</td>
                    <td style={{ fontSize: 8 }}>{h.controlLevel}</td>
                    <td><span className="badge" style={{ background: riskBg(h.residualRisk), color: riskColor(h.residualRisk) }}>{h.residualRisk}</span></td>
                    <td style={{ textAlign: "center" }}>{h.toolbox ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SECTION 3 — TASK ANALYSIS ── */}
        {(d.taskSteps ?? []).length > 0 && (
          <div className="page-break section">
            <h2>3. Task Analysis</h2>
            <p style={{ marginBottom: 8, fontSize: 9, color: "#6B7280" }}>
              Activity: <strong>{d.activities || "—"}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Site: <strong>{d.siteAddress || siteName || "—"}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Step</th>
                  <th style={{ width: "18%" }}>Hazards / Risks</th>
                  <th style={{ width: "9%" }}>Initial</th>
                  <th style={{ width: "30%" }}>Controls</th>
                  <th style={{ width: "16%" }}>Control Level</th>
                  <th style={{ width: "9%" }}>Residual</th>
                </tr>
              </thead>
              <tbody>
                {(d.taskSteps ?? []).map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.step}</td>
                    <td>{s.hazards}</td>
                    <td><span className="badge" style={{ background: riskBg(s.initialRisk), color: riskColor(s.initialRisk) }}>{s.initialRisk}</span></td>
                    <td>{s.controls}</td>
                    <td style={{ fontSize: 8 }}>{s.controlLevel}</td>
                    <td><span className="badge" style={{ background: riskBg(s.residualRisk), color: riskColor(s.residualRisk) }}>{s.residualRisk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {/* ── SECTION 4 — HAZARDOUS SUBSTANCES ── */}
        {(d.substances ?? []).length > 0 && (
          <div className="page-break section">
            <h2>4. Hazardous Substances Register</h2>
            <p style={{ marginBottom: 8, fontSize: 9, color: "#6B7280" }}>
              Site: <strong>{d.siteAddress || siteName || "—"}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              SDS copies kept in vehicle folder and on operator's phone.
            </p>
            {(d.substances ?? []).map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ background: ORANGE, color: "white", fontWeight: 700, padding: "4px 8px", fontSize: 9.5 }}>
                  {i + 1}. {s.product}
                  <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 8.5, opacity: 0.9 }}>{s.unNumber}</span>
                  <span className="badge" style={{ marginLeft: 8, background: riskBg(s.initialRisk), color: riskColor(s.initialRisk), fontSize: 7.5 }}>{s.initialRisk}</span>
                  <span style={{ margin: "0 4px", opacity: 0.7 }}>→</span>
                  <span className="badge" style={{ background: riskBg(s.residualRisk), color: riskColor(s.residualRisk), fontSize: 7.5 }}>{s.residualRisk}</span>
                </div>
                <table className="kv-table" style={{ marginBottom: 0 }}>
                  <tbody>
                    {[
                      ["State", s.state], ["Hazard type", s.hazardType],
                      ["Max qty on site", s.maxQty], ["Storage", s.storage],
                      ["Segregation", s.segregation], ["SDS location", s.sdsLocation],
                      ["Control measures", s.controls], ["PPE required", s.ppe],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <tr key={k}><td style={{ width: "30%" }}>{k}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ── SECTION 5 — PPE ── */}
        {(d.ppeRequired ?? []).length > 0 && (
          <div className="page-break section">
            <h2>5. Personal Protective Equipment (PPE)</h2>
            <ul style={{ paddingLeft: 18, lineHeight: 2 }}>
              {(d.ppeRequired ?? []).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {/* ── SECTION 6 — EMERGENCY RESPONSE ── */}
        <div className="page-break section">
          <h2>6. Emergency Response Plan</h2>
          <table className="kv-table" style={{ marginBottom: 12 }}>
            <tbody>
              {[
                ["NZ Emergency Number", "111 — Police, Fire, Ambulance"],
                ["WorkSafe NZ", "0800 030 040"],
                ["Nearest Hospital / ED", d.nearestHospital || "—"],
                ["Hospital Address", d.hospitalAddress || "—"],
                ["Hospital Phone", d.hospitalPhone || "—"],
                ["Assembly / Muster Point", d.musterPoint || "—"],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>

          {d.emergencyProcedures && (
            <>
              <h3>Procedures</h3>
              <p style={{ fontSize: 9.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.emergencyProcedures}</p>
            </>
          )}

          {(d.emergencyContacts ?? []).length > 0 && (
            <>
              <h3>Emergency Contacts</h3>
              <table>
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Phone</th></tr>
                </thead>
                <tbody>
                  {(d.emergencyContacts ?? []).map((c, i) => (
                    <tr key={i}><td>{c.name}</td><td>{c.role}</td><td>{c.phone}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Default emergency scenarios for line marking */}
          <h3>Emergency Scenarios</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Scenario</th>
                <th style={{ width: "22%" }}>Equipment on hand</th>
                <th style={{ width: "44%" }}>Response method</th>
                <th style={{ width: "12%" }}>Lead</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  s: "Serious injury or medical event",
                  eq: "First aid kit, mobile phone",
                  m: "Call 111. Render first aid within competence. Direct ambulance to site entrance. Notify PCBU 1. Do not move casualty unless immediate danger.",
                  l: "First Aid Rep",
                },
                {
                  s: "Fire (vehicle, equipment, or thermoplastic boiler)",
                  eq: "Fire extinguisher (DCP/CO₂), mobile phone",
                  m: "Evacuate. Only attempt extinguishing if small and safe. Call 111. Notify PCBU 1.",
                  l: "Safety Rep",
                },
                {
                  s: "Chemical spill (paint, solvent, fuel)",
                  eq: "Spill kit, absorbent material, PPE",
                  m: "Stop work. Isolate. Don PPE. Use spill kit. Notify PCBU 1. Report to council if drains affected.",
                  l: "Safety Rep",
                },
                {
                  s: "Vehicle strike or near-miss",
                  eq: "First aid kit, phone, camera",
                  m: "Stop all work. Check for injuries. Call 111 if needed. Secure scene. Photograph. Notify PCBU 1 and NZ Police if applicable.",
                  l: "Safety Rep",
                },
                {
                  s: "Dust extractor failure during grinding",
                  eq: "P3 respirator, replacement filters",
                  m: "Stop grinding immediately. Vacate dusty area. Don P3 respirator. Diagnose and repair. Do NOT resume until extraction restored.",
                  l: "Operator",
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.s}</td>
                  <td>{row.eq}</td>
                  <td>{row.m}</td>
                  <td>{row.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 7 — COMMUNICATION ── */}
        <div className="page-break section">
          <h2>7. Communication &amp; Reporting Plan</h2>
          <table className="kv-table">
            <tbody>
              {[
                ["Toolbox talks", d.commToolboxFreq || "—"],
                ["Pre-start briefings", d.commPreStartFreq || "—"],
                ["Progress meetings", d.commProgressFreq || "—"],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v as string}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Incident Reporting to PCBU 1</h3>
          <table>
            <thead><tr><th>Event type</th><th>Reporting timeframe</th></tr></thead>
            <tbody>
              {[
                ["Serious injury", "Immediately by phone"],
                ["Injury requiring first aid", "Immediately by phone"],
                ["Near miss — serious", "Immediately by phone"],
                ["Near miss — minor", "Within 24 hours"],
                ["Damage to plant / equipment (serious)", "Within 24 hours"],
              ].map(([e, t]) => (
                <tr key={e}><td>{e}</td><td>{t}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Inspections</h3>
          <table>
            <thead><tr><th>Type</th><th>Frequency</th><th>Conducted by</th></tr></thead>
            <tbody>
              {[
                ["Pre-start inspection", "Before each day's work", d.pcbu2?.contact || "Operator"],
                ["Site inspection", "Weekly", d.pcbu2?.safetyRep || d.pcbu2?.contact || "Safety Rep"],
                ["Vehicles", "Weekly", d.pcbu2?.contact || "Operator"],
                ["Major plant / equipment", "Weekly", d.pcbu2?.contact || "Operator"],
              ].map(([t, f, c]) => (
                <tr key={t as string}><td>{t}</td><td>{f}</td><td>{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── SECTION 8 — TRAINING ── */}
        <div className="section">
          <h2>8. Training &amp; Competency</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role on site</th>
                <th>Key role</th>
                <th>Training / qualifications</th>
                <th>Competence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>{d.pcbu2?.contact || "—"}</td>
                <td>{d.pcbu2?.role || "Operator / Safety Rep"}</td>
                <td>On-site Safety Rep / First Aid Rep</td>
                <td>Site Safe Passport, First Aid (current), Trade-specific training and experience</td>
                <td>Competent</td>
              </tr>
            </tbody>
          </table>

          {(d.trainingItems ?? []).length > 0 && (
            <>
              <h3>Training Requirements</h3>
              <ul style={{ paddingLeft: 18, lineHeight: 1.9, fontSize: 9.5 }}>
                {(d.trainingItems ?? []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {d.inductionProcess && (
            <>
              <h3>Induction Process</h3>
              <p style={{ fontSize: 9.5, lineHeight: 1.6 }}>{d.inductionProcess}</p>
            </>
          )}
        </div>

        {/* ── SITE PHOTOS ── */}
        {Array.isArray(d.photos) && d.photos.length > 0 && (
          <div className="page-break section">
            <h2>Site Photos</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {d.photos.map((p: { id: string; objectPath: string; caption?: string }) => (
                <div key={p.id} style={{ border: "1px solid #E5E7EB", borderRadius: 4, overflow: "hidden", breakInside: "avoid" }}>
                  <img
                    src={`/api/storage${p.objectPath}`}
                    alt={p.caption ?? "Site photo"}
                    style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                  />
                  {p.caption && (
                    <div style={{ padding: "4px 6px", fontSize: 8.5, color: "#374151", lineHeight: 1.3 }}>
                      {p.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 9 — DECLARATION ── */}
        <div className="page-break section">
          <h2>9. Declaration &amp; Signatures</h2>
          <p style={{ marginBottom: 16, fontSize: 9.5, lineHeight: 1.6 }}>
            PCBU 2 (Contractor) agrees to act according to the content of this Site-Specific Safety Plan.
            PCBU 1 (Principal) acknowledges that this plan is the appropriate approach to health and safety
            on this site for the duration of the contract.
          </p>

          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {/* PCBU 1 */}
            <div className="sig-block">
              <div style={{ fontWeight: 700, fontSize: 9.5, marginBottom: 8 }}>
                PCBU 1 (Principal) — {d.pcbu1?.company || "——————————"}
              </div>
              <table style={{ fontSize: 9 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 100, fontWeight: 600, border: "none", paddingLeft: 0 }}>Signed by:</td>
                    <td style={{ border: "none" }}>
                      <div className="sig-line">{d.pcbu1SignedBy || ""}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, border: "none", paddingLeft: 0 }}>Signature:</td>
                    <td style={{ border: "none", paddingTop: 4 }}>
                      {d.pcbu1SignatureImage ? (
                        <img
                          src={d.pcbu1SignatureImage}
                          alt="Signature"
                          style={{ maxHeight: 60, maxWidth: 200, display: "block" }}
                        />
                      ) : (
                        <div style={{ height: 50, borderBottom: `1px solid ${BORDER}`, width: 180 }} />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, border: "none", paddingLeft: 0 }}>Date:</td>
                    <td style={{ border: "none" }}>
                      <div className="sig-line">
                        {d.pcbu1SignedDate ? format(new Date(d.pcbu1SignedDate), "d MMMM yyyy") : ""}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PCBU 2 */}
            <div className="sig-block" style={{ borderColor: ORANGE }}>
              <div style={{ fontWeight: 700, fontSize: 9.5, marginBottom: 8 }}>
                PCBU 2 (Contractor) — {d.pcbu2?.company || ""}
              </div>
              <table style={{ fontSize: 9 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 100, fontWeight: 600, border: "none", paddingLeft: 0 }}>Signed by:</td>
                    <td style={{ border: "none" }}>
                      <div className="sig-line">{d.pcbu2SignedBy || d.pcbu2?.contact || ""}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, border: "none", paddingLeft: 0 }}>Signature:</td>
                    <td style={{ border: "none", paddingTop: 4 }}>
                      {d.pcbu2SignatureImage ? (
                        <img
                          src={d.pcbu2SignatureImage}
                          alt="Signature"
                          style={{ maxHeight: 60, maxWidth: 200, display: "block" }}
                        />
                      ) : (
                        <div style={{ height: 50, borderBottom: `1px solid ${BORDER}`, width: 180 }} />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, border: "none", paddingLeft: 0 }}>Date:</td>
                    <td style={{ border: "none" }}>
                      <div className="sig-line">
                        {d.pcbu2SignedDate ? format(new Date(d.pcbu2SignedDate), "d MMMM yyyy") : ""}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, fontSize: 8, color: "#9CA3AF", marginTop: 24 }}>
            <strong><span style={{ color: DARK }}>FOR</span><span style={{ color: ORANGE }}>MATE</span></strong> · Site-Specific Safety Plan · {today} · This document must be reviewed and re-signed for any new site or change in scope.
            &nbsp;&nbsp;|&nbsp;&nbsp;WorkSafe NZ: 0800 030 040 &nbsp;&nbsp;|&nbsp;&nbsp; Emergency: 111
          </div>
        </div>

      </div>
    </>
  );
}

// ─── PCBU Table helper ──────────────────────────────────────────────────────

function PcbuTable({ pcbu, fallbackCompany, fallbackRole }: { pcbu?: Pcbu; fallbackCompany?: string; fallbackRole?: string }) {
  const rows = [
    ["Business name", pcbu?.company || fallbackCompany || "—"],
    pcbu?.tradingName ? ["Trading name", pcbu.tradingName] : null,
    ["Role", pcbu?.role || fallbackRole || "—"],
    ["Main contact", pcbu?.contact || "—"],
    ["Phone", pcbu?.phone || "—"],
    pcbu?.email ? ["Email", pcbu.email] : null,
    pcbu?.website ? ["Website", pcbu.website] : null,
    ["On-site safety representative", [pcbu?.safetyRep, pcbu?.safetyRepPhone].filter(Boolean).join("  ·  ") || "—"],
    ["First aid representative", [pcbu?.firstAid, pcbu?.firstAidPhone].filter(Boolean).join("  ·  ") || "—"],
  ].filter(Boolean) as [string, string][];

  return (
    <table className="kv-table">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}><td style={{ width: "38%" }}>{k}</td><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
