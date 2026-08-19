import { createFileRoute } from '@tanstack/react-router';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';

export const Route = createFileRoute('/account-deletion')({
  component: AccountDeletionPage,
});

function AccountDeletionPage() {
  return (
    <LegalLayout title="Delete Your Account" updated="August 2026">
      <p>
        You can permanently delete your Helix Empire account and associated data at any time.
      </p>

      <LegalSection title="Delete in the app">
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open Helix Empire and sign in.</li>
          <li>Go to the <strong>WIN</strong> tab (Challenges).</li>
          <li>Tap <strong>Delete Account</strong> and confirm.</li>
        </ol>
      </LegalSection>

      <LegalSection title="Request via email">
        <p>
          Email <a href="mailto:tomaaihelp@gmail.com" className="text-primary">tomaaihelp@gmail.com</a> from your registered address with the subject &quot;Helix Empire Account Deletion&quot;.
        </p>
      </LegalSection>

      <LegalSection title="What data is removed?">
        <ul className="list-disc pl-6 space-y-1">
          <li>Your profile, username, and email association</li>
          <li>Stage progress, JumpPoints, and ViralCoins</li>
          <li>Unlocked skins and challenge participation</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
