import { createFileRoute, Link } from '@tanstack/react-router';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';

export const Route = createFileRoute('/account-deletion')({
  component: AccountDeletionPage,
});

function AccountDeletionPage() {
  return (
    <LegalLayout title="Delete Your Account" updated="July 5, 2026">
      <p>
        You can permanently delete your Helix Empire account and all associated data in the TomaAI Network at any time.
      </p>

      <LegalSection title="Immediate Deletion">
        <p>To delete your account immediately:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open Helix Empire and go to the <strong>Skins</strong> menu.</li>
          <li>Tap <strong>Sign Out of Empire</strong>.</li>
          <li>Note: To fully purge data from the network, please use the deletion tool at <a href="https://viralsnap.online/account-deletion" className="text-primary">viralsnap.online/account-deletion</a> or contact us below.</li>
        </ol>
      </LegalSection>

      <LegalSection title="Request via Email">
        <p>
          Send an email from your registered address to <strong>support@helixempire.fun</strong> with the subject &quot;Account Deletion Request&quot;.
          TomaAI will process your request within 7 business days.
        </p>
      </LegalSection>

      <LegalSection title="What Data Is Removed?">
        <p>Upon deletion, we remove:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your unique User ID and Email.</li>
          <li>Your Helix Empire high scores and level progress.</li>
          <li>Your JumpPoints and unlocked premium skins.</li>
          <li>Your connection to the shared ViralCoins wallet.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Network Wide Impact">
        <p>
          Please be aware that since Helix Empire uses a unified TomaAI account, deleting your account will also remove your access to ViralSnap, AlgoRhythm, and other Empire apps.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
