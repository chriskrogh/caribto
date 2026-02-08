/**
 * Global logout handler that can be accessed outside of React components.
 * This allows the tRPC client to trigger logout without breaking the rules of hooks.
 */

type LogoutHandler = () => Promise<void> | void;

let globalLogoutHandler: LogoutHandler | null = null;
let isLoggingOut = false;

/**
 * Sets the global logout handler. This should be called from a React component
 * where hooks can be used (e.g., from useAuthSession).
 */
export const setGlobalLogoutHandler = (handler: LogoutHandler | null) => {
  globalLogoutHandler = handler;
};

/**
 * Calls the global logout handler if it exists.
 * This can be safely called from non-React contexts.
 * Prevents multiple simultaneous logout attempts.
 */
export const triggerGlobalLogout = async (): Promise<void> => {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    return;
  }

  if (!globalLogoutHandler) {
    return;
  }

  isLoggingOut = true;
  try {
    await globalLogoutHandler();
  } finally {
    isLoggingOut = false;
  }
};
