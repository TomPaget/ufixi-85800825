import { getTradeNameForCategory } from "./tradeNameMap";
import { buildTradesmanPdf, downloadPdf } from "./pdfDelivery";

/**
 * Backwards compatible wrapper. Generates the report and saves/downloads it
 * on whichever platform we are running on (native share sheet or browser
 * download).
 */
export async function generateTradesmanPdf(
  triage: any,
  diagnosis: any,
  imageUrl?: string | null,
) {
  const built = await buildTradesmanPdf(triage, diagnosis, imageUrl);
  await downloadPdf(built);
}

/**
 * Generates a pre written email body for premium users to send to their
 * trade professional. We avoid using long dashes anywhere in the copy.
 */
export function generateTradesmanEmail(
  triage: any,
  diagnosis: any,
): { subject: string; body: string } {
  const tradeName = getTradeNameForCategory(triage?.category);
  const title = triage?.issue_title || "a home issue";
  const description = triage?.brief_description || "";
  const urgency = diagnosis?.urgency_assessment?.level;
  const urgencyText =
    urgency === "fix_now"
      ? "quite urgent"
      : urgency === "fix_soon"
        ? "fairly important"
        : "not urgent but worth looking at";

  const causes = (diagnosis?.likely_causes || [])
    .slice(0, 2)
    .map((c: any) => c.cause)
    .join(" or ");

  const subject = `Could you take a look at a ${title.toLowerCase()}?`;

  const body = `Hi,

I have recently had an online diagnostic done on a problem at my property: ${title.toLowerCase()}. ${description ? description + " " : ""}

The diagnostic suggested it could be caused by ${causes || "a few possible things"}, and it is ${urgencyText}.

I would really appreciate a second opinion from a qualified ${tradeName.toLowerCase()}. Would you be able to come and take a look?

I have attached the full diagnostic report as a PDF for reference. Happy to share more details or photos if helpful. Let me know when you might be available.

Thanks!`;

  return { subject, body };
}
