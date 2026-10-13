import { Button } from '@tryghost/shade/components';
import { Stack, Text } from '@tryghost/shade/primitives';
import { LucideIcon, cn } from '@tryghost/shade/utils';
import { useState } from 'react';
import {
  publishConfirm,
  publishConfirmError,
  publishFlowOptions,
  publishSettingPublishAt,
  publishSettingPublishType,
} from '@/editor/selectors';
import { FailureBanner } from './failure-banner';
import { PublishAtOptions } from './publish-at-options';
import { PublishSetting } from './publish-setting';
import {
  type PostDisplayName,
  confirmButtonText,
  confirmRunningText,
  relativeTime,
} from '@/editor/publish/publish-copy';
import type { CompletionFailure } from '@/editor/publish/completion-message';
import type { ConfirmStatus } from '@/editor/publish/use-publish-flow';
import type { PublishOptionsState } from '@/editor/publish/publish-options';

type Section = 'publishAt';

export interface OptionsStepProps {
  state: PublishOptionsState;
  displayName: PostDisplayName;
  timezone: string;
  status: ConfirmStatus;
  failure: CompletionFailure | null;
  onToggleScheduled: (isScheduled: boolean) => void;
  onSetScheduledAt: (date: Date) => void;
  onPublish: () => void;
}

// Eases the running state in as the button greys out. Use `fade-in-0`, not
// `fade-in`: Ember's ghost.css has its own `.fade-in` that leaves content at opacity 0.
const ENTER = 'animate-in fade-in-0 zoom-in-90 duration-200 ease-out motion-reduce:animate-none';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function OptionsStep({
  state,
  displayName,
  timezone,
  status,
  failure,
  onToggleScheduled,
  onSetScheduledAt,
  onPublish,
}: OptionsStepProps) {
  const running = status === 'running';
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const toggle = (section: Section) => () =>
    setOpenSection((current) => (current === section ? null : section));

  return (
    <Stack data-testid={publishFlowOptions} gap="xl">
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

      <Stack gap="none">
        <PublishSetting
          icon={<LucideIcon.Send className="size-4" />}
          testId={publishSettingPublishType}
          title="Publish on site"
          disabled
        />

        <PublishSetting
          icon={<LucideIcon.Clock className="size-4" />}
          open={openSection === 'publishAt'}
          testId={publishSettingPublishAt}
          title={state.isScheduled ? capitalize(relativeTime(state.scheduledAt)) : 'Right now'}
          onToggle={toggle('publishAt')}
        >
          <PublishAtOptions
            state={state}
            timezone={timezone}
            onSetScheduledAt={onSetScheduledAt}
            onToggleScheduled={onToggleScheduled}
          />
        </PublishSetting>
      </Stack>

      {failure ? <FailureBanner failure={failure} testId={publishConfirmError} /> : null}

      <div>
        <Button
          className="h-auto min-h-11 max-w-full bg-state-success py-2 whitespace-normal text-white hover:bg-state-success/90"
          data-testid={publishConfirm}
          disabled={!state.canPublish || running}
          size="lg"
          onClick={onPublish}
        >
          {running ? (
            <>
              {/* size-4 matches the size Button gives its icons at this text size. */}
              <LucideIcon.LoaderCircle className={cn('size-4 animate-spin text-current', ENTER)} />
              <span className={ENTER}>{confirmRunningText(state.isScheduled)}</span>
            </>
          ) : (
            confirmButtonText({
              isScheduled: state.isScheduled,
              scheduledAt: state.scheduledAt,
              displayName,
              timezone,
            })
          )}
        </Button>
      </div>
    </Stack>
  );
}
