import type { ComponentProps } from 'react';
import { Banner } from '@tryghost/shade/components';
import { LucideIcon, cn } from '@tryghost/shade/utils';
import type { CompletionFailure } from '@/editor/publish/completion-message';

export function FailureMessage({ failure }: { failure: CompletionFailure }) {
  return <>{failure.message}</>;
}

/** An error's copy behind a warning icon, the icon level with its first line. */
export function ErrorLine({ children, className, ...props }: ComponentProps<'span'>) {
  return (
    <span className={cn('flex items-start gap-1.5', className)} {...props}>
      <span aria-hidden="true" className="flex h-[1lh] shrink-0 items-center">
        <LucideIcon.TriangleAlert className="size-4 text-destructive" />
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

/** A failure in place: an error, or a neutral note when nothing actually failed. */
export function FailureBanner({
  failure,
  testId,
  className,
}: {
  failure: CompletionFailure;
  testId?: string;
  className?: string;
}) {
  const info = failure.tone === 'info';

  return (
    <Banner
      className={className}
      data-testid={testId}
      role={info ? 'status' : 'alert'}
      variant={info ? 'info' : 'destructive'}
    >
      {info ? (
        <FailureMessage failure={failure} />
      ) : (
        <ErrorLine>
          <FailureMessage failure={failure} />
        </ErrorLine>
      )}
    </Banner>
  );
}
