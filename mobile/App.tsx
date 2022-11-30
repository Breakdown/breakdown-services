import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Navigation } from "./navigation";

export default function App() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Navigation colorScheme={colorScheme} />
        <StatusBar />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
