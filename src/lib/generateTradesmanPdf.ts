import jsPDF from "jspdf";

const NAVY = "#00172F";
const PRIMARY = "#E8530A";
const SECONDARY = "#D93870";
const CREAM = "#FDF6EE";
const TEXT_SECONDARY = "#5A6A7A";
const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addPageBg(doc: jsPDF) {
  doc.setFillColor(253, 246, 238);
  doc.addPage();
  doc.rect(0, 0, PAGE_W, 297, "F");
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 270) {
    addPageBg(doc);
    return 20;
  }
  return y;
}

function drawGradientBar(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const steps = 20;
  const stepW = w / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(232 + (217 - 232) * ratio);
    const g = Math.round(83 + (56 - 83) * ratio);
    const b = Math.round(10 + (112 - 10) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(x + i * stepW, y, stepW + 0.5, h, "F");
  }
}

export function generateTradesmanPdf(triage: any, diagnosis: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Background
  doc.setFillColor(253, 246, 238);
  doc.rect(0, 0, PAGE_W, 297, "F");

  let y = 20;

  // Gradient header bar
  drawGradientBar(doc, 0, 0, PAGE_W, 8);

  // Title
  y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 23, 47);
  doc.text("Issue Report for Your Tradesman", MARGIN, y);

  // Subtitle
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 106, 122);
  doc.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, MARGIN, y);

  // Thin line
  y += 5;
  doc.setDrawColor(0, 23, 47);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  // === SECTION 1: Problem Summary ===
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 83, 10);
  doc.text("Problem Summary", MARGIN, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 23, 47);
  const title = triage?.issue_title || "Issue Detected";
  doc.text(title, MARGIN, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 106, 122);
  const desc = triage?.brief_description || "";
  const descLines = doc.splitTextToSize(desc, CONTENT_W);
  doc.text(descLines, MARGIN, y);
  y += descLines.length * 5;

  // Category & urgency
  y += 3;
  const category = triage?.category || "other";
  const urgency = diagnosis?.urgency_assessment;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 23, 47);
  doc.text(`Category: ${category.charAt(0).toUpperCase() + category.slice(1)}`, MARGIN, y);
  if (urgency?.level) {
    doc.text(`Urgency: ${urgency.level.replace("_", " ").toUpperCase()}`, MARGIN + 60, y);
  }

  // === SECTION 2: Possible Causes ===
  y += 12;
  y = checkPageBreak(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 83, 10);
  doc.text("Possible Causes", MARGIN, y);

  y += 8;
  doc.setFontSize(10);
  if (diagnosis?.likely_causes?.length > 0) {
    for (const cause of diagnosis.likely_causes) {
      y = checkPageBreak(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 23, 47);
      const causeLines = doc.splitTextToSize(`• ${cause.cause}`, CONTENT_W);
      doc.text(causeLines, MARGIN, y);
      y += causeLines.length * 5;

      if (cause.details) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(90, 106, 122);
        const detailLines = doc.splitTextToSize(cause.details, CONTENT_W - 4);
        doc.text(detailLines, MARGIN + 4, y);
        y += detailLines.length * 5 + 3;
      }
    }
  }

  // === SECTION 3: Questions to Ask Your Tradesman ===
  y += 8;
  y = checkPageBreak(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 83, 10);
  doc.text("Questions to Ask Your Tradesman", MARGIN, y);

  y += 8;
  doc.setFontSize(10);

  // Generate questions from diagnosis data
  const questions: string[] = [];

  // From causes
  if (diagnosis?.likely_causes?.length > 0) {
    for (const cause of diagnosis.likely_causes) {
      questions.push(`Could this be caused by ${cause.cause.toLowerCase()}? If so, what is the best fix?`);
    }
  }

  // From DIY fixes - frame as professional alternatives
  if (diagnosis?.diy_quick_fixes?.length > 0) {
    for (const fix of diagnosis.diy_quick_fixes) {
      questions.push(`Would you recommend "${fix.action.toLowerCase()}" as a fix, or is a more thorough repair needed?`);
    }
  }

  // From call_pro_if
  if (diagnosis?.call_pro_if?.length > 0) {
    questions.push("Based on your inspection, do any of the following apply?");
    for (const c of diagnosis.call_pro_if) {
      questions.push(`  - ${c}`);
    }
  }

  // Standard closing questions
  questions.push("What is the expected timeline to complete this repair?");
  questions.push("Are there any underlying issues I should be aware of that could cause this to recur?");
  questions.push("Is this something that needs immediate attention, or can it safely wait?");

  for (const q of questions) {
    y = checkPageBreak(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 23, 47);
    const qLines = doc.splitTextToSize(`${q.startsWith("  -") ? q : "• " + q}`, CONTENT_W);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * 5 + 2;
  }

  // === SECTION 4: Safety Warnings ===
  if (diagnosis?.safety_warnings?.length > 0) {
    y += 8;
    y = checkPageBreak(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(232, 83, 10);
    doc.text("Safety Notes", MARGIN, y);

    y += 8;
    doc.setFontSize(10);
    for (const w of diagnosis.safety_warnings) {
      y = checkPageBreak(doc, y, 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(146, 64, 14);
      const wLines = doc.splitTextToSize(`⚠ ${w}`, CONTENT_W);
      doc.text(wLines, MARGIN, y);
      y += wLines.length * 5 + 2;
    }
  }

  // === Footer on every page ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom gradient bar
    drawGradientBar(doc, 0, 289, PAGE_W, 8);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 106, 122);
    doc.text("This report has been analysed by Ufixi", PAGE_W / 2, 285, { align: "center" });
    doc.text("ufixi.co.uk", PAGE_W / 2, 289, { align: "center" });
  }

  // Save
  const filename = `ufixi-report-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.pdf`;
  doc.save(filename);
}
