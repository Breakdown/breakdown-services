import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import { getBillById, QUERY_GET_BILL } from "../data/queries";

const Bill = ({ navigation, route }) => {
  const { billId } = route.params;
  const { data, error, isLoading } = useQuery({
    queryKey: [QUERY_GET_BILL, billId],
    queryFn: () => getBillById(billId),
  });
  return <View style={styles.container}>
    
  </View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default Bill;
