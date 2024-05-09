import { useQuery } from "@tanstack/react-query";
import { Text, View } from "dripsy";
import {
  GET_REP_VOTE_MATCH_PERCENT,
  getRepVotesMatchPercent,
} from "../data/appService";
import useAuth from "../hooks/useAuth";

const VoteMatchPercentage = ({ repId }: { repId: string }) => {
  const auth = useAuth();
  const matchPercentageQuery = useQuery({
    queryKey: [GET_REP_VOTE_MATCH_PERCENT, repId, auth.user?.id],
    enabled: !!repId && !!auth.user?.id,
    queryFn: () => getRepVotesMatchPercent({ repId }),
  });
  const matchPct = matchPercentageQuery?.data?.data.matchPercentage;
  return (
    <View>
      <Text>Vote Match Percentage</Text>
      {matchPercentageQuery.isLoading && <Text>Loading...</Text>}
      {matchPct && <Text>{matchPct === undefined ? "N/A" : matchPct}%</Text>}
    </View>
  );
};

export default VoteMatchPercentage;
