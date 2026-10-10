import { Button } from '@tryghost/shade/components';
import { Inline, Stack, Text } from '@tryghost/shade/primitives';
import { LucideIcon, cn } from '@tryghost/shade/utils';
import { FailureBanner } from './failure-banner';
import {
  publishBackToSettings,
  publishConfirm,
  publishConfirmError,
  publishFlowConfirm,
} from '@/editor/selectors';
import {
  confirmButtonText,
  confirmRunningText,
  formatSiteDateTime,
} from '@/editor/publish/publish-copy';
import type { CompletionFailure } from '@/editor/publish/completion-message';
import type { ConfirmStatus } from '@/editor/publish/use-publish-flow';
import type { PublishFlowPost } from '@/editor/publish/flow-post';
import type { PublishOptionsState } from '@/editor/publish/publish-options';

export interface ConfirmStepProps {
  post: PublishFlowPost;
  state: PublishOptionsState;
  timezone: string;
  status: ConfirmStatus;
  failure: CompletionFailure | null;
  onConfirm: () => void;
  onBack: () => void;
}

// Eases the running state in as the button greys out. Use `fade-in-0`, not
// `fade-in`: Ember's ghost.css has its own `.fade-in` that leaves content at opacity 0.
const ENTER = 'animate-in fade-in-0 zoom-in-90 duration-200 ease-out motion-reduce:animate-none';

export function ConfirmStep({
  post,
  state,
  timezone,
  status,
  failure,
  onConfirm,
  onBack,
}: ConfirmStepProps) {
  const buttonText = {
    idle: confirmButtonText({
      isScheduled: state.isScheduled,
      scheduledAt: state.scheduledAt,
      displayName: post.displayName,
      timezone,
    }),
    running: confirmRunningText(state.isScheduled),
  };

  return (
    <Stack data-testid={publishFlowConfirm} gap="xl">
      <Stack gap="none">
        <Text
          as="h2"
          className="text-5xl leading-tighter tracking-tight text-state-success"
          weight="bold"
        >
          Ready, set, publish.
        </Text>
        <Text as="h2" className="text-5xl leading-tighter tracking-tight" weight="bold">
          Share it with the world.
        </Text>
      </Stack>

      <Text className="text-pretty" size="lg">
        {state.isScheduled ? (
          <>
            On <strong>{formatSiteDateTime(state.scheduledAt, timezone)}</strong> your
          </>
        ) : (
          'Your'
        )}{' '}
        {post.displayName} will be published on your site.
      </Text>

      {failure ? <FailureBanner failure={failure} testId={publishConfirmError} /> : null}

      <Inline gap="sm" justify="between" wrap>
        <Button
          data-testid={publishBackToSettings}
          disabled={status === 'running'}
          size="lg"
          variant="secondary"
          onClick={onBack}
        >
          <LucideIcon.ArrowLeft />
          Back to settings
        </Button>
        <Button
          className="ml-auto h-auto min-h-11 max-w-full bg-state-success py-2 whitespace-normal text-white hover:bg-state-success/90"
          data-testid={publishConfirm}
          disabled={status === 'running'}
          size="lg"
          onClick={onConfirm}
        >
          {status === 'running' ? (
            <>
              {/* size-4 matches the size Button gives its icons at this text size. */}
              <LucideIcon.LoaderCircle className={cn('size-4 animate-spin text-current', ENTER)} />
              <span className={ENTER}>{buttonText.running}</span>
            </>
          ) : (
            buttonText.idle
          )}
        </Button>
      </Inline>
    </Stack>
  );
}
