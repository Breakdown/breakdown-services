import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { GET_BILL_BY_ID, getBillById } from "../data/appService";
import { RouteWithIdProps } from "./types";
import useAuth from "../hooks/useAuth";

export default function BillScreen({ route }: RouteWithIdProps) {
  useAuth();
  const { id } = route.params;

  const bill = useQuery({
    queryKey: [GET_BILL_BY_ID, id],
    enabled: !!id,
    queryFn: () => getBillById({ id }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  const loading = bill.isLoading;
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Bill</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  contentContainer: {
    width: "80%",
  },
});
