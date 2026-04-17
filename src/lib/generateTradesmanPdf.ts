import { getTradeNameForCategory } from "./tradeNameMap";
import { buildTradesmanPdf, downloadPdf } from "./pdfDelivery";

function addPageBg(doc: any) {
  doc.setFillColor(253, 246, 238);
  doc.addPage();
  doc.rect(0, 0, PAGE_W, 297, "F");
}

function checkPageBreak(doc: any, y: number, needed: number): number {
  if (y + needed > 270) {
    addPageBg(doc);
    return 20;
  }
  return y;
}

function drawGradientBar(doc: any, x: number, y: number, w: number, h: number) {
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

async function urlToDataUrl(url: string): Promise<{ data: string; format: "JPEG" | "PNG" } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const isPng = blob.type.includes("png");
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { data: dataUrl, format: isPng ? "PNG" : "JPEG" };
  } catch (e) {
    console.warn("urlToDataUrl failed:", e);
    return null;
  }
}

export async function generateTradesmanPdf(
  triage: any,
  diagnosis: any,
  imageUrl?: string | null,
) {
  const built = await buildTradesmanPdf(triage, diagnosis, imageUrl);
  await downloadPdf(built);
}

  // Background
  doc.setFillColor(253, 246, 238);
  doc.rect(0, 0, PAGE_W, 297, "F");

  // Gradient header bar
  drawGradientBar(doc, 0, 0, PAGE_W, 8);

  // Title
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 23, 47);
  doc.text(`Issue Report for Your ${tradeName}`, MARGIN, y);

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

  // === Uploaded Image ===
  if (imageUrl) {
    const img = await urlToDataUrl(imageUrl);
    if (img) {
      y += 6;
      y = checkPageBreak(doc, y, 65);
      try {
        const imgW = CONTENT_W;
        const imgH = 60;
        doc.addImage(img.data, img.format, MARGIN, y, imgW, imgH);
        y += imgH + 4;
      } catch (e) {
        console.warn("Could not embed image in PDF:", e);
      }
    }
  }

  // === SECTION 1: Problem Summary ===
  y += 4;
  y = checkPageBreak(doc, y, 30);
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

  // === SECTION 3: Possible Questions to Ask ===
  y += 8;
  y = checkPageBreak(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 83, 10);
  doc.text(`Possible Questions to Ask Your ${tradeName}`, MARGIN, y);

  y += 8;
  doc.setFontSize(10);

  const questions: string[] = [];

  // Pick top 2 causes as questions (max)
  if (diagnosis?.likely_causes?.length > 0) {
    const topCauses = diagnosis.likely_causes.slice(0, 2);
    for (const cause of topCauses) {
      questions.push(`Could this be caused by ${cause.cause.toLowerCase()}? What would be the best course of action?`);
    }
  }

  // One question about recurrence
  questions.push("Are there any underlying issues that could cause this to happen again?");

  // One question about timeline
  questions.push("What is the expected timeline to complete this repair?");

  for (const q of questions) {
    y = checkPageBreak(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 23, 47);
    const qLines = doc.splitTextToSize(`• ${q}`, CONTENT_W);
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
    drawGradientBar(doc, 0, 289, PAGE_W, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 106, 122);
    doc.text("This report has been analysed by Ufixi", PAGE_W / 2, 285, { align: "center" });
    doc.text("ufixi.co.uk", PAGE_W / 2, 289, { align: "center" });
  }

  // Save — use Blob + manual anchor click for reliable download in iframes/preview contexts
  const filename = `ufixi-report-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.pdf`;

  // === Native (Capacitor) path: write to Documents & open with native viewer/share sheet ===
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const dataUriString: string = doc.output("datauristring");
      const base64 = dataUriString.split(",")[1];
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const written = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
      });
      try {
        const { Share } = await import("@capacitor/share");
        await Share.share({
          title: "Ufixi diagnosis report",
          url: written.uri,
          dialogTitle: "Save or share your report",
        });
      } catch (shareErr: any) {
        // User-cancelled share is fine — file is already saved to Documents
        if (!shareErr?.message?.toLowerCase?.().includes("cancel")) {
          console.warn("Native share after PDF write failed (file saved anyway):", shareErr);
        }
      }
      return;
    }
  } catch (nativeErr) {
    console.warn("Native PDF save failed, falling back to web download:", nativeErr);
  }

  // === Web path: blob URL + anchor click, with new-tab fallback ===
  try {
    const blob: Blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.target = "_blank";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Also try opening in a new tab as a fallback in case the iframe sandbox
    // silently blocked the download (e.g. inside the Lovable preview iframe).
    // The browser will not double-trigger the download.
    setTimeout(() => {
      try {
        // Only open new tab if we appear to be inside an iframe (likely sandboxed)
        if (window.self !== window.top) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } catch {}
    }, 250);
    setTimeout(() => {
      try { document.body.removeChild(a); } catch {}
      URL.revokeObjectURL(url);
    }, 5000);
  } catch (e) {
    console.warn("Blob download failed, falling back to doc.save():", e);
    doc.save(filename);
  }
}

/**
 * Generates a pre-made email body for premium users to send to their trade professional.
 */
export function generateTradesmanEmail(triage: any, diagnosis: any): { subject: string; body: string } {
  const tradeName = getTradeNameForCategory(triage?.category);
  const title = triage?.issue_title || "a home issue";
  const description = triage?.brief_description || "";
  const urgency = diagnosis?.urgency_assessment?.level;
  const urgencyText = urgency === "fix_now" ? "quite urgent" : urgency === "fix_soon" ? "fairly important" : "not urgent but worth looking at";

  const causes = (diagnosis?.likely_causes || [])
    .slice(0, 2)
    .map((c: any) => c.cause)
    .join(" or ");

  const subject = `Could you take a look at a ${title.toLowerCase()}?`;

  const body = `Hi,

I've recently had an online diagnostic done on a problem at my property — ${title.toLowerCase()}. ${description ? description + " " : ""}

The diagnostic suggested it could be caused by ${causes || "a few possible things"}, and it's ${urgencyText}.

I'd really appreciate a second opinion from a qualified ${tradeName.toLowerCase()} — would you be able to come and take a look?

Happy to share more details or photos if helpful. Let me know when you might be available.

Thanks!`;

  return { subject, body };
}
