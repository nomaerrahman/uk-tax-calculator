// src/lib/ukTax.js
// UK (England/Wales/NI "rUK") simplified income tax + Employee NI (Category A)
// Adds tax code support (standard codes + 0T/BR/D0/D1/NT/K codes)

const TAX = {
  // Band widths are in TAXABLE income (i.e., after allowance)
  // Basic rate taxable width = 50,270 - 12,570 = 37,700
  // Higher rate taxable width = 125,140 - 50,270 = 74,870
  taxableBandWidths: [37700, 74870, Infinity],
  rates: [0.2, 0.4, 0.45],
};

// 2025/26 Employee NI (Class 1) category A thresholds/rates (weekly)
const NI = {
  weekly: {
    lower: 242,
    upper: 967,
    mainRate: 0.08,
    upperRate: 0.02,
  },
};

/**
 * Parse UK tax codes in a practical/simplified way.
 * - Standard codes like 1257L => allowance = 1257 * 10 = 12,570
 * - 0T => allowance = 0
 * - BR => all income taxed at 20%
 * - D0 => all income taxed at 40%
 * - D1 => all income taxed at 45%
 * - NT => no tax
 * - Kxxx => negative allowance (adds extra taxable amount), e.g. K500 => -5,000 allowance
 */
export function parseTaxCode(raw) {
  const code = String(raw || "").trim().toUpperCase();

  if (!code) return { code: "1257L", type: "STANDARD", allowance: 12570 };

  if (code === "NT") return { code, type: "NT", allowance: 0 };
  if (code === "BR") return { code, type: "BR", allowance: 0 };
  if (code === "D0") return { code, type: "D0", allowance: 0 };
  if (code === "D1") return { code, type: "D1", allowance: 0 };
  if (code === "0T") return { code, type: "0T", allowance: 0 };

  if (code.startsWith("K")) {
    const digits = code.slice(1).match(/^\d{1,4}$/)?.[0];
    if (digits) return { code, type: "K", allowance: -(Number(digits) * 10) };
  }

  // Standard codes: 1257L, 1257M, 1257N, 1185L, etc.
  const match = code.match(/^(\d{1,4})[A-Z]*$/);
  if (match) return { code, type: "STANDARD", allowance: Number(match[1]) * 10 };

  // Fallback
  return { code: "1257L", type: "STANDARD", allowance: 12570 };
}

export function calcIncomeTax(annualGross, options = {}) {
  const gross = Math.max(0, Number(annualGross) || 0);
  const taxCode = String(options.taxCode || "1257L").trim().toUpperCase();
  const tc = parseTaxCode(taxCode);

  // Special codes: no allowance / flat tax / no tax
  if (tc.type === "NT") return { tax: 0, allowanceUsed: 0, taxCodeType: tc.type };

  if (tc.type === "BR") return { tax: round2(gross * 0.20), allowanceUsed: 0, taxCodeType: tc.type };
  if (tc.type === "D0") return { tax: round2(gross * 0.40), allowanceUsed: 0, taxCodeType: tc.type };
  if (tc.type === "D1") return { tax: round2(gross * 0.45), allowanceUsed: 0, taxCodeType: tc.type };

  // STANDARD / 0T / K
  const allowance = tc.allowance; // can be 0 or negative
  const taxable = Math.max(0, gross - allowance);

  let remaining = taxable;
  let tax = 0;

  for (let i = 0; i < TAX.taxableBandWidths.length; i++) {
    const inBand = Math.min(remaining, TAX.taxableBandWidths[i]);
    if (inBand > 0) tax += inBand * TAX.rates[i];
    remaining -= inBand;
    if (remaining <= 0) break;
  }

  return { tax: round2(tax), allowanceUsed: allowance, taxCodeType: tc.type };
}

export function calcEmployeeNI(annualGross) {
  const gross = Math.max(0, Number(annualGross) || 0);
  const weekly = gross / 52;

  const { lower, upper, mainRate, upperRate } = NI.weekly;

  const mainBand = clamp(weekly - lower, 0, upper - lower);
  const upperBand = Math.max(0, weekly - upper);

  const weeklyNI = mainBand * mainRate + upperBand * upperRate;
  return round2(weeklyNI * 52);
}

export function calcTakeHome(annualGross, options = {}) {
  const gross = Math.max(0, Number(annualGross) || 0);

  const taxInfo = calcIncomeTax(gross, options);
  const ni = calcEmployeeNI(gross);

  const netAnnual = Math.max(0, gross - taxInfo.tax - ni);

  return {
    grossAnnual: round2(gross),
    incomeTax: taxInfo.tax,
    ni,
    netAnnual: round2(netAnnual),
    netMonthly: round2(netAnnual / 12),
    netWeekly: round2(netAnnual / 52),

    taxCode: String(options.taxCode || "1257L").toUpperCase(),
    taxCodeType: taxInfo.taxCodeType,
    allowanceUsed: taxInfo.allowanceUsed,
  };
}

function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}
