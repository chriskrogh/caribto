import { useQueryClient } from "@tanstack/react-query";
import throttle from "lodash/throttle";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

import { supabase } from "../supabase";

import { useAuthStore } from "./store";

export const useAuthSession = () => {
  const queryClient = useQueryClient();
  const { user, session, logIn, logOut } = useAuthStore();

  const handleSessionExpired = useCallback(() => {
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please sign in again.",
      [
        {
          text: "OK",
        },
      ],
      { cancelable: false }
    );
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    }
    logOut();
    setTimeout(() => {
      queryClient.clear();
    }, 0);
  }, [logOut, queryClient]);

  const throttledHandleLogout = useMemo(
    () => throttle(handleLogout, 2000),
    [handleLogout]
  );

  const checkSessionValidity = useCallback(async () => {
    if (!user || !session) {
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      const sessionInvalid =
        error ||
        !data.session ||
        (data.session.expires_at &&
          data.session.expires_at < Math.floor(Date.now() / 1000));

      if (sessionInvalid) {
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (!refreshError && refreshData?.session && refreshData?.user) {
          logIn(refreshData.user, refreshData.session);
          return;
        }

        handleSessionExpired();
        await throttledHandleLogout();
        return;
      }
    } catch (error) {
      console.error("Error checking session validity:", error);
    }
  }, [user, session, logIn, handleSessionExpired, throttledHandleLogout]);

  const throttledCheckSessionValidity = useMemo(
    () => throttle(checkSessionValidity, 2000),
    [checkSessionValidity]
  );

  return {
    checkSessionValidity: throttledCheckSessionValidity,
    handleLogout: throttledHandleLogout,
  };
};
