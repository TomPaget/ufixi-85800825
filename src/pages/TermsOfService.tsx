import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: 26 March 2026</p>

          <div className="prose prose-sm max-w-none space-y-8 text-foreground/85">
            <section>
              <h2 className="text-lg font-semibold text-foreground">1. Acceptance of terms</h2>
              <p>By accessing or using the Ufixi application ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
              <p>Ufixi provides AI-powered home repair diagnostics, cost estimates, and guidance. The Service is for informational purposes only and does not constitute professional building, plumbing, electrical, or other trade advice.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">3. User accounts</h2>
              <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. You must be at least 18 years old to use the Service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">4. Subscriptions &amp; auto-renewal</h2>
              <p>Ufixi offers a free tier and a Premium subscription. Premium is offered as an introductory price of <strong>£0.99 for the first month</strong>, then <strong>£1.99 per month</strong> thereafter, automatically renewing each month until cancelled. By subscribing to Premium:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Payment will be charged to your Apple ID, Google Play account, or chosen payment method at confirmation of purchase</li>
                <li>The introductory price of £0.99 applies only to the first monthly billing period for new subscribers; subsequent renewals are charged at the standard price of £1.99 per month</li>
                <li>Your subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current billing period</li>
                <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the then-current price (£1.99/month after the first month)</li>
                <li>The length of the subscription is one (1) month, renewing monthly</li>
                <li>You can manage your subscription and turn off auto-renewal at any time by going to your account settings in the App Store (iOS) or Google Play Store (Android) after purchase</li>
                <li>Any unused portion of a free trial period (if offered) will be forfeited when you purchase a subscription</li>
                <li>No refunds will be granted for any unused portion of a subscription period, except where required by applicable law</li>
              </ul>
              <p className="mt-3">For subscriptions purchased via the Apple App Store, the standard <a href="https://www.apple.com/legal/internet-services/itunes/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Apple Media Services Terms and Conditions</a> apply, and you must cancel through your Apple ID subscription settings. For Google Play purchases, Google's payment terms apply and you must cancel through Google Play's subscription management.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">5. Anonymised data &amp; analytics</h2>
              <p>By using the diagnostic features, you acknowledge and agree that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>We collect anonymised, non-identifiable metadata from each scan (issue type, category, truncated postcode area, cost estimates, severity)</li>
                <li>This anonymised data may be aggregated into industry reports</li>
                <li>These aggregated reports may be shared with or sold to third parties including insurers, property companies, and trade networks</li>
                <li>No personally identifiable information is ever included in these reports</li>
              </ul>
              <p className="mt-3">For full details, see our <a href="/privacy" className="text-primary underline">Privacy Policy</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">6. Disclaimer of warranties</h2>
              <p>The diagnostic results provided by Ufixi are generated by artificial intelligence and are for guidance only. We do not guarantee the accuracy, completeness, or suitability of any diagnosis or cost estimate. Always consult a qualified professional before undertaking repairs, especially those involving gas, electricity, or structural elements.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">7. Limitation of liability</h2>
              <p>To the maximum extent permitted by law, Ufixi shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to property damage, personal injury, or financial loss resulting from reliance on diagnostic results.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">8. User content</h2>
              <p>You retain ownership of images and content you upload. By uploading content, you grant us a limited licence to process it for diagnostic purposes. We do not share your personal images or issue details with third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">9. Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time via the Settings page.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">10. Third-party services</h2>
              <p>Ufixi uses third-party services including payment services, cloud infrastructure, and AI models. Your use of these services is subject to their respective terms and privacy policies. Ufixi displays advertisements via Google AdMob (mobile) and Google AdSense (web) to free-tier users. Ad personalisation is governed by Google's advertising policies.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">11. End User Licence Agreement (EULA)</h2>
              <p>This agreement serves as the End User Licence Agreement for the Ufixi application. By downloading, installing, or using Ufixi, you agree to these terms. The app is licensed, not sold, to you. We reserve all rights not expressly granted. You may not reverse engineer, decompile, or disassemble the app except as permitted by applicable law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">12. Governing law</h2>
              <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">13. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:legal@ufixi.app" className="text-primary underline">legal@ufixi.app</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
