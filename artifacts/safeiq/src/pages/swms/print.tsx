import { useRoute } from "wouter";
import { useGetSwms, useListSites } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useEffect } from "react";

type HazardControl = {
  step: string;
  hazard: string;
  personsAtRisk: string;
  initialLikelihood: string;
  initialConsequence: string;
  initialRisk: string;
  controlMeasures: {
    eliminate?: string;
    substitute?: string;
    isolate?: string;
    engineer?: string;
    admin?: string;
    ppe?: string;
  };
  residualRisk: string;
};

type Worker = {
  name: string;
  role: string;
  signedDate: string;
};

type SwmsData = {
  hrceType?: string;
  pcbu?: string;
  projectName?: string;
  workLocation?: string;
  supervisor?: string;
  supervisorPhone?: string;
  startDate?: string;
  principalContractor?: string;
  principalContractorEmail?: string;
  licencesRequired?: string[];
  plantsEquipment?: string[];
  ppeRequired?: string[];
  steps?: HazardControl[];
  nearestHospital?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  musterPoint?: string;
  emergencyContacts?: { name: string; role: string; phone: string }[];
  reviewDate?: string;
  preparedBy?: string;
  workers?: Worker[];
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
  .hoc-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5pt; color: #6B7280; margin-bottom: 2px; }
  .hoc-value { font-size: 8.5pt; color: ${DARK}; }
  @media print {
    .no-print { display: none !important; }
    @page { size: A4; margin: 16mm 14mm 16mm 14mm; }
    body { font-size: 9pt; }
    h1 { font-size: 20pt; }
    h2 { font-size: 12pt; }
    .page-break { page-break-before: always; }
  }
`;

function HocCell({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="hoc-label" style={{ fontSize: "7.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5pt", color: "#6B7280", marginBottom: 2 }}>{label}</div>
      <div className="hoc-value" style={{ fontSize: "8.5pt", color: DARK }}>{value}</div>
    </div>
  );
}

export default function SwmsPrint() {
  const [, params] = useRoute("/swms/:id/print");
  const id = Number(params?.id);
  const { data: swms, isLoading } = useGetSwms(id, { query: { enabled: !!id } });
  const { data: sites } = useListSites();

  useEffect(() => {
    if (!isLoading && swms) {
      document.title = `SWMS — ${swms.activityName}`;
    }
  }, [isLoading, swms]);

  if (isLoading) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#666" }}>Loading…</div>
  );
  if (!swms) return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#c00" }}>SWMS not found.</div>
  );

  const d = (swms.data as SwmsData) ?? {};
  const siteName = sites?.find(s => s.id === swms.siteId)?.name;
  const today = format(new Date(), "d MMMM yyyy");
  const startDate = d.startDate ? format(new Date(d.startDate), "d MMMM yyyy") : "—";
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
        <span>SWMS — {swms.activityName}</span>
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
              AU — WHS ACT 2011
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: ORANGE, marginBottom: 6 }}>Safe Work Method Statement</h1>
            <p style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 32 }}>
              High-risk construction work — required under the Work Health and Safety Act 2011 and WHS Regulations 2011 (AU)
            </p>

            <table className="cover-kv" style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
              <tbody>
                {[
                  ["Activity / Task", swms.activityName],
                  ["HRCE Type", d.hrceType || "—"],
                  ["PCBU / Company", d.pcbu || "—"],
                  ["Project Name", d.projectName || "—"],
                  ["Work Location", d.workLocation || siteName || "—"],
                  ["Supervisor", d.supervisor || "—"],
                  ["Supervisor Phone", d.supervisorPhone || "—"],
                  ["Start Date", startDate],
                  ["Principal Contractor", d.principalContractor || "—"],
                  ["Prepared By", d.preparedBy || "—"],
                  ["Review Date", d.reviewDate ? format(new Date(d.reviewDate), "d MMMM yyyy") : "—"],
                  ["Workers Signed", `${signedCount} of ${(d.workers ?? []).length}`],
                  ["Document Status", swms.status.toUpperCase()],
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

        {/* ── HAZARD CONTROL TABLE ── */}
        {(d.steps ?? []).length > 0 && (
          <div className="page-break section">
            <h2>Hazard Identification &amp; Risk Control</h2>
            <p style={{ marginBottom: 8, fontSize: 9, color: "#6B7280" }}>
              Activity: <strong>{swms.activityName}</strong>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Location: <strong>{d.workLocation || siteName || "—"}</strong>
            </p>

            {(d.steps ?? []).map((s, i) => (
              <div key={i} style={{ marginBottom: 16, border: `0.5pt solid ${BORDER}`, borderRadius: 3 }}>
                {/* Step header */}
                <div style={{ background: "#1F2937", color: "white", padding: "5px 8px", display: "flex", alignItems: "center", gap: 10, fontSize: 9.5 }}>
                  <span style={{ background: ORANGE, color: "white", fontWeight: 900, fontSize: 8.5, padding: "1px 7px", borderRadius: 2 }}>STEP {i + 1}</span>
                  <span style={{ fontWeight: 700 }}>{s.step}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  {/* Left column */}
                  <div style={{ padding: "8px 10px", borderRight: `0.5pt solid ${BORDER}` }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 8.5, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5pt", marginBottom: 2 }}>Hazard</div>
                      <div style={{ fontSize: "9pt" }}>{s.hazard || "—"}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 8.5, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5pt", marginBottom: 2 }}>Persons at Risk</div>
                      <div style={{ fontSize: 9 }}>{s.personsAtRisk || "—"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 8.5, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5pt", marginBottom: 2 }}>Initial Risk</div>
                        <span className="badge" style={{ display: "inline-block", padding: "1px 7px", borderRadius: 99, fontSize: "7.5pt", fontWeight: 700, background: riskBg(s.initialRisk), color: riskColor(s.initialRisk) }}>{s.initialRisk || "—"}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 8.5, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5pt", marginBottom: 2 }}>Residual Risk</div>
                        <span className="badge" style={{ display: "inline-block", padding: "1px 7px", borderRadius: 99, fontSize: "7.5pt", fontWeight: 700, background: riskBg(s.residualRisk), color: riskColor(s.residualRisk) }}>{s.residualRisk || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right column — Hierarchy of Controls */}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 700, fontSize: 8.5, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5pt", marginBottom: 6 }}>Hierarchy of Controls</div>
                    {s.controlMeasures.eliminate && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 1 }}>① Eliminate</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.eliminate}</div>
                      </div>
                    )}
                    {s.controlMeasures.substitute && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#065F46", textTransform: "uppercase", marginBottom: 1 }}>② Substitute</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.substitute}</div>
                      </div>
                    )}
                    {s.controlMeasures.isolate && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 1 }}>③ Isolate</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.isolate}</div>
                      </div>
                    )}
                    {s.controlMeasures.engineer && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 1 }}>④ Engineer</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.engineer}</div>
                      </div>
                    )}
                    {s.controlMeasures.admin && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", marginBottom: 1 }}>⑤ Admin</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.admin}</div>
                      </div>
                    )}
                    {s.controlMeasures.ppe && (
                      <div style={{ marginBottom: 5 }}>
                        <div style={{ fontSize: "7.5pt", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", marginBottom: 1 }}>⑥ PPE</div>
                        <div style={{ fontSize: "8.5pt" }}>{s.controlMeasures.ppe}</div>
                      </div>
                    )}
                    {!Object.values(s.controlMeasures).some(Boolean) && (
                      <div style={{ color: "#9CA3AF", fontSize: "8.5pt" }}>No controls specified.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LICENCES REQUIRED ── */}
        {(d.licencesRequired ?? []).length > 0 && (
          <div className="page-break section">
            <h2>Licences &amp; Certifications Required</h2>
            <table>
              <thead>
                <tr><th>#</th><th>Licence / Certification</th></tr>
              </thead>
              <tbody>
                {(d.licencesRequired ?? []).map((l, i) => (
                  <tr key={i}>
                    <td style={{ width: 30, textAlign: "center", fontWeight: 700 }}>{i + 1}</td>
                    <td>{l}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PPE & EQUIPMENT ── */}
        {((d.ppeRequired ?? []).length > 0 || (d.plantsEquipment ?? []).length > 0) && (
          <div className="page-break section">
            <h2>PPE &amp; Plant / Equipment</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {(d.ppeRequired ?? []).length > 0 && (
                <div>
                  <h3>Personal Protective Equipment</h3>
                  {(d.ppeRequired ?? []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "9.5pt", padding: "3px 0" }}>
                      <span style={{ width: 14, height: 14, border: `1.5pt solid ${ORANGE}`, borderRadius: 2, display: "inline-block", flexShrink: 0, background: "#FFF7ED" }} />
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {(d.plantsEquipment ?? []).length > 0 && (
                <div>
                  <h3>Plant &amp; Equipment</h3>
                  {(d.plantsEquipment ?? []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "9.5pt", padding: "3px 0" }}>
                      <span style={{ width: 14, height: 14, border: `1.5pt solid ${BORDER}`, borderRadius: 2, display: "inline-block", flexShrink: 0, background: LIGHT_BG }} />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EMERGENCY ── */}
        <div className="page-break section">
          <h2>Emergency Procedures</h2>
          <table className="kv-table" style={{ marginBottom: 12 }}>
            <tbody>
              {[
                ["Emergency Number", "000 — Police, Fire, Ambulance"],
                ["Safe Work Australia", "1300 366 979"],
                ["Nearest Hospital / Medical", d.nearestHospital || "—"],
                ["Hospital Address", d.hospitalAddress || "—"],
                ["Hospital Phone", d.hospitalPhone || "—"],
                ["Assembly / Muster Point", d.musterPoint || "—"],
              ].map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
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
        </div>

        {/* ── WORKER SIGN-OFF ── */}
        <div className="page-break section">
          <h2>Worker Acknowledgement &amp; Sign-off</h2>
          <p style={{ marginBottom: 10, fontSize: 9, color: "#6B7280" }}>
            I confirm I have read, understood, and will comply with this SWMS. I understand I must not commence work until I have signed.
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
                  <tr key={i}>
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

          <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
            <div style={{ flex: 1, border: `0.5pt solid ${BORDER}`, padding: "10px 12px", minHeight: 70 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Prepared By</div>
              <div style={{ fontSize: 9.5, color: DARK }}>{d.preparedBy || ""}</div>
              <div style={{ borderBottom: `1pt solid ${DARK}`, minHeight: 24, marginTop: 8 }} />
              <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 4 }}>Signature &amp; date</div>
            </div>
            <div style={{ flex: 1, border: `0.5pt solid ${BORDER}`, padding: "10px 12px", minHeight: 70 }}>
              <div style={{ fontWeight: 700, fontSize: 9, marginBottom: 4 }}>Principal Contractor Review</div>
              <div style={{ fontSize: 9.5, color: DARK }}>{d.principalContractor || ""}</div>
              <div style={{ borderBottom: `1pt solid ${DARK}`, minHeight: 24, marginTop: 8 }} />
              <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 4 }}>Signature &amp; date</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 24, fontSize: 8, color: "#9CA3AF", textAlign: "center" }}>
          Generated by Formate · {today} · {swms.activityName}
        </div>
      </div>
    </>
  );
}
