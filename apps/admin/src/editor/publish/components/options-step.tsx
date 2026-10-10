import { Button } from '@tryghost/shade/components';
import { Stack, Text } from '@tryghost/shade/primitives';
import { LucideIcon } from '@tryghost/shade/utils';
import { useState } from 'react';
import {
  publishContinue,
  publishFlowOptions,
  publishSettingPublishAt,
  publishSettingPublishType,
} from '@/editor/selectors';
import { PublishAtOptions } from './publish-at-options';
import { PublishSetting } from './publish-setting';
import { relativeTime } from '@/editor/publish/publish-copy';
import type { PublishOptionsState } from '@/editor/publish/publish-options';

type Section = 'publishAt';

export interface OptionsStepProps {
  state: PublishOptionsState;
  timezone: string;
  onToggleScheduled: (isScheduled: boolean) => void;
  onSetScheduledAt: (date: Date) => void;
  onContinue: () => void;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function OptionsStep({
  state,
  timezone,
  onToggleScheduled,
  onSetScheduledAt,
  onContinue,
}: OptionsStepProps) {
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

      <div>
        <Button
          data-testid={publishContinue}
          disabled={!state.canPublish}
          size="lg"
          onClick={onContinue}
        >
          Continue, final review &rarr;
        </Button>
      </div>
    </Stack>
  );
}
