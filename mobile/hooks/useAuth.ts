import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { User } from "../data/types";
import { GET_ME, getMe } from "../data/appService";
import { useNavigation } from "@react-navigation/native";

interface UseAuthExport {
  authenticated: boolean;
  user?: User | null;
  refetch: () => void;
  logout: () => void;
}

export default function useAuth(
  {
    unauth,
  }: {
    unauth?: boolean;
  } = {
    unauth: false,
  }
): UseAuthExport {
  const [user, setUser] = useState<User | null>(null);

  const navigation = useNavigation();

  const { data, error, refetch, isLoading, isError } = useQuery({
    queryKey: [GET_ME, user?.id],
    queryFn: getMe,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const authenticated = !!data && !isError;

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("jwt");
    setUser(null);
  }, [refetch, setUser]);

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error && !isLoading) {
      setUser(null);
      // If error is Unauthorized, log out
      if (!unauth && error.message.includes("Unauthorized")) {
        logout();
      }
    }
  }, [error, unauth, logout, setUser]);

  // Navigate accordingly based on authed and page state
  useEffect(() => {
    if (unauth && authenticated && !isLoading) {
      navigation.navigate("Home");
    } else if (!unauth && !authenticated && !isLoading) {
      navigation.navigate("Welcome");
    }
  }, [unauth, authenticated, navigation, isLoading]);

  return { user, authenticated, refetch, logout };
}
