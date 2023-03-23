import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMe, QUERY_GET_ME } from "../data/queries";
import { User } from "../types/api";

interface UseAuthExport {
  authenticated: boolean;
  user?: User | null;
  refetch: () => void;
}

export default function useAuth({
  allowUnauth,
}: {
  allowUnauth?: boolean;
} = {}): UseAuthExport {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const sessionToken = await SecureStore.getItemAsync("session");
      setSessionToken(sessionToken);
    })();
  }, [authenticated]);

  const { data, error, refetch } = useQuery([QUERY_GET_ME], {
    queryFn: getMe,
    refetchInterval: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!sessionToken,
  });

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("session");
  }, []);

  useEffect(() => {
    if (data?.data) {
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

  return { user, authenticated, refetch };
}
