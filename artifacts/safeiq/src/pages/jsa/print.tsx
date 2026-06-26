import { useRoute } from "wouter";
import { useGetJsa, useListSites } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useEffect } from "react";

type JsaStep = {
  step: string;
  hazards: string;
  controls: string;
  risk: string;
  residualRisk: string;
};

type JsaWorker = {
  name: string;
  role: string;
  signedDate: string;
};

type JsaData = {
  date?: string;
  location?: string;
  supervisor?: string;
  supervisorPhone?: string;
  permitRequired?: string;
  permitNumber?: string;
  workDescription?: string;
  ppeRequired?: string[];
  steps?: JsaStep[];
  emergencyPlan?: string;
  nearestHospital?: string;
  hospitalPhone?: string;
  musterPoint?: string;
  workers?: JsaWorker[];
  reviewedBy?: string;
};

const ORANGE = "#E87722";
const DARK = "#1F2937";
const LIGHT_BG = "#F9FAFB";
const BORDER = "#D1D5DB";

const riskBg = (r?: string) => {
  if (r === "Critical" || r === "High") return "#FEE2E2";
  if (r === "Medium") return "#FEF9C3";
  return "#DCFCE7";
};
const riskColor = (r?: string) => {
  if (r === "Critical" || r === "High") return "#991B1B";
  if (r === "Medium") return "#92400E";
  return "#166534";
};

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
  .cover-kv td:first-child { font-weight: 700; width: 160px; font-size: 11pt; }
  .cover-kv td { font-size: 11pt; padding: 7px 10px; border-bottom: 0.5pt solid ${BORDER}; border-left: none; border-right: none; border-top: none; }
  .ppe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .ppe-item { font-size: 9pt; display: flex; align-items: center; gap: 6px; }
  .signed-row td { background: #F0FDF4 !important; }
  @media print {
    .no-print { display: none !important; }
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    body { font-size: 9pt; }
    h1 { font-size: 20pt; }
    h2 { font-size: 12pt; }
    .page-break { page-break-before: always; }
  }
`;

export default function JsaPrint() {
  const [, params] = useRoute("/jsa/:id/print");
  const id = Number(params?.id);
  const { data: jsa, isLoading } = useGetJsa(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();

  useEffect(() => {
    if (!isLoading && jsa) {
      document.title = `JSA — ${jsa.jobName}`;
    }
  }, [isLoading, jsa]);

  if (isLoading) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>Loading…</div>
  );
  if (!jsa) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#c00" }}>JSA not found.</div>
  );

  const d = (jsa.data as JsaData) ?? {};
  const siteName = sites?.find(s => s.id === jsa.siteId)?.name;
  const today = format(new Date(), "d MMMM yyyy");
  const jobDate = d.date ? format(new Date(d.date), "d MMMM yyyy") : today;
  const signedCount = (d.workers ?? []).filter(w => w.signedDate).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Toolbar — hidden when printing */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100, background: DARK, color: "white",
        padding: "10px 20px", display: "flex", alignItems: "center", gap: 12,
        fontSize: 13, fontFamily: "sans-serif",
      }}>
        <span style={{ fontWeight: 800 }}>
          <span style={{ color: "#ffffff" }}>FOR</span><span style={{ color: ORANGE }}>MATE</span>
        </span>
        <span style={{ color: "#9CA3AF" }}>·</span>
        <span>JSA — {jsa.jobName}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { window.location.href = window.location.pathname.replace(/\/print$/, ""); }}
          style={{ background: "transparent", border: "1px solid #4B5563", color: "white", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: ORANGE, border: "none", color: "white", padding: "6px 18px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          Print / Save PDF
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── COVER ── */}
        <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 40 }}>
          <div>
            <div style={{ display: "inline-block", background: ORANGE, color: "white", fontWeight: 900, fontSize: 9, letterSpacing: 2, padding: "3px 10px", borderRadius: 3, marginBottom: 16 }}>
              AU / NZ
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: ORANGE, marginBottom: 6 }}>Job Safety Analysis</h1>
            <p style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 32 }}>
              Pre-task hazard identification — WHS Act 2011 (AU) / Health and Safety at Work Act 2015 (NZ)
            </p>

            <table className="cover-kv" style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
              <tbody>
                {[
                  ["Date", jobDate],
                  ["Job / Task", jsa.jobName],
                  ["Work Location", d.location || siteName || "—"],
                  ["Supervisor", d.supervisor || "—"],
                  ["Supervisor Phone", d.supervisorPhone || "—"],
                  ["Permit Required", d.permitRequired || "—"],
                  ...(d.permitRequired && d.permitRequired !== "No" ? [["Permit Number", d.permitNumber || "—"]] : []),
                  ["Workers Signed", `${signedCount} of ${(d.workers ?? []).length}`],
                  ["Document Status", jsa.status.toUpperCase()],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontWeight: 700, width: 160, padding: "7px 8px", borderBottom: `0.5pt solid ${BORDER}`, fontSize: 11, color: DARK }}>{k}</td>
                    <td style={{ padding: "7px 8px", borderBottom: `0.5pt solid ${BORDER}`, fontSize: 11 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {d.workDescription && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Work Description</div>
                <p style={{ fontSize: 10.5, lineHeight: 1.6, whiteSpace: "pre-wrap", color: DARK }}>{d.workDescription}</p>
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, fontSize: 8.5, color: "#9CA3AF" }}>
            Generated by Formate · {today} · Confidential — for site use only
          </div>
        </div>

        {/* ── STEPS & HAZARDS ── */}
        {(d.steps ?? []).length > 0 && (
          <div className="page-break section">
            <h2>Steps, Hazards &amp; Controls</h2>
            <p style={{ marginBottom: 8, fontSize: 9, color: "#6B7280" }}>
              Job: <strong>{jsa.jobName}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Site: <strong>{d.location || siteName || "—"}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: "4%" }}>#</th>
                  <th style={{ width: "22%" }}>Work Step</th>
                  <th style={{ width: "22%" }}>Hazards / Risks</th>
                  <th style={{ width: "9%" }}>Initial Risk</th>
                  <th style={{ width: "34%" }}>Control Measures</th>
                  <th style={{ width: "9%" }}>Residual Risk</th>
                </tr>
              </thead>
              <tbody>
                {(d.steps ?? []).map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, textAlign: "center" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.step}</td>
                    <td>{s.hazards}</td>
                    <td>
                      <span className="badge" style={{ background: riskBg(s.risk), color: riskColor(s.risk) }}>{s.risk}</span>
                    </td>
                    <td>{s.controls}</td>
                    <td>
                      <span className="badge" style={{ background: riskBg(s.residualRisk), color: riskColor(s.residualRisk) }}>{s.residualRisk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PPE ── */}
        {(d.ppeRequired ?? []).length > 0 && (
          <div className="page-break section">
            <h2>Personal Protective Equipment (PPE)</h2>
            <div className="ppe-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 8 }}>
              {(d.ppeRequired ?? []).map((item, i) => (
                <div key={i} className="ppe-item" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, padding: "3px 0" }}>
                  <span style={{ width: 14, height: 14, border: `1.5pt solid ${ORANGE}`, borderRadius: 2, display: "inline-block", flexShrink: 0, background: "#FFF7ED" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMERGENCY ── */}
        <div className="page-break section">
          <h2>Emergency Procedures</h2>
          <table className="kv-table" style={{ marginBottom: 12 }}>
            <tbody>
              {[
                ["Emergency Number", "000 (AU) · 111 (NZ) — Police, Fire, Ambulance"],
                ["Nearest Hospital / Medical", d.nearestHospital || "—"],
                ["Emergency Phone", d.hospitalPhone || "—"],
                ["Assembly / Muster Point", d.musterPoint || "—"],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
          {d.emergencyPlan && (
            <>
              <h3>Emergency Actions</h3>
              <p style={{ fontSize: 9.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{d.emergencyPlan}</p>
            </>
          )}
        </div>

        {/* ── WORKER SIGN-OFF ── */}
        <div className="page-break section">
          <h2>Worker Sign-off</h2>
          <p style={{ marginBottom: 10, fontSize: 9, color: "#6B7280" }}>
            All crew members must sign to confirm they have read, understood, and agree to work in accordance with this JSA.
          </p>
          {(d.workers ?? []).length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Name</th>
                  <th style={{ width: "35%" }}>Role / Trade</th>
                  <th style={{ width: "25%" }}>Date Signed</th>
                </tr>
              </thead>
              <tbody>
                {(d.workers ?? []).map((w, i) => (
                  <tr key={i} className={w.signedDate ? "signed-row" : ""}>
                    <td style={w.signedDate ? { background: "#F0FDF4" } : {}}>{w.name || "—"}</td>
                    <td style={w.signedDate ? { background: "#F0FDF4" } : {}}>{w.role || "—"}</td>
                    <td style={w.signedDate ? { background: "#F0FDF4", color: "#166534", fontWeight: 700 } : {}}>
                      {w.signedDate ? format(new Date(w.signedDate), "d MMM yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ border: `0.5pt solid ${BORDER}`, padding: "20px 16px", textAlign: "center", color: "#9CA3AF", fontSize: 9 }}>
              No workers added — sign-off to be completed before work begins.
            </div>
          )}

          {/* Signature block for supervisor */}
          <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
            <div style={{ flex: 1, border: `0.5pt solid ${BORDER}`, padding: "10px 12px", minHeight: 70 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Supervisor / Team Leader</div>
              <div style={{ borderBottom: `1pt solid ${DARK}`, minHeight: 30, marginTop: 8 }} />
              <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 4 }}>Signature &amp; date</div>
            </div>
            <div style={{ flex: 1, border: `0.5pt solid ${BORDER}`, padding: "10px 12px", minHeight: 70 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Reviewed By</div>
              <div style={{ fontSize: 9.5, color: DARK, marginTop: 4 }}>{d.reviewedBy || ""}</div>
              <div style={{ borderBottom: `1pt solid ${DARK}`, minHeight: 20, marginTop: 8 }} />
              <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 4 }}>Signature &amp; date</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 24, fontSize: 8, color: "#9CA3AF", textAlign: "center" }}>
          Generated by Formate · {today} · {jsa.jobName}
        </div>
      </div>
    </>
  );
}
