// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { calcTakeHome, parseTaxCode } from "./lib/ukTax";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./app.css";

function formatGBP(n, digits = 0) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(n) || 0);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function toAnnual(amount, period) {
  const n = Number(amount) || 0;
  if (period === "monthly") return n * 12;
  if (period === "weekly") return n * 52;
  return n;
}

function fromAnnual(annual, period) {
  const n = Number(annual) || 0;
  if (period === "monthly") return n / 12;
  if (period === "weekly") return n / 52;
  return n;
}

function periodLabel(period) {
  if (period === "monthly") return "Monthly";
  if (period === "weekly") return "Weekly";
  return "Yearly";
}

function sliderConfig(period) {
  // Annual cap: 150,000. Convert max to selected period.
  if (period === "monthly") return { min: 0, max: 12500, step: 50 };
  if (period === "weekly") return { min: 0, max: 2885, step: 10 };
  return { min: 0, max: 150000, step: 500 };
}

function safeFileNamePart(s) {
  return String(s || "")
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Report name
  const [userName, setUserName] = useState("");

  // Income
  const [period, setPeriod] = useState("yearly"); // yearly | monthly | weekly
  const [income, setIncome] = useState(35200);    // value in chosen period

  // Tax code
  const [taxCode, setTaxCode] = useState("1257L");

  // Extras
  const [includePension, setIncludePension] = useState(false);
  const [pensionPercent, setPensionPercent] = useState(5);
  const [showBreakdown, setShowBreakdown] = useState(true);

  const { min, max, step } = useMemo(() => sliderConfig(period), [period]);

  // Keep income valid when switching period/max
  useEffect(() => {
    setIncome((v) => clamp(Number(v) || 0, min, max));
  }, [min, max]);

  const annualGross = useMemo(() => toAnnual(income, period), [income, period]);

  const effectiveAnnualGross = useMemo(() => {
    if (!includePension) return annualGross;
    const pct = clamp(Number(pensionPercent) || 0, 0, 50);
    return annualGross * (1 - pct / 100);
  }, [annualGross, includePension, pensionPercent]);

  const pensionAmountAnnual = useMemo(() => {
    if (!includePension) return 0;
    return annualGross - effectiveAnnualGross;
  }, [annualGross, effectiveAnnualGross, includePension]);

  const result = useMemo(() => {
    return calcTakeHome(effectiveAnnualGross, { taxCode });
  }, [effectiveAnnualGross, taxCode]);

  const taxCodeInfo = useMemo(() => parseTaxCode(taxCode), [taxCode]);

  function onPeriodChange(nextPeriod) {
    const currentAnnual = toAnnual(income, period);
    const nextIncome = fromAnnual(currentAnnual, nextPeriod);
    const cfg = sliderConfig(nextPeriod);
    setPeriod(nextPeriod);
    setIncome(clamp(nextIncome, cfg.min, cfg.max));
  }

  function downloadPdfReport() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const now = new Date();
    const year = now.getFullYear();
    const displayName = userName.trim() || "Unnamed user";

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("UK Tax Breakdown Report", 40, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Name: ${displayName}`, 40, 72);
    doc.text(`Generated: ${now.toLocaleString("en-GB")}`, 40, 90);

    // Summary
    const summary = [
      ["Income input", `${periodLabel(period)}: ${formatGBP(income)} (${formatGBP(annualGross)} / year)`],
      ["Tax code", `${String(taxCode || "").toUpperCase()} (${result.taxCodeType})`],
      ["Allowance used", formatGBP(result.allowanceUsed)],
      ["Pension", includePension ? `${pensionPercent}% (−${formatGBP(pensionAmountAnnual)} / year)` : "Not included"],
    ];

    autoTable(doc, {
      startY: 110,
      head: [["Summary", "Value"]],
      body: summary,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [17, 26, 46] },
    });

    // Breakdown
    const resultsBody = [
      ["Gross annual income", formatGBP(annualGross)],
      ["Income Tax", formatGBP(result.incomeTax)],
      ["National Insurance", formatGBP(result.ni)],
      ["Total deductions (Tax + NI + Pension)", formatGBP(result.incomeTax + result.ni + pensionAmountAnnual)],
      ["Take-home (annual)", formatGBP(result.netAnnual)],
      ["Take-home (monthly)", formatGBP(Math.round(result.netMonthly))],
      ["Take-home (weekly)", formatGBP(Math.round(result.netWeekly))],
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [["Breakdown", "Amount"]],
      body: resultsBody,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const netPct = annualGross === 0 ? 0 : Math.round((result.netAnnual / annualGross) * 100);
    const effRate = annualGross === 0 ? 0 : Math.round(((result.incomeTax + result.ni) / annualGross) * 100);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [["Quick metrics", "Value"]],
      body: [
        ["Net % of gross", `${netPct}%`],
        ["Tax + NI effective rate", `${effRate}%`],
      ],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [17, 26, 46] },
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`© ${year} Nomaer Rahman`, 40, pageHeight - 28);
    doc.text("Page 1", pageWidth - 40, pageHeight - 28, { align: "right" });

    const fileName = `uk-tax-report-${safeFileNamePart(displayName) || "user"}-${now
      .toISOString()
      .slice(0, 10)}.pdf`;

    doc.save(fileName);
  }

  return (
    <div className="page">
    <header className="topbar">
  <div className="topbarInner">
    <div className="brand">
      <h1 className="title">UK Take-Home Pay Calculator</h1>
      <p className="subtitle">rUK (England/Wales/NI) • Employee NI Category A • Tax code aware</p>
    </div>

    <div className="actions">
      <button
        className="chip"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      >
        {theme === "dark" ? "Day mode" : "Night mode"}
      </button>
    </div>
  </div>
</header>


      <main className="grid">
        {/* LEFT: Inputs */}
        <section className="card">
          <h2 className="cardTitle">Inputs</h2>

          <div className="field">
            <label className="label">Name (for report)</label>
            <input
              className="textInput"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. John Smith"
            />
            <div className="hint">This name will appear in the PDF report.</div>
          </div>

          <div className="field">
            <label className="label">Income period</label>
            <select
              className="textInput"
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              aria-label="Income period selector"
            >
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <div className="hint">Annual equivalent is capped at £150,000.</div>
          </div>

          <div className="field">
            <label className="labelRow">
              <span>{periodLabel(period)} income</span>
              <span className="value">{formatGBP(income)}</span>
            </label>

            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              aria-label="Income slider"
            />

            <div className="rangeMeta">
              <span>{formatGBP(min)}</span>
              <span>{formatGBP(max)}</span>
            </div>

            <div className="hint">
              Annual equivalent: <b>{formatGBP(annualGross)}</b>
            </div>
          </div>

          <div className="field">
            <label className="label">Type income ({periodLabel(period).toLowerCase()})</label>
            <input
              className="textInput"
              type="number"
              min={min}
              max={max}
              step={step}
              value={income}
              onChange={(e) => setIncome(clamp(Number(e.target.value || 0), min, max))}
            />
          </div>

          <div className="field">
            <label className="label">Tax code</label>
            <input
              className="textInput"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="e.g. 1257L, 0T, BR, D0, D1, NT, K500"
            />
            <div className="hint">
              Interpreted as:{" "}
              <b>
                {taxCodeInfo.type === "STANDARD" && `Personal Allowance ${formatGBP(taxCodeInfo.allowance)}`}
                {taxCodeInfo.type === "0T" && "0T (no personal allowance)"}
                {taxCodeInfo.type === "BR" && "BR (all income taxed at 20%)"}
                {taxCodeInfo.type === "D0" && "D0 (all income taxed at 40%)"}
                {taxCodeInfo.type === "D1" && "D1 (all income taxed at 45%)"}
                {taxCodeInfo.type === "NT" && "NT (no income tax)"}
                {taxCodeInfo.type === "K" && `K code (adds ${formatGBP(Math.abs(taxCodeInfo.allowance))} taxable)`}
              </b>
            </div>
          </div>

          <hr className="divider" />

          <h3 className="sectionTitle">Extras</h3>

          <div className="toggleRow">
            <label className="toggle">
              <input
                type="checkbox"
                checked={includePension}
                onChange={(e) => setIncludePension(e.target.checked)}
              />
              <span>Include pension contribution</span>
            </label>
          </div>

          {includePension && (
            <div className="field">
              <label className="labelRow">
                <span>Pension %</span>
                <span className="value">{pensionPercent}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={pensionPercent}
                onChange={(e) => setPensionPercent(Number(e.target.value))}
                aria-label="Pension percentage slider"
              />
              <div className="hint">
                Pension deducted: <b>{formatGBP(pensionAmountAnnual)}</b> / year
              </div>
            </div>
          )}

          <div className="toggleRow">
            <label className="toggle">
              <input
                type="checkbox"
                checked={showBreakdown}
                onChange={(e) => setShowBreakdown(e.target.checked)}
              />
              <span>Show detailed breakdown</span>
            </label>
          </div>
        </section>

        {/* RIGHT: Results */}
        <section className="card">
          <h2 className="cardTitle">Results</h2>

          <div className="resultGrid">
            <div className="resultBox">
              <div className="resultLabel">Gross (annual)</div>
              <div className="resultValue">{formatGBP(annualGross)}</div>
            </div>

            <div className="resultBox">
              <div className="resultLabel">Tax code</div>
              <div className="resultValue">{String(taxCode || "").toUpperCase()}</div>
              <div className="smallMuted">
                Type: {result.taxCodeType} • Allowance: {formatGBP(result.allowanceUsed)}
              </div>
            </div>

            <div className="resultBox">
              <div className="resultLabel">Income Tax</div>
              <div className="resultValue">{formatGBP(result.incomeTax)}</div>
            </div>

            <div className="resultBox">
              <div className="resultLabel">National Insurance</div>
              <div className="resultValue">{formatGBP(result.ni)}</div>
            </div>

            <div className="resultBox resultBoxHighlight">
              <div className="resultLabel">Take-home (annual)</div>
              <div className="resultValue">{formatGBP(result.netAnnual)}</div>
              {includePension && (
                <div className="smallMuted">Pension included: −{formatGBP(pensionAmountAnnual)} / year</div>
              )}
            </div>

            <div className="resultBox">
              <div className="resultLabel">Take-home (monthly)</div>
              <div className="resultValue">{formatGBP(Math.round(result.netMonthly))}</div>
            </div>

            <div className="resultBox">
              <div className="resultLabel">Take-home (weekly)</div>
              <div className="resultValue">{formatGBP(Math.round(result.netWeekly))}</div>
            </div>

            <div className="resultBox">
              <div className="resultLabel">Total deductions</div>
              <div className="resultValue">
                {formatGBP(result.incomeTax + result.ni + pensionAmountAnnual)}
              </div>
            </div>
          </div>

          {showBreakdown && (
            <>
              <hr className="divider" />
              <h3 className="sectionTitle">Quick breakdown</h3>
              <ul className="breakdown">
                <li>
                  <span>Net % of gross</span>
                  <span>
                    {annualGross === 0 ? "0%" : `${Math.round((result.netAnnual / annualGross) * 100)}%`}
                  </span>
                </li>
                <li>
                  <span>Tax + NI effective rate</span>
                  <span>
                    {annualGross === 0 ? "0%" : `${Math.round(((result.incomeTax + result.ni) / annualGross) * 100)}%`}
                  </span>
                </li>
                <li>
                  <span>Pension %</span>
                  <span>{includePension ? `${pensionPercent}%` : "0%"}</span>
                </li>
              </ul>
            </>
          )}

          <button className="btn" onClick={downloadPdfReport}>
            Download PDF report
          </button>

          <hr className="divider" />
          <footer className="footer footerCenter">© {new Date().getFullYear()} Nomaer Rahman</footer>
        </section>
      </main>
    </div>
  );
}
