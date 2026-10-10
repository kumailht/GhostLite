import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@tryghost/admin-x-framework';
import { Button } from '@tryghost/shade/components';
import { useShade } from '@tryghost/shade/app';
import { PageHeader } from '@tryghost/shade/patterns';
import { Inline, Text } from '@tryghost/shade/primitives';
import { cn } from '@tryghost/shade/utils';
import { getSettingValue } from '@tryghost/admin-x-framework/api/settings';
import { isContributorUser, type User } from '@tryghost/admin-x-framework/api/users';
import {
  editorHeaderActions,
  editorPublishInputsError,
} from '@/editor/selectors';
import type { PostType } from './card-config';
import { PostPreviewModal, type PostPreviewModalProps } from './preview/post-preview-modal';
import { postPreviewUrl } from './preview/preview-url';
import { PublishFlowModal } from './publish/publish-flow-modal';
import { UpdateFlowModal } from './publish/update-flow-modal';
import type { PublishFlowPost } from './publish/flow-post';
import { CompletionFailureError, describeCompletionFailure } from './publish/completion-message';
import { usePublishInputs } from './publish/use-publish-inputs';
import { useEditorSettings } from './use-editor-settings';
import type { InvalidField } from './session/settings-fields';
import type { EditorSessionHandle } from './session/use-editor-session';
import type { SaveCompletion } from './engine/save-engine';
import {
  previewShortcutLabel,
  publishShortcutLabel,
  usePreviewShortcut,
  usePublishShortcut,
  useSaveShortcut,
} from './use-editor-shortcuts';
import { useSaveButtonPhase, useSaveFeedback, type SaveButtonPhase } from './use-save-feedback';
import { useSmallScreen } from './use-small-screen';

export type OpenFlow = 'none' | 'publish' | 'update';

/** The preview's props short of Publish, which only the publish controls can supply. */
type HeaderPreviewProps = Omit<PostPreviewModalProps, 'onPublish' | 'publishDisabled'>;

const UPDATE_LABELS: Record<SaveButtonPhase, string> = {
  idle: 'Update',
  running: 'Updating...',
  success: 'Updated',
  failure: 'Retry',
};

const SAVE_LABELS: Record<SaveButtonPhase, string> = {
  idle: 'Save',
  running: 'Saving',
  success: 'Saved',
  failure: 'Retry',
};

/**
 * Turns a save the caller depends on into a rejection the flow renders in place.
 * The failure travels whole, so a host limit's upgrade phrase stays a link.
 */
async function requireSaved(pending: Promise<SaveCompletion>): Promise<void> {
  const completion = await pending;

  if (completion.kind === 'dropped' && completion.reason === 'clean') {
    return;
  }

  const failure = describeCompletionFailure(completion);

  if (failure) {
    throw new CompletionFailureError(failure);
  }
}

/**
 * One header control. From the small breakpoint up it is a button in the header
 * row; below it, a button in the editor's bottom bar. Both come from the same
 * item, so they cannot drift apart.
 */
type HeaderItem =
  | {
      kind: 'action';
      id: string;
      label: string;
      onSelect: () => void;
      disabled?: boolean;
      /** Advertised in the header's tooltip; the bottom bar names no shortcuts. */
      shortcut?: string;
      /** The post's main action, Publish or Update, in the header's success colour. */
      emphasis?: boolean;
      /** Unpublish and Unschedule keep their quieter button. */
      quiet?: boolean;
      /** A contributor's Save keeps its plain button. */
      plain?: boolean;
    }
  | { kind: 'inputs-error'; id: string; message: string; onRetry: () => void };

const EMPHASIS_BUTTON =
  'font-semibold text-state-success hover:text-state-success disabled:text-text-secondary/60 disabled:opacity-100';

/**
 * The header's controls, in the header row, or, below the small breakpoint, in
 * the bottom bar the editor hands over. Only the controls move: the flows and
 * previews they open stay mounted where they are, so crossing the breakpoint
 * keeps an open flow and its choices.
 */
function HeaderItems({ items, bottomBar }: { items: HeaderItem[]; bottomBar: HTMLElement | null }) {
  const { isAdmin7 } = useShade();
  const atBottom = !!bottomBar;
  // The bar's rightmost action, Publish, Update or Save, is its primary button.
  const lastAction = items.map((item) => item.kind).lastIndexOf('action');
  const controls = items.map((item, index) => {
    if (item.kind === 'inputs-error') {
      return (
        <Fragment key={item.id}>
          <Text
            className="bg-background/80 text-destructive backdrop-blur-sm"
            data-testid={editorPublishInputsError}
            role="alert"
            size="sm"
          >
            {item.message}
          </Text>
          <Button
            className="bg-background/80 backdrop-blur-sm"
            size={isAdmin7 ? 'default' : 'sm'}
            variant="ghost"
            onClick={item.onRetry}
          >
            Retry
          </Button>
        </Fragment>
      );
    }
    if (item.plain || (atBottom && index === lastAction)) {
      return (
        <Button
          key={item.id}
          disabled={item.disabled}
          size={isAdmin7 ? 'default' : 'sm'}
          onClick={item.onSelect}
        >
          {item.label}
        </Button>
      );
    }
    return (
      <PageHeader.Action
        key={item.id}
        className={cn('bg-background/80 backdrop-blur-sm', item.emphasis && EMPHASIS_BUTTON)}
        disabled={item.disabled}
        fallbackSize="sm"
        fallbackVariant={item.quiet ? 'ghost' : undefined}
        label={item.label}
        shortcut={atBottom ? undefined : item.shortcut}
        onClick={item.onSelect}
      >
        {item.label}
      </PageHeader.Action>
    );
  });

  if (!bottomBar) {
    return <>{controls}</>;
  }
  return createPortal(
    <Inline className="min-w-0" data-testid={editorHeaderActions} gap="sm" justify="end" wrap>
      {controls}
    </Inline>,
    bottomBar,
  );
}

export interface EditorHeaderActionsProps {
  session: EditorSessionHandle;
  /** Built by the screen, which derives the status line's retry from it too. */
  post: PublishFlowPost;
  postType: PostType;
  currentUser?: User;
  siteUrl: string;
  /** Unresolved TK markers in the title, excerpt, body and feature image. */
  tkCount: number;
  /** Held by the screen, because the status line opens the publish flow too. */
  openFlow: OpenFlow;
  onOpenFlow: (flow: OpenFlow) => void;
  /** Takes the writer to the field an explicit save would refuse, and returns it. */
  revealInvalidField: () => InvalidField | null;
  /** The editor's bottom bar, which holds the controls below the small breakpoint. */
  bottomBar: HTMLElement | null;
}

/**
 * The editor header's publish and preview controls. Every write goes through
 * the session's engine; nothing here saves the post itself.
 */
export function EditorHeaderActions({
  session,
  post,
  postType,
  currentUser,
  siteUrl,
  tkCount,
  openFlow,
  onOpenFlow,
  revealInvalidField,
  bottomBar: bottomBarSlot,
}: EditorHeaderActionsProps) {
  const bottomBar = useSmallScreen() ? bottomBarSlot : null;
  const { persistedId } = session;
  const record = session.loadedRecord;
  const [previewOpen, setPreviewOpen] = useState(false);
  const feedback = useSaveFeedback({ session, displayName: postType, siteUrl });
  const contributorSave = useSaveButtonPhase(feedback.save, session.contentKey);

  useSaveShortcut(() => void feedback.save());

  // Core 301-redirects a published or sent post away from /p/:uuid/ and drops the
  // audience query, so Ember offers a preview only while the post is a draft.
  const isDraft = post.status === 'draft';

  // Preview, Publish, Unpublish, Unschedule and their shortcuts open nothing while
  // a field breaks its rule. Each is refused the way Cmd-S is: the save the writer
  // asked for names the rule in the status line, nothing is sent, and the writer
  // is taken to the field.
  const refuseInvalid = useCallback((): boolean => {
    const invalid = revealInvalidField();
    if (!invalid) {
      return false;
    }
    void session.saveExplicit();
    return true;
  }, [isDraft, revealInvalidField, session]);

  const openPreview = useCallback(() => {
    if (!refuseInvalid()) {
      setPreviewOpen(true);
    }
  }, [refuseInvalid]);

  usePreviewShortcut(
    useCallback(() => {
      if (previewOpen) {
        setPreviewOpen(false);
        onOpenFlow('none');
        return;
      }
      openPreview();
    }, [onOpenFlow, openPreview, previewOpen]),
    isDraft && persistedId !== null,
  );

  // Ember saves a dirty draft before previewing it and leaves every other post as it is.
  const saveBeforePreview = useCallback(async () => {
    if (session.publishTime.status !== 'draft' || !session.isDirty()) {
      return;
    }
    await requireSaved(session.saveExplicit());
  }, [session]);

  const isSaving =
    session.state.kind === 'preparing' ||
    session.state.kind === 'saving' ||
    session.state.kind === 'pending-coalesced';
  const isContributor = !!currentUser && isContributorUser(currentUser);

  // A post the server has never seen can be neither published nor previewed.
  if (!persistedId) {
    return null;
  }

  const preview: HeaderPreviewProps = {
    open: previewOpen,
    previewUrl: postPreviewUrl(siteUrl, record?.uuid),
    onBeforeOpen: saveBeforePreview,
    onOpenChange: setPreviewOpen,
  };

  const previewItem: HeaderItem | null = isDraft
    ? {
        kind: 'action',
        id: 'preview',
        label: 'Preview',
        shortcut: previewShortcutLabel(),
        onSelect: openPreview,
      }
    : null;

  return (
    // Below the small breakpoint the controls, and this name for them, are in the bottom bar.
    <Inline data-testid={bottomBar ? undefined : editorHeaderActions} gap="md" justify="end" wrap>
      {isContributor ? (
        <>
          <HeaderItems
            bottomBar={bottomBar}
            items={[
              ...(previewItem ? [previewItem] : []),
              {
                kind: 'action',
                id: 'save',
                label: SAVE_LABELS[contributorSave.phase],
                disabled: isSaving,
                plain: true,
                onSelect: () => void contributorSave.run(),
              },
            ]}
          />
          {isDraft ? <PostPreviewModal {...preview} /> : null}
        </>
      ) : (
        <PublishActions
          bottomBar={bottomBar}
          feedback={feedback}
          isDraft={isDraft}
          isSaving={isSaving}
          openFlow={openFlow}
          post={post}
          preview={preview}
          previewItem={previewItem}
          refuseInvalid={refuseInvalid}
          revealInvalidField={revealInvalidField}
          session={session}
          tkCount={tkCount}
          onOpenFlow={onOpenFlow}
          onPreview={openPreview}
        />
      )}
    </Inline>
  );
}

interface PublishActionsProps {
  session: EditorSessionHandle;
  bottomBar: HTMLElement | null;
  feedback: ReturnType<typeof useSaveFeedback>;
  post: PublishFlowPost;
  tkCount: number;
  isDraft: boolean;
  isSaving: boolean;
  openFlow: OpenFlow;
  preview: HeaderPreviewProps;
  /** The draft's Preview, which comes first. */
  previewItem: HeaderItem | null;
  /** Refuses the action while a field breaks its rule; true when it did. */
  refuseInvalid: () => boolean;
  revealInvalidField: () => InvalidField | null;
  onOpenFlow: (flow: OpenFlow) => void;
  onPreview: () => void;
}

/**
 * The publish controls, mounted only for roles that can publish: the publish
 * inputs read a member count contributors are not allowed to see.
 */
function PublishActions({
  session,
  bottomBar,
  feedback,
  post,
  tkCount,
  isDraft,
  isSaving,
  openFlow,
  preview,
  previewItem,
  refuseInvalid,
  revealInvalidField,
  onOpenFlow,
  onPreview,
}: PublishActionsProps) {
  const navigate = useNavigate();
  const inputs = usePublishInputs();
  const { data: settingsData } = useEditorSettings();
  const siteTitle = getSettingValue<string>(settingsData?.settings ?? null, 'title') ?? undefined;
  // A refetch of any input must not unmount an open flow, so readiness latches once.
  const [everReady, setEverReady] = useState(false);
  const [openedFromPreview, setOpenedFromPreview] = useState(false);

  if (inputs.isReady && !everReady) {
    setEverReady(true);
  }

  // The publish command carries the live post, so only unsaved work needs a save first.
  const saveBeforePublish = useCallback(async () => {
    if (!session.isDirty()) {
      return;
    }
    await requireSaved(session.saveExplicit());
  }, [session]);
  const { save, showReverted } = feedback;
  const update = useSaveButtonPhase(save, session.contentKey);
  const revertToDraft = useCallback(() => {
    onOpenFlow('none');
    void session.dispatchPublish({ kind: 'revert' });
  }, [onOpenFlow, session]);
  const closeFlow = useCallback(() => {
    setOpenedFromPreview(false);
    onOpenFlow('none');
  }, [onOpenFlow]);
  const { onOpenChange: setPreviewOpen } = preview;
  const openPublishFlow = useCallback(() => {
    if (refuseInvalid()) {
      return;
    }
    setOpenedFromPreview(false);
    onOpenFlow('publish');
  }, [onOpenFlow, refuseInvalid]);
  const openUpdateFlow = useCallback(() => {
    if (!refuseInvalid()) {
      onOpenFlow('update');
    }
  }, [onOpenFlow, refuseInvalid]);
  // The field and the status line are behind the preview, so a refusal from its
  // Publish waits for it to close and takes the focus it would hand back.
  const refuseOnPreviewClose = useRef(false);
  const previewCloseAutoFocus = useCallback(
    (event: Event) => {
      if (!refuseOnPreviewClose.current) {
        return;
      }
      refuseOnPreviewClose.current = false;
      event.preventDefault();
      refuseInvalid();
    },
    [refuseInvalid],
  );
  const changePreviewOpen = useCallback(
    (open: boolean) => {
      setPreviewOpen(open);
      if (!open) {
        closeFlow();
      }
    },
    [closeFlow, setPreviewOpen],
  );
  const publishFromPreview = useCallback(() => {
    const invalid = session.invalidField();
    // The field is behind the preview, so it is refused once the preview closes.
    if (invalid) {
      refuseOnPreviewClose.current = true;
      setPreviewOpen(false);
      return;
    }
    setOpenedFromPreview(true);
    setPreviewOpen(false);
    onOpenFlow('publish');
  }, [onOpenFlow, session, setPreviewOpen]);

  // The chord stays off while the preview is open: the preview's own Publish
  // button is the only way into the flow from there.
  usePublishShortcut(openPublishFlow, isDraft && inputs.isReady && !preview.open);

  const offersUpdateFlow = !isDraft;

  // Publish, Unpublish and Unschedule open nothing until these load.
  const inputsBlockActions = isDraft || offersUpdateFlow;

  // An input read that found the session gone asks for sign-in in place, as a save
  // does, and reads again once the writer is back. It asks once per failure: a
  // background read that fails the same way after the writer abandoned the sign-in,
  // or straight after they signed in, leaves the error and its Retry, which asks again.
  const { requestReauth } = session;
  const retryInputs = useRef(inputs.retry);
  retryInputs.current = inputs.retry;
  const inputsExpired = inputsBlockActions && inputs.sessionExpired;
  const askedForInputs = useRef(false);
  // A refetch clears the error while it runs, so only inputs that loaded end the failure.
  if (inputs.isReady) {
    askedForInputs.current = false;
  }
  useEffect(() => {
    if (!inputsExpired || askedForInputs.current) {
      return;
    }
    askedForInputs.current = true;
    void requestReauth().then((signedIn) => {
      if (signedIn) {
        retryInputs.current();
      }
    });
  }, [inputsExpired, requestReauth]);
  const { sessionExpired: inputsSessionExpired, retry: retryInputsNow } = inputs;
  const retryPublishInputs = useCallback(() => {
    if (!inputsSessionExpired) {
      retryInputsNow();
      return;
    }
    void requestReauth().then((signedIn) => {
      if (signedIn) {
        retryInputs.current();
      }
    });
  }, [inputsSessionExpired, requestReauth, retryInputsNow]);

  const inputsError: HeaderItem[] =
    inputsBlockActions && inputs.error
      ? [
          {
            kind: 'inputs-error',
            id: 'inputs-error',
            message: inputs.error.message,
            onRetry: retryPublishInputs,
          },
        ]
      : [];
  const unpublishLabel = post.status === 'scheduled' ? 'Unschedule' : 'Unpublish';
  const items: HeaderItem[] = isDraft
    ? [
        ...(previewItem ? [previewItem] : []),
        ...inputsError,
        {
          kind: 'action',
          id: 'publish',
          label: 'Publish',
          disabled: !inputs.isReady,
          emphasis: true,
          shortcut: publishShortcutLabel(),
          onSelect: openPublishFlow,
        },
      ]
    : [
        ...inputsError,
        ...(offersUpdateFlow
          ? [
              {
                kind: 'action',
                id: 'unpublish',
                label: unpublishLabel,
                // The update flow is built from the publish inputs; a click before
                // they load would open it unasked once they do.
                disabled: !inputs.isReady,
                quiet: true,
                onSelect: openUpdateFlow,
              } satisfies HeaderItem,
            ]
          : []),
        {
          kind: 'action',
          id: 'update',
          label: UPDATE_LABELS[update.phase],
          disabled: !session.isDirty() || isSaving,
          emphasis: true,
          onSelect: () => {
            // The save refuses an invalid field itself, naming it in the status
            // line; this only takes the writer to it.
            revealInvalidField();
            void update.run();
          },
        },
      ];

  return (
    <>
      <HeaderItems bottomBar={bottomBar} items={items} />
      {isDraft ? (
        <PostPreviewModal
          {...preview}
          animate={openFlow !== 'publish'}
          publishDisabled={!inputs.isReady}
          onCloseAutoFocus={previewCloseAutoFocus}
          onOpenChange={changePreviewOpen}
          onPublish={publishFromPreview}
        />
      ) : null}

      {openFlow === 'publish' && everReady ? (
        <PublishFlowModal
          animate={!openedFromPreview}
          dispatch={session.dispatchPublish}
          post={post}
          showCompletion={false}
          siteTitle={siteTitle}
          timezone={inputs.timezone}
          tkCount={tkCount}
          onBeforePublish={saveBeforePublish}
          onClose={closeFlow}
          onCompleted={() => {
            navigate(post.displayName === 'page' ? '/pages' : '/posts');
          }}
          onPreview={onPreview}
          onRevertToDraft={revertToDraft}
        />
      ) : null}

      {openFlow === 'update' && everReady ? (
        <UpdateFlowModal
          dispatch={session.dispatchPublish}
          post={post}
          timezone={inputs.timezone}
          onClose={closeFlow}
          onReverted={showReverted}
        />
      ) : null}
    </>
  );
}
