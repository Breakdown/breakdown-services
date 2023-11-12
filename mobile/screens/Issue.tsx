import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  getBillById,
  getIssueById,
  QUERY_GET_BILL,
  QUERY_GET_ISSUE,
} from "../data/queries";
import Text, { TextVariant } from "../components/Text";
import PageContainer from "../components/hoc/PageContainer";

const Issue = ({ navigation, route }) => {
  const {
    issue: { id },
  } = route.params;
  const { data, error, isLoading } = useQuery({
    queryKey: [QUERY_GET_ISSUE, id],
    queryFn: () => getIssueById(id),
  });

  return (
    <PageContainer>
      <View style={styles.container}>
        <Text variant={TextVariant.HEADER_LIGHT}>{data?.name}</Text>
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default Issue;
