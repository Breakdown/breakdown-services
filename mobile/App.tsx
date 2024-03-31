import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Navigation } from "./navigation";
import { DripsyProvider } from "dripsy";
import dripsyTheme from "./utils/theme";
import { RootSiblingParent } from "react-native-root-siblings";

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });
  const colorScheme = useColorScheme();
  return (
    <RootSiblingParent>
      <QueryClientProvider client={queryClient}>
        <DripsyProvider theme={dripsyTheme}>
          <Navigation colorScheme={colorScheme} />
        </DripsyProvider>
      </QueryClientProvider>
    </RootSiblingParent>
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
