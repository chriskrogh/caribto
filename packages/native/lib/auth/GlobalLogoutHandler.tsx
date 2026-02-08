import { useEffect } from "react";

import { setGlobalLogoutHandler } from "./globalLogout";
import { useAuthSession } from "./useAuthSession";

/**
 * Component that sets up the global logout handler.
 * This should be mounted once at the top of the app tree.
 * It uses useAuthSession to get the logout handler and makes it available
 * globally so it can be accessed from non-React contexts (e.g., tRPC client).
 */
export const GlobalLogoutHandler: React.FC = () => {
  const { handleLogout } = useAuthSession();

  useEffect(() => {
    setGlobalLogoutHandler(handleLogout);
    return () => {
      setGlobalLogoutHandler(null);
    };
  }, [handleLogout]);

  return null;
};
