'use client';

import SettingsFrame from '../SettingsFrame';
import { SettingsNavRow } from '../SettingsNavRow';

export default function FeedbackHubClient() {
  return (
    <SettingsFrame
      title="Feedback"
      subtitle="Tell us what broke or how StoreLink could be better. Screenshots help a lot."
      parentHref="/app/settings"
    >
      <div className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
        <SettingsNavRow
          href="/app/settings/feedback/submit?type=issue"
          label="Report a technical issue"
          caption="Bugs, crashes, screens that won’t load, or something that looks wrong."
        />
        <SettingsNavRow
          href="/app/settings/feedback/submit?type=suggestion"
          label="Help us improve"
          caption="Ideas and suggestions to make StoreLink clearer, faster, or more useful."
        />
      </div>
    </SettingsFrame>
  );
}
