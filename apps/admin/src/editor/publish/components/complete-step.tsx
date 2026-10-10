import { Button } from '@tryghost/shade/components';
import { Inline, Stack, Text } from '@tryghost/shade/primitives';
import { formatNumber, LucideIcon } from '@tryghost/shade/utils';
import {
  publishBackToDashboard,
  publishFlowComplete,
  publishRevertToDraft,
} from '@/editor/selectors';
import { PostBookmark } from './post-bookmark';
import { formatScheduledCompletion } from '@/editor/publish/publish-copy';
import type { PublishFlowPost } from '@/editor/publish/flow-post';
import type { PublishFlow } from '@/editor/publish/use-publish-flow';
import type { PublishOptionsState } from '@/editor/publish/publish-options';

export interface CompleteStepProps {
  post: PublishFlowPost;
  state: PublishOptionsState;
  captured: PublishFlow['captured'];
  timezone: string;
  siteTitle?: string;
  /** Published-post total including this one; null for pages and schedules. */
  postCount: number | null;
  /** When the publish landed, standing in for the publish time the server stamped. */
  completedAt: string | null;
  onRevertToDraft?: () => void;
}

function RevertToDraft({ onRevertToDraft }: { onRevertToDraft?: () => void }) {
  if (!onRevertToDraft) {
    return null;
  }

  return (
    <Stack gap="md">
      <Text size="lg">Need to make a change?</Text>
      <Inline>
        <Button
          className="h-auto min-h-11 max-w-full px-5 py-2 whitespace-normal"
          data-testid={publishRevertToDraft}
          size="lg"
          variant="secondary"
          onClick={onRevertToDraft}
        >
          Unschedule and revert to draft &rarr;
        </Button>
      </Inline>
    </Stack>
  );
}

export function CompleteStep({
  post,
  state,
  captured,
  timezone,
  siteTitle,
  postCount,
  completedAt,
  onRevertToDraft,
}: CompleteStepProps) {
  // A schedule publishes at the chosen time; anything else just published.
  const publishedAt = captured.isScheduled
    ? state.scheduledAt
    : (completedAt ?? post.publishedAt ?? state.scheduledAt);

  return (
    <Stack data-testid={publishFlowComplete} gap="xl">
      <Text as="h2" className="text-5xl leading-tighter tracking-tight" weight="bold">
        {captured.isScheduled ? (
          <>
            <span className="block text-state-success">All set!</span> Your{' '}
            {post.displayName} will be published{' '}
            {formatScheduledCompletion(publishedAt, timezone)}.
          </>
        ) : (
          <>
            <span className="block text-state-success">Boom. It’s out there. </span>
            {post.displayName === 'post' && postCount ? (
              <>
                That’s {formatNumber(postCount)} {postCount === 1 ? 'post' : 'posts'} published,
                keep going!
              </>
            ) : (
              <>Your {post.displayName} has been published.</>
            )}
          </>
        )}
      </Text>

      <Stack gap="xl">
        <PostBookmark post={post} siteTitle={siteTitle} />
        {captured.isScheduled ? (
          <RevertToDraft onRevertToDraft={onRevertToDraft} />
        ) : (
          <Inline>
            <Button className="px-5" size="lg" variant="secondary" asChild>
              <a data-testid={publishBackToDashboard} href="#/posts">
                <LucideIcon.ArrowLeft />
                Back to posts
              </a>
            </Button>
          </Inline>
        )}
      </Stack>
    </Stack>
  );
}
