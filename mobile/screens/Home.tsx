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
} from "../data/appService";
import useAuth from "../hooks/useAuth";
import { useMemo } from "react";
import BillCard from "../components/BillCard";
import RepCard from "../components/RepCard";
import { ScrollView } from "dripsy";

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
  const activeIssues = useQuery({
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Home</Text>
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
        <Text>Reps to watch: </Text>
        {repsToWatch.isLoading && <Text>Loading...</Text>}
        {repsToWatch.data?.data.map((rep) => (
          <RepCard rep={rep} />
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
