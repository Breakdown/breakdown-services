import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import {
  GET_FEATURED_REPS,
  GET_FEATURED_ISSUES,
  GET_UPCOMING_BILLS,
  GET_YOUR_REPS_SPONSORED_BILLS,
  getFeaturedReps,
  getUpcomingBills,
  getYourRepsSponsoredBills,
  getFeaturedIssues,
  GET_MY_VOTES,
  getMyVotes,
  GET_ISSUES,
  getIssues,
} from "../data/appService";
import useAuth from "../hooks/useAuth";
import { useMemo } from "react";
import BillCard from "../components/BillCard";
import RepCard from "../components/RepCard";
import { ScrollView } from "dripsy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IssueCard from "../components/IssueCard";

export default function HomeScreen() {
  const auth = useAuth();
  // TODO: Superheader bill
  const upcomingBills = useQuery({
    queryKey: [GET_UPCOMING_BILLS],
    queryFn: getUpcomingBills,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const repsToWatch = useQuery({
    queryKey: [GET_FEATURED_REPS],
    queryFn: getFeaturedReps,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const billsSponsoredByYourReps = useQuery({
    enabled: !!auth.user?.id,
    queryKey: [GET_YOUR_REPS_SPONSORED_BILLS, auth.user?.id],
    queryFn: getYourRepsSponsoredBills,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const featuredIssues = useQuery({
    queryKey: [GET_FEATURED_ISSUES],
    queryFn: getFeaturedIssues,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const myVotes = useQuery({
    enabled: !!auth.user?.id,
    queryKey: [GET_MY_VOTES, auth.user?.id],
    queryFn: getMyVotes,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  // For testing
  const allIssues = useQuery({
    queryKey: [GET_ISSUES],
    queryFn: getIssues,
  });

  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        ...styles.container,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Home</Text>
        {/* Bills */}
        {billsSponsoredByYourReps.isLoading && <Text>Loading...</Text>}
        {billsSponsoredByYourReps.data?.data.length ? (
          <Text>
            Bills sponsored by your reps:{" "}
            {billsSponsoredByYourReps.data.data.length}
          </Text>
        ) : null}
        {billsSponsoredByYourReps.data?.data?.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
        {/* Reps */}
        <Text>Reps to watch: </Text>
        {repsToWatch.isLoading && <Text>Loading...</Text>}
        {repsToWatch.data?.data?.slice(0, 3).map((rep) => (
          <RepCard rep={rep} key={rep.id} />
        ))}
        {/* Issues */}
        <Text>Issues: </Text>
        {allIssues.isLoading && <Text>Loading...</Text>}
        {allIssues.data?.data?.slice(0, 3).map((issue) => (
          <IssueCard issue={issue} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
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
