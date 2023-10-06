import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  getBillById,
  getRepById,
  QUERY_GET_BILL,
  QUERY_GET_REP,
} from "../data/queries";
import Text from "../components/Text";

const Representative = ({ navigation, route }) => {
  const {
    representative: { id },
  } = route.params;
  const { data, error, isLoading } = useQuery({
    queryKey: [QUERY_GET_REP, id],
    queryFn: () => getRepById(id),
  });
  return (
    <View style={styles.container}>
      <Text>
        {data?.first_name} {data?.last_name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default Representative;
