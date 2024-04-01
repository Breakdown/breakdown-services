import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { RouteWithIdProps } from "./types";
import { useQuery } from "@tanstack/react-query";
import { GET_ISSUE_BY_ID, getIssueById } from "../data/appService";
import useAuth from "../hooks/useAuth";
import { IssueScreenProps } from "../navigation/types";

export default function IssueScreen({ route }: IssueScreenProps) {
  useAuth();
  const { issueId } = route.params;

  const issue = useQuery({
    queryKey: [GET_ISSUE_BY_ID, issueId],
    enabled: !!issueId,
    queryFn: () => getIssueById({ id: issueId }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  const loading = issue.isLoading;
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Issue</Text>
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
