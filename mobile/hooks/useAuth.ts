import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { User } from "../data/types";
import AppService, { GET_ME } from "../data/appService";

interface UseAuthExport {
  authenticated: boolean;
  user?: User | null;
  refetch: () => void;
  logout: () => void;
}

export default function useAuth({
  allowUnauth,
}: {
  allowUnauth?: boolean;
} = {}): UseAuthExport {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [appService] = useState(() => new AppService());

  useEffect(() => {
    (async () => {
      const sessionToken = await SecureStore.getItemAsync("session");
      setSessionToken(sessionToken);
    })();
  }, [authenticated]);

  const { data, error, refetch } = useQuery([GET_ME], {
    queryFn: appService.getMe,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!sessionToken,
  });

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("session");
    setAuthenticated(false);
    refetch();
  }, [setAuthenticated, refetch]);

  // Obviously remove - this is for manually logging out
  // Until the functionality is built into the app
  // logout();
  useEffect(() => {
    if (data) {
      setUser(data.data);
      setAuthenticated(true);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setUser(null);
      setAuthenticated(false);
      if (!allowUnauth) {
        logout();
      }
    }
  }, [error, allowUnauth]);

  return { user, authenticated, refetch, logout };
}
