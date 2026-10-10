import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LoadingIndicator,
} from '@tryghost/shade/components';
import { LucideIcon } from '@tryghost/shade/utils';
import { downloadSiteExport, type SiteExportComponent } from '@tryghost/admin-x-framework/api/exports';
import { useHandleError } from '@tryghost/admin-x-framework/hooks';

type ExportComponentKey = SiteExportComponent;

type ExportComponent = {
  key: ExportComponentKey;
  label: string;
  description: string;
  defaultChecked: boolean;
};

const EXPORT_COMPONENTS: ExportComponent[] = [
  {
    key: 'content',
    label: 'Content & settings',
    description: 'Posts, pages, tags, staff and settings',
    defaultChecked: true,
  },
  {
    key: 'uploads',
    label: 'Images & files',
    description: 'Everything you uploaded: images, video, audio and files',
    defaultChecked: true,
  },
  {
    key: 'themes',
    label: 'Themes',
    description: 'All installed themes, including custom code',
    defaultChecked: true,
  },
  {
    key: 'routes',
    label: 'Redirects & routes',
    description: 'routes.yaml and redirects configuration',
    defaultChecked: true,
  },
  {
    key: 'analytics',
    label: 'Posts spreadsheet',
    description: 'Every post with its details, as a CSV. Not used when importing',
    defaultChecked: false,
  },
];

type ExportPhase = 'select' | 'preparing' | 'done';

const ExportAllModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const handleError = useHandleError();
  const [phase, setPhase] = useState<ExportPhase>('select');
  const [selected, setSelected] = useState<Record<ExportComponentKey, boolean>>(() => {
    const initial = {} as Record<ExportComponentKey, boolean>;
    EXPORT_COMPONENTS.forEach((component) => {
      initial[component.key] = component.defaultChecked;
    });
    return initial;
  });
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  const noneSelected = EXPORT_COMPONENTS.every((component) => !selected[component.key]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next) {
      clearTimeout(resetTimerRef.current);
      setPhase('select');
      return;
    }
    abortRef.current?.abort();
    clearTimeout(resetTimerRef.current);
    // Reset for the next open, after the close animation
    resetTimerRef.current = setTimeout(() => setPhase('select'), 200);
  };

  const startExport = async () => {
    const components = EXPORT_COMPONENTS.filter((component) => selected[component.key]).map(
      (component) => component.key,
    );

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('preparing');

    try {
      await downloadSiteExport(components, { signal: controller.signal });
      // The functional updates guard against a stale transition after
      // the dialog was closed and reset meanwhile
      setPhase((current) => (current === 'preparing' ? 'done' : current));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      handleError(error);
      setPhase((current) => (current === 'preparing' ? 'select' : current));
    }
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(resetTimerRef.current);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        {phase === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>Export data</DialogTitle>
              <DialogDescription>
                Your export downloads as a single zip file. Import it on any GhostLite site to
                restore your posts, pages, uploads, settings and themes. Large sites can take a
                while.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1 py-1">
              {EXPORT_COMPONENTS.map((component) => (
                <label
                  key={component.key}
                  className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60"
                  htmlFor={`export-${component.key}`}
                >
                  <Checkbox
                    checked={selected[component.key]}
                    className="mt-0.5"
                    id={`export-${component.key}`}
                    onCheckedChange={(checked) =>
                      setSelected((current) => ({ ...current, [component.key]: checked === true }))
                    }
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{component.label}</span>
                    <span className="text-xs text-muted-foreground">{component.description}</span>
                  </span>
                </label>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={noneSelected} onClick={() => void startExport()}>
                <LucideIcon.Download /> Export
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === 'preparing' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LoadingIndicator size="sm" /> Preparing your export&hellip;
              </DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Your download will start automatically when it&rsquo;s ready. Keep this window open.
            </DialogDescription>
            <DialogFooter className="sm:justify-end">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LucideIcon.CircleCheck className="size-5 text-green-600" /> Export complete
              </DialogTitle>
            </DialogHeader>
            <DialogDescription>Your export has been downloaded as a zip file.</DialogDescription>
            <DialogFooter className="sm:justify-end">
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportAllModal;
