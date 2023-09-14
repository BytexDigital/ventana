export function mergeEventHandlers<T>(
  userEventHandler?: (event: T) => void,
  internalEventListener?: (event: T) => void,
  checkForDefaultPrevented = true,
) {
  return function handleEvent(event: T) {
    userEventHandler?.(event);
    if (!checkForDefaultPrevented || (checkForDefaultPrevented && !(event as unknown as Event).defaultPrevented)) {
      return internalEventListener?.(event);
    }
  };
}
