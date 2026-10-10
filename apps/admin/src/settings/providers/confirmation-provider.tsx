import React, { useCallback, useRef, useState } from 'react';
import { type ConfirmationHandle, ConfirmationContext } from './confirmation-context';
import {
  type ConfirmationModalProps,
  ConfirmationModalContent,
} from '@/settings/components/confirmation-modal';

type ConfirmationRequest = { id: number; props: ConfirmationModalProps };

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<ConfirmationRequest[]>([]);
  const nextId = useRef(0);

  const confirm = useCallback((props: ConfirmationModalProps): ConfirmationHandle => {
    nextId.current += 1;
    const id = nextId.current;
    // One request at a time: a second confirm replaces the first instead of
    // stacking (StrictMode double-effects depend on this).
    setRequests([{ id, props }]);
    return { remove: () => setRequests((current) => current.filter((r) => r.id !== id)) };
  }, []);

  const contextValue = React.useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      {requests.map((request) => {
        const remove = () => setRequests((current) => current.filter((r) => r.id !== request.id));
        return <ConfirmationModalContent key={request.id} {...request.props} onRemove={remove} />;
      })}
    </ConfirmationContext.Provider>
  );
};
