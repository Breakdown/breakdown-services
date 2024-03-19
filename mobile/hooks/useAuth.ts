import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "../data/types";
import { GET_ME, getMe } from "../data/appService";

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

  const { data, error, refetch, isError } = useQuery([GET_ME], {
    queryFn: getMe,
    refetchInterval: authenticated ? 1000 * 60 * 15 : 30000, // 15 minutes or 30 sec
    refetchOnWindowFocus: false,
    retry: false,
  });

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("session");
    setAuthenticated(false);
    setUser(null);
    refetch();
  }, [setAuthenticated, refetch]);

  // useEffect(() => {
  //   logout();
  // }, [logout]);
  // useEffect(() => {
  //   if (isError) {
  //     logout();
  //   }
  // }, [isError, logout]);

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
