import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import Text from "../components/Text";
import { GET_REP_BY_ID, getRepById } from "../data/appService";

const Representative = ({ navigation, route }) => {
  const {
    representative: { id },
  } = route.params;
  const { data, error, isLoading } = useQuery({
    queryKey: [GET_REP_BY_ID, id],
    queryFn: () => getRepById(id),
  });
  return (
    <View style={styles.container}>
      <Text>
        {data?.data?.firstName} {data?.data?.lastName}
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
