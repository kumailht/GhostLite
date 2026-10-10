import { Button } from '@tryghost/shade/components';
import { Box, Inline, Stack, Text } from '@tryghost/shade/primitives';
import { PageHeader } from '@tryghost/shade/patterns';
import { formatNumber } from '@tryghost/shade/utils';
import { useState } from 'react';
import { publishFlowModal, publishFlowPreview, tkReminderDialog } from '@/editor/selectors';
import { FullscreenDialog } from '@/editor/fullscreen-dialog';
import { CompleteStep } from './components/complete-step';
import { ConfirmStep } from './components/confirm-step';
import { GateDialog } from './components/gate-dialog';
import { OptionsStep } from './components/options-step';
import { usePublishFlow } from './use-publish-flow';
import type { PublishDispatcher } from './publish-options';
import type { PublishFlowPost } from './flow-post';

export interface PublishFlowModalProps {
  post: PublishFlowPost;
  animate?: boolean;
  /** Disable when onCompleted navigates, keeping the pending step visible until it unmounts. */
  showCompletion?: boolean;
  /** The publish machine's clock, injected for tests. */
  now?: () => Date;
  timezone: string;
  siteTitle?: string;
  /** Gates the flow behind a reminder when the body still has TK markers. */
  tkCount?: number;
  /** The caller supplies the save engine's dispatch. */
  dispatch: PublishDispatcher;
  onBeforePublish?: () => Promise<void>;
  onClose: () => void;
  onPreview?: () => void;
  onRevertToDraft?: () => void;
  onCompleted?: (info: { postId: string; isScheduled: boolean }) => void;
}

export function PublishFlowModal({ post, ...props }: PublishFlowModalProps) {
  return <KeyedPublishFlowModal key={post.id} post={post} {...props} />;
}

/** A post change is a new journey; no gate, failure, or completion state carries across it. */
function KeyedPublishFlowModal({
  post,
  animate = true,
  showCompletion,
  now,
  timezone,
  siteTitle,
  tkCount = 0,
  dispatch,
  onBeforePublish,
  onClose,
  onPreview,
  onRevertToDraft,
  onCompleted,
}: PublishFlowModalProps) {
  const [gatesPassed, setGatesPassed] = useState(false);
  if (!gatesPassed && tkCount > 0) {
    return (
      <GateDialog
        testId={tkReminderDialog}
        title="Forget something?"
        onBack={onClose}
        onContinue={() => setGatesPassed(true)}
      >
        Looks like you’ve got some unfinished business. There {tkCount === 1 ? 'is' : 'are'}{' '}
        <strong>
          {formatNumber(tkCount)} TK {tkCount === 1 ? 'reminder' : 'reminders'}
        </strong>{' '}
        left in your post.
      </GateDialog>
    );
  }

  return (
    <PublishFlowDialog
      animate={animate}
      dispatch={dispatch}
      now={now}
      post={post}
      showCompletion={showCompletion}
      siteTitle={siteTitle}
      timezone={timezone}
      onBeforePublish={onBeforePublish}
      onClose={onClose}
      onCompleted={onCompleted}
      onPreview={onPreview}
      onRevertToDraft={onRevertToDraft}
    />
  );
}

type PublishFlowDialogProps = Omit<PublishFlowModalProps, 'tkCount'>;

function PublishFlowDialog({
  post,
  animate = true,
  showCompletion,
  now,
  timezone,
  siteTitle,
  dispatch,
  onBeforePublish,
  onClose,
  onPreview,
  onRevertToDraft,
  onCompleted,
}: PublishFlowDialogProps) {
  const flow = usePublishFlow({
    post,
    now,
    dispatch,
    showCompletion,
    onBeforePublish,
    onCompleted,
  });
  const { state, step } = flow;

  // While the publish request is in flight, closing would abandon its outcome
  // unseen: a publish that lands would never navigate and one that fails would
  // never say so. The request settles on its own, so close waits for it.
  const close = () => {
    if (flow.publishInFlight) {
      return;
    }
    flow.cancel();
    onClose();
  };

  return (
    <FullscreenDialog
      animate={animate}
      data-testid={publishFlowModal}
      title="Publish"
      open
      onOpenChange={(open) => !open && close()}
    >
      <Box className="relative min-h-full">
        <Inline className="absolute inset-x-0 top-0 p-4" justify="between">
          <Text aria-hidden="true" as="h2" className="text-lg tracking-tight" weight="semibold">
            Publish
          </Text>
          <PageHeader.ActionGroup>
            {step === 'complete' ? null : (
              <>
                <Button disabled={flow.publishInFlight} variant="ghost" onClick={close}>
                  Close
                </Button>
                {onPreview ? (
                  <Button
                    className="w-20 shrink-0"
                    data-testid={publishFlowPreview}
                    variant="outline"
                    onClick={onPreview}
                  >
                    Preview
                  </Button>
                ) : null}
              </>
            )}
          </PageHeader.ActionGroup>
        </Inline>

        <Stack className="mx-auto w-full max-w-156 px-6 pt-[max(9.6rem,18vh)] pb-16" gap="xl">
          {step === 'complete' ? (
            <CompleteStep
              captured={flow.captured}
              completedAt={flow.completedAt}
              post={post}
              postCount={flow.postCount}
              siteTitle={siteTitle}
              state={state}
              timezone={timezone}
              onRevertToDraft={onRevertToDraft}
            />
          ) : step === 'confirm' ? (
            <ConfirmStep
              failure={flow.failure}
              post={post}
              state={state}
              status={flow.confirmStatus}
              timezone={timezone}
              onBack={flow.toOptions}
              onConfirm={() => void flow.confirmPublish()}
            />
          ) : (
            <OptionsStep
              state={state}
              timezone={timezone}
              onContinue={flow.toConfirm}
              onSetScheduledAt={flow.setScheduledAt}
              onToggleScheduled={flow.setIsScheduled}
            />
          )}
        </Stack>
      </Box>
    </FullscreenDialog>
  );
}
