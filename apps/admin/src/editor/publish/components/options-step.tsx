import { Banner, Button } from '@tryghost/shade/components';
import { Stack, Text } from '@tryghost/shade/primitives';
import { LucideIcon } from '@tryghost/shade/utils';
import { useState } from 'react';
import {
  publishContinue,
  publishFlowOptions,
  publishLimitsError,
  publishSettingPublishAt,
  publishSettingPublishType,
} from '@/editor/selectors';
import { PublishAtOptions } from './publish-at-options';
import { LimitMessage } from './limit-message';
import { PublishSetting, PublishSettingNote } from './publish-setting';
import { relativeTime } from '@/editor/publish/publish-copy';
import type { PublishOptionsState } from '@/editor/publish/publish-options';

type Section = 'publishAt';

export interface OptionsStepProps {
  state: PublishOptionsState;
  timezone: string;
  /** Review waits for the limit checks. */
  limitsChecked: boolean;
  /** A failed limit read keeps Continue disabled and offers a retry. */
  limitsFailure: string | null;
  onToggleScheduled: (isScheduled: boolean) => void;
  onSetScheduledAt: (date: Date) => void;
  onContinue: () => void;
  onRetryLimits: () => void;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function OptionsStep({
  state,
  timezone,
  limitsChecked,
  limitsFailure,
  onToggleScheduled,
  onSetScheduledAt,
  onContinue,
  onRetryLimits,
}: OptionsStepProps) {
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const toggle = (section: Section) => () =>
    setOpenSection((current) => (current === section ? null : section));

  const publishBlocked = state.publishBlock !== null;

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

      {limitsFailure ? (
        <Banner data-testid={publishLimitsError} role="alert" variant="destructive">
          <Stack align="start" gap="sm">
            <Text>{limitsFailure}</Text>
            <Button size="sm" variant="outline" onClick={onRetryLimits}>
              Try again
            </Button>
          </Stack>
        </Banner>
      ) : null}

      <Stack gap="none">
        <PublishSetting
          icon={<LucideIcon.Send className="size-4" />}
          testId={publishSettingPublishType}
          title="Publish on site"
          disabled
        />

        {state.publishBlock ? (
          <PublishSettingNote>
            <LimitMessage parts={state.publishBlock.parts} />
          </PublishSettingNote>
        ) : null}

        <PublishSetting
          disabled={publishBlocked}
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

      {publishBlocked ? null : (
        <div>
          <Button
            data-testid={publishContinue}
            disabled={!limitsChecked || !state.canPublish}
            size="lg"
            onClick={onContinue}
          >
            Continue, final review &rarr;
          </Button>
        </div>
      )}
    </Stack>
  );
}
