import { useCallback, useSyncExternalStore } from "react";
import { BehaviorSubject } from "rxjs";

export function useBehavior<T>(subject: BehaviorSubject<T>): T {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const subscription = subject.subscribe(onStoreChange);
      return () => subscription.unsubscribe();
    },
    [subject]
  );
  const getSnapshot = useCallback(() => subject.value, [subject]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
