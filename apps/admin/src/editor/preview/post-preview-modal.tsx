import { useEffect, useRef, useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyIndicator,
  LoadingIndicator,
  ToggleGroup,
  ToggleGroupItem,
} from '@tryghost/shade/components';
import { Inline } from '@tryghost/shade/primitives';
import { PageHeader } from '@tryghost/shade/patterns';
import { cn, LucideIcon } from '@tryghost/shade/utils';
import { toast } from 'sonner';

import { postPreviewModal, postPreviewSaveFailed } from '@/editor/selectors';
import { FullscreenDialog } from '@/editor/fullscreen-dialog';
import { describeRejectedAction } from '@/editor/publish/completion-message';
import { BrowserPreview } from './browser-preview';
import type { PreviewDevice } from './preview-url';

type PrepareState = 'preparing' | 'ready' | 'failed';

export interface PostPreviewModalProps {
  open: boolean;
  animate?: boolean;
  /** The post's public preview URL (`/p/:uuid/`), empty until the post has a uuid. */
  previewUrl: string;
  /**
   * Awaited before the preview renders, so the caller can save the draft first.
   * A rejection's message is shown to the writer as the reason it could not.
   */
  onBeforeOpen?: () => Promise<void>;
  /** Renders a Publish button; supplied for users who can publish. */
  onPublish?: () => void;
  /** Keeps the Publish button disabled while the caller cannot open its publish flow. */
  publishDisabled?: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called as the closed preview hands focus back; preventing it keeps focus where the caller puts it. */
  onCloseAutoFocus?: (event: Event) => void;
}

export function PostPreviewModal({
  open,
  animate = true,
  previewUrl,
  onBeforeOpen,
  onPublish,
  publishDisabled = false,
  onOpenChange,
  onCloseAutoFocus,
}: PostPreviewModalProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [prepareState, setPrepareState] = useState<PrepareState>(() =>
    onBeforeOpen && open ? 'preparing' : 'ready',
  );
  const [prepareFailure, setPrepareFailure] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  const beforeOpen = useRef(onBeforeOpen);
  const preparePromise = useRef<Promise<void> | null>(null);
  beforeOpen.current = onBeforeOpen;

  // Opening must not render a preview of the unsaved post, so the state moves
  // during render rather than in an effect that runs after that first commit.
  if (open !== wasOpen) {
    setWasOpen(open);
    preparePromise.current = null;
    setPrepareState(open && onBeforeOpen ? 'preparing' : 'ready');
  }

  useEffect(() => {
    if (!open || prepareState !== 'preparing') {
      return;
    }

    const prepare = beforeOpen.current;
    if (!prepare) {
      setPrepareState('ready');
      return;
    }

    const promise =
      preparePromise.current ?? (preparePromise.current = Promise.resolve().then(prepare));
    let cancelled = false;
    void promise.then(
      () => {
        if (!cancelled) {
          setPrepareState('ready');
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setPrepareFailure(describeRejectedAction(error).message);
          setPrepareState('failed');
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [open, prepareState]);

  const retryPreparation = () => {
    preparePromise.current = null;
    setPrepareState('preparing');
  };

  const previewActionsAvailable = prepareState === 'ready' && Boolean(previewUrl);

  const copyPreviewLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success('Preview link copied');
    } catch {
      toast.error('Could not copy the preview link');
    }
  };

  return (
    <FullscreenDialog
      animate={animate}
      aria-describedby={undefined}
      data-testid={postPreviewModal}
      headerActions={
        <PageHeader.ActionGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PageHeader.Action disabled={!previewActionsAvailable} label="Share" iconOnly>
                <LucideIcon.Share />
              </PageHeader.Action>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void copyPreviewLink()}>
                <LucideIcon.Link />
                Copy preview link
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={previewUrl} rel="noopener noreferrer" target="_blank">
                  <LucideIcon.ExternalLink />
                  Open in new tab
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onPublish ? (
            <Button className="w-20 shrink-0" disabled={publishDisabled} onClick={onPublish}>
              Publish
            </Button>
          ) : null}
        </PageHeader.ActionGroup>
      }
      headerControls={
        <Inline className="min-w-0" gap="md">
          <ToggleGroup
            className="hidden shrink-0 sidebar:flex"
            shape="pill"
            type="single"
            value={device}
            onValueChange={(value) => {
              if (value === 'desktop' || value === 'mobile') {
                setDevice(value);
              }
            }}
          >
            <ToggleGroupItem aria-label="Desktop" value="desktop">
              <LucideIcon.Laptop />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label="Mobile" value="mobile">
              <LucideIcon.Smartphone />
            </ToggleGroupItem>
          </ToggleGroup>
        </Inline>
      }
      layout="header"
      open={open}
      title="Preview"
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenChange={onOpenChange}
    >
      <Inline
        align="start"
        className={cn(
          'min-h-0 overflow-auto',
          device === 'mobile' ? 'bg-muted p-6' : 'bg-surface-panel',
        )}
        gap="none"
        justify="center"
      >
        {prepareState === 'preparing' ? (
          <Inline
            align="center"
            aria-label="Preparing preview"
            className="grow self-center"
            gap="none"
            justify="center"
            role="status"
          >
            <LoadingIndicator size="lg" />
          </Inline>
        ) : prepareState === 'failed' ? (
          <EmptyIndicator
            actions={
              <Button className="self-center" variant="outline" onClick={retryPreparation}>
                Retry
              </Button>
            }
            className="grow justify-center self-center"
            data-testid={postPreviewSaveFailed}
            description={<span role="alert">{prepareFailure}</span>}
            title="Couldn’t preview this post"
          >
            <LucideIcon.TriangleAlert />
          </EmptyIndicator>
        ) : (
          <BrowserPreview
            device={device}
            previewUrl={previewUrl}
            onEscape={() => onOpenChange(false)}
          />
        )}
      </Inline>
    </FullscreenDialog>
  );
}
