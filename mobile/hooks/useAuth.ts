import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { getMe, QUERY_GET_ME } from "../data/queries";
import { User } from "../types/api";

interface UseAuthExport {
  authenticated: boolean;
  user?: User | null;
  refetch: () => void;
}

const logout = async () => {
  await SecureStore.deleteItemAsync("session");
};

export default function useAuth({
  allowUnauth,
}: {
  allowUnauth?: boolean;
} = {}): UseAuthExport {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const { data, error, refetch } = useQuery([QUERY_GET_ME], {
    enabled: !allowUnauth,
    queryFn: getMe,
    refetchInterval: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (data?.data) {
      setUser(data.data);
      setAuthenticated(true);
    } else {
      // TODO: Logout
      setUser(null);
      setAuthenticated(false);
      logout();
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setUser(null);
      setAuthenticated(false);
      logout();
    }
  }, [error]);

  return { user, authenticated, refetch };
}
