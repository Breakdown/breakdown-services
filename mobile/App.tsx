import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Navigation } from "./navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function App() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Navigation colorScheme={colorScheme} />
            <StatusBar />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
      <Toast />
    </>
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
