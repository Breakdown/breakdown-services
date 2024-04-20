import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, View } from "react-native";
import Text, { TextVariant } from "../components/Text";
import PageContainer from "../components/hoc/PageContainer";
import { GET_ISSUE_BY_ID, getIssueById } from "../data/appService";

const Issue = ({ navigation, route }) => {
  const {
    issue: { id },
  } = route.params;
  const { data, error, isLoading } = useQuery({
    queryKey: [GET_ISSUE_BY_ID, id],
    queryFn: () => getIssueById(id),
  });

  return (
    <PageContainer>
      <View style={styles.container}>
        <Text variant={TextVariant.HEADER_LIGHT}>{data?.data?.name}</Text>
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
