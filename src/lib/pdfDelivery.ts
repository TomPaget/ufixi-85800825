import { getTradeNameForCategory } from "./tradeNameMap";

const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

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

function checkPageBreak(doc: any, y: number, needed: number): number {
  if (y + needed > 270) {
    doc.setFillColor(253, 246, 238);
    doc.addPage();
    doc.rect(0, 0, PAGE_W, 297, "F");
    return 20;
  }
  return y;
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

export interface BuiltPdf {
  blob: Blob;
  base64: string;
  filename: string;
  title: string;
  tradeName: string;
}

/**
 * Builds the tradesman report PDF in memory and returns the blob, base64
 * payload, suggested filename, and metadata. Does NOT download or share
 * anything. Callers decide what to do with it (download, share, attach).
 */
export async function buildTradesmanPdf(
  triage: any,
  diagnosis: any,
  imageUrl?: string | null,
): Promise<BuiltPdf> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const tradeName = getTradeNameForCategory(triage?.category);
  const title = triage?.issue_title || "Issue Detected";

  // Background
  doc.setFillColor(253, 246, 238);
  doc.rect(0, 0, PAGE_W, 297, "F");

  // Gradient header bar
  drawGradientBar(doc, 0, 0, PAGE_W, 8);

  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 23, 47);
  doc.text(`Issue Report for Your ${tradeName}`, MARGIN, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 106, 122);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    MARGIN,
    y,
  );

  y += 5;
  doc.setDrawColor(0, 23, 47);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  if (imageUrl) {
    const img = await urlToDataUrl(imageUrl);
    if (img) {
      y += 6;
      y = checkPageBreak(doc, y, 65);
      try {
        doc.addImage(img.data, img.format, MARGIN, y, CONTENT_W, 60);
        y += 64;
      } catch (e) {
        console.warn("Could not embed image in PDF:", e);
      }
    }
  }

  // Problem Summary
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
  doc.text(title, MARGIN, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 106, 122);
  const desc = triage?.brief_description || "";
  const descLines = doc.splitTextToSize(desc, CONTENT_W);
  doc.text(descLines, MARGIN, y);
  y += descLines.length * 5;

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

  // Possible Causes
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
      const causeLines = doc.splitTextToSize(`* ${cause.cause}`, CONTENT_W);
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

  // Questions to Ask
  y += 8;
  y = checkPageBreak(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(232, 83, 10);
  doc.text(`Possible Questions to Ask Your ${tradeName}`, MARGIN, y);

  y += 8;
  doc.setFontSize(10);

  const questions: string[] = [];
  if (diagnosis?.likely_causes?.length > 0) {
    const topCauses = diagnosis.likely_causes.slice(0, 2);
    for (const cause of topCauses) {
      questions.push(`Could this be caused by ${cause.cause.toLowerCase()}? What would be the best course of action?`);
    }
  }
  questions.push("Are there any underlying issues that could cause this to happen again?");
  questions.push("What is the expected timeline to complete this repair?");

  for (const q of questions) {
    y = checkPageBreak(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 23, 47);
    const qLines = doc.splitTextToSize(`* ${q}`, CONTENT_W);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * 5 + 2;
  }

  // Safety
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
      const wLines = doc.splitTextToSize(`! ${w}`, CONTENT_W);
      doc.text(wLines, MARGIN, y);
      y += wLines.length * 5 + 2;
    }
  }

  // Footer on every page
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

  // Build outputs in BOTH forms so callers can pick the best one for the platform.
  // arraybuffer is the most reliable on iOS WebView.
  const arrayBuf: ArrayBuffer = doc.output("arraybuffer");
  const blob = new Blob([arrayBuf], { type: "application/pdf" });

  // Convert to base64 (no data URI prefix)
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as any,
    );
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");

  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "report";
  const filename = `ufixi-report-${safeTitle}.pdf`;

  return { blob, base64, filename, title, tradeName };
}

/**
 * Saves the PDF to the user's device. On native (iOS/Android) we write to
 * Documents and open the share sheet so the user can save, AirDrop, email,
 * etc. On the web we trigger an anchor download.
 */
export async function downloadPdf(built: BuiltPdf): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const written = await Filesystem.writeFile({
        path: built.filename,
        data: built.base64,
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
        const msg = shareErr?.message?.toLowerCase?.() || "";
        if (!msg.includes("cancel")) {
          console.warn("Native share after PDF write failed (file is saved):", shareErr);
        }
      }
      return;
    }
  } catch (nativeErr) {
    console.warn("Native PDF save failed, falling back to web download:", nativeErr);
  }

  // Web: download. iOS Safari blocks anchor downloads of object URLs from
  // async handlers, so we open a same-tab data URL on iOS — the user can
  // then save it with the share sheet.
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIosSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);

  if (isIosSafari) {
    const dataUrl = `data:application/pdf;base64,${built.base64}`;
    window.location.href = dataUrl;
    return;
  }

  const url = URL.createObjectURL(built.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = built.filename;
  a.rel = "noopener";
  a.target = "_blank";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Some browsers (Firefox, older Safari) need a fallback if the click was
  // suppressed. Open the blob URL in a new tab so the user can save it.
  setTimeout(() => {
    try { document.body.removeChild(a); } catch {}
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch {}
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, 250);
}

/**
 * Shares the diagnosis report. On native, opens the OS share sheet with the
 * PDF file attached so the user can pick Mail, Messages, WhatsApp, AirDrop
 * etc. On web, downloads the PDF and uses the Web Share API or clipboard
 * for the message text.
 */
export async function sharePdf(built: BuiltPdf, message: string): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const written = await Filesystem.writeFile({
        path: built.filename,
        data: built.base64,
        directory: Directory.Cache,
      });
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: `Ufixi diagnosis: ${built.title}`,
        text: message,
        url: written.uri,
        dialogTitle: "Share diagnosis",
      });
      return;
    }
  } catch (e: any) {
    const msg = e?.message?.toLowerCase?.() || "";
    if (msg.includes("cancel")) return;
    console.warn("Native share with attachment failed:", e);
  }

  // Web: download the PDF AND try Web Share for the text
  await downloadPdf(built);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: `Ufixi diagnosis: ${built.title}`, text: message });
      return;
    }
  } catch (e: any) {
    if (e?.name === "AbortError") return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
    }
  } catch {}
}

/**
 * Emails the report to a tradesperson. On native we use the share sheet so
 * the user can pick the Mail app and the PDF is attached automatically. On
 * web we download the PDF and open the user's email client with the body
 * pre-filled (mailto cannot attach files, so the user manually attaches the
 * just-downloaded report).
 */
export async function emailPdfToTradesperson(
  built: BuiltPdf,
  subject: string,
  body: string,
): Promise<{ method: "native" | "web" }> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const written = await Filesystem.writeFile({
        path: built.filename,
        data: built.base64,
        directory: Directory.Cache,
      });
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: subject,
        text: body,
        url: written.uri,
        dialogTitle: `Send to your ${built.tradeName.toLowerCase()}`,
      });
      return { method: "native" };
    }
  } catch (e: any) {
    const msg = e?.message?.toLowerCase?.() || "";
    if (msg.includes("cancel")) return { method: "native" };
    console.warn("Native email share failed, falling back to web mailto:", e);
  }

  // Web: download report, then open mailto
  await downloadPdf(built);
  const enrichedBody = `${body}\n\n(I have attached the full diagnostic report as a PDF. If your mail client did not auto-attach it, please attach the file that just downloaded: ${built.filename})`;
  const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enrichedBody)}`;
  window.location.href = href;
  return { method: "web" };
}