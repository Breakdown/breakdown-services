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
    queryKey: [GET_YOUR_REPS_SPONSORED_BILLS],
    queryFn: getYourRepsSponsoredBills,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const activeIssues = useQuery({
    queryKey: [GET_FEATURED_ISSUES],
    queryFn: getFeaturedIssues,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const myVotes = useQuery({
    queryKey: [GET_MY_VOTES, auth.user?.id],
    queryFn: getMyVotes,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Home</Text>
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
