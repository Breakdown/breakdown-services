import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, View } from "react-native";
import { QUERY_GET_YOUR_ISSUES, getYourIssues } from "../data/queries";
import useAuth from "../hooks/useAuth";
import IssueCard from "./IssueCard";
import { Issue } from "../types/api";
import { useNavigation } from "@react-navigation/native";

const YourIssues = () => {
  const { user } = useAuth();
  const issuesQuery = useQuery({
    queryKey: [QUERY_GET_YOUR_ISSUES, user?.id],
    queryFn: getYourIssues,
  });
  const navigation = useNavigation();

  // const renderIssueCard = ({ item }: { item: Issue }) => (
  //   <IssueCard
  //     issue={item}
  //     onChangeChecked={undefined}
  //     onPress={(issue) => {
  //       navigation.navigate("Issue", { issue });
  //     }}
  //   />
  // );
  return (
    <View style={styles.listContainer}>
      {issuesQuery.data?.map((issue) => (
        <IssueCard
          issue={issue}
          onChangeChecked={undefined}
          onPress={(issue) => {
            navigation.navigate("Issue", { issue });
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
});

export default YourIssues;
