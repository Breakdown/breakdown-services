import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { RouteWithIdProps } from "./types";
import {
  GET_REP_BY_ID,
  GET_REP_STATS_BY_ID,
  GET_REP_VOTES_BY_ID,
  getRepById,
  getRepStatsById,
  getRepVotesById,
} from "../data/appService";
import { useQuery } from "@tanstack/react-query";

export default function RepresentativeScreen({ route }: RouteWithIdProps) {
  const { id } = route.params;

  const rep = useQuery({
    queryKey: [GET_REP_BY_ID, id],
    enabled: !!id,
    queryFn: () => getRepById({ id }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  const repVotes = useQuery({
    queryKey: [GET_REP_VOTES_BY_ID, id],
    enabled: !!id,
    queryFn: () => getRepVotesById({ id }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  const repStats = useQuery({
    queryKey: [GET_REP_STATS_BY_ID, id],
    enabled: !!id,
    queryFn: () => getRepStatsById({ id }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Representative</Text>
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
