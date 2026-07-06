import { createFileRoute } from '@tanstack/react-router';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="July 5, 2026">
      <p>
        TomaAI (&quot;we&quot;, &quot;us&quot;) provides this Privacy Policy to explain how we collect, use, and protect your data within the Helix Empire mobile application and associated services.
      </p>

      <LegalSection title="Data Collection">
        <p>Helix Empire collects the following types of information:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account Information: Your email address and credentials used for synchronization via the Empire Network.</li>
          <li>In-Game Progress: High scores, levels reached, and virtual goods (skins) unlocked.</li>
          <li>Device Information: Unique identifiers and approximate location (derived from IP) used for analytics and advertising.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Usage of Data">
        <p>Your data is used to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Synchronize your ViralCoins and progress across the TomaAI Empire Network.</li>
          <li>Provide core gameplay features and reward milestones.</li>
          <li>Display relevant advertisements via Google AdMob.</li>
          <li>Analyze app performance and stability.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Third Party Sharing">
        <p>We share data with the following partners:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Supabase: For secure database storage and authentication.</li>
          <li>Google AdMob: For providing advertising services and managing rewarded videos.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>
          You have the right to access, correct, or delete your personal data. You may request account deletion at any time through our dedicated portal at helixempire.fun/account-deletion.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions? Contact support@helixempire.fun</p>
      </LegalSection>
    </LegalLayout>
  );
}
