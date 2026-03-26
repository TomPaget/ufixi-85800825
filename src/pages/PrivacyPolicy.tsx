import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: 26 March 2026</p>

          <div className="prose prose-sm max-w-none space-y-8 text-foreground/85">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Who we are</h2>
              <p>Ufixi ("we", "us", "our") operates the Ufixi mobile application and website. We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. What data we collect</h2>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email address</li>
                <li>Full name (if provided)</li>
                <li>Profile photo (if uploaded)</li>
              </ul>
              <p className="mt-3">When you use the diagnostic scanner, we collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Images you upload for diagnosis</li>
                <li>Issue descriptions and categories</li>
                <li>Diagnostic results and recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. Anonymised data collection &amp; analytics</h2>
              <p className="font-medium">Important: We collect anonymised, non-personally-identifiable data from every diagnostic scan to improve our service and generate aggregated industry insights.</p>
              <p className="mt-2">This anonymised data includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Issue type and category (e.g. "plumbing", "leak")</li>
                <li>Urgency and severity ratings</li>
                <li>Estimated DIY and professional repair costs</li>
                <li>Truncated postcode area (e.g. "SW1" — never a full postcode)</li>
                <li>General region (e.g. "London")</li>
                <li>Property category (e.g. "residential")</li>
                <li>Trade type required</li>
                <li>Whether DIY repair is safe</li>
              </ul>
              <p className="mt-3">This data <strong>cannot</strong> be linked back to you. It contains no names, email addresses, full postcodes, or other identifying information.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. How we use anonymised data</h2>
              <p>We use aggregated anonymised data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Improve diagnostic accuracy and recommendations</li>
                <li>Understand common home repair trends across regions</li>
                <li>Generate industry reports and analytics that may be shared with or sold to third parties such as insurers, tradespeople networks, and property companies</li>
                <li>Publish research on home repair costs and trends</li>
              </ul>
              <p className="mt-3">These reports only ever contain aggregate statistics (e.g. "average plumbing repair cost in the Midlands") and never individual-level data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. How we protect your data</h2>
              <p>Your personal data is stored securely with encryption at rest and in transit. We use row-level security policies to ensure you can only access your own data. We never sell your personal data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Data retention</h2>
              <p>Personal data is retained while your account is active. Anonymised insights are retained indefinitely as they cannot be linked to any individual. You may delete your account and personal data at any time via the Settings page.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Your rights</h2>
              <p>Under UK GDPR you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Rectify inaccurate personal data</li>
                <li>Erase your personal data ("right to be forgotten")</li>
                <li>Restrict or object to processing</li>
                <li>Data portability</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@ufixi.app" className="text-primary underline">privacy@ufixi.app</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. Advertising</h2>
              <p>Free-tier users see advertisements served by Google AdMob (mobile app) and Google AdSense (website). These services may use device identifiers and cookies to serve relevant ads. You can opt out of personalised ads via your device settings:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>iOS: Settings → Privacy & Security → Tracking</li>
                <li>Android: Settings → Google → Ads → Opt out of Ads Personalisation</li>
              </ul>
              <p className="mt-2">Premium subscribers do not see advertisements.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
              <p>We use essential cookies for authentication and session management only. Third-party advertising cookies may be used by our ad providers (Google). See section 8 for opt-out instructions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Changes to this policy</h2>
              <p>We may update this policy from time to time. We will notify you of significant changes via email or in-app notification.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
              <p>For privacy-related enquiries, contact us at <a href="mailto:privacy@ufixi.app" className="text-primary underline">privacy@ufixi.app</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
