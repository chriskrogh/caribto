import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { supabase } from "../supabase";

import { useAuthStore } from "./store";
import { useAuthSession } from "./useAuthSession";

export const AuthSessionMonitor: React.FC = () => {
  const { logIn } = useAuthStore();
  const { handleLogout, checkSessionValidity } = useAuthSession();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (AppState.currentState === "active") {
      void supabase.auth.startAutoRefresh();
    }

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        // Handle logout was triggered by the user
      } else if (event === "TOKEN_REFRESHED") {
        if (session) {
          logIn(session.user, session);
        } else {
          await handleLogout();
        }
      }
    });

    // Listen to app state changes
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          void supabase.auth.startAutoRefresh();
          if (appState.current.match(/inactive|background/)) {
            checkSessionValidity();
          }
        } else {
          void supabase.auth.stopAutoRefresh();
        }
        appState.current = nextAppState;
      }
    );

    // Listen to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected ?? false;
      if (isOnline) {
        checkSessionValidity();
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSubscription?.remove();
      unsubscribe();
    };
  }, [checkSessionValidity, handleLogout, logIn]);

  return null;
};
