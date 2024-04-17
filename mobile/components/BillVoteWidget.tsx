import { useMutation, useQuery } from "@tanstack/react-query";
import { UserBillVote } from "../data/types";
import {
  GET_MY_VOTE_ON_BILL,
  getMyVoteOnBill,
  voteOnBill,
} from "../data/appService";
import useAuth from "../hooks/useAuth";
import { Text, View } from "dripsy";
import { TouchableOpacity } from "react-native";

interface Props {
  billId: string;
}

const BillVoteWidget = ({ billId }: Props) => {
  const auth = useAuth();
  const { data, refetch } = useQuery({
    enabled: !!auth.user?.id,
    queryKey: [GET_MY_VOTE_ON_BILL, billId, auth.user?.id],
    queryFn: () => getMyVoteOnBill({ billId }),
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });

  const voteMutation = useMutation({
    mutationFn: voteOnBill,
    onSuccess: () => {
      refetch();
    },
  });

  const vote = async (position: boolean) => {
    await voteMutation.mutateAsync({ billId, position });
  };

  const existingPosition = data?.data?.position;

  return (
    <View>
      <Text>Vote</Text>
      {existingPosition !== undefined ? (
        <Text>Existing Vote: {data?.data?.position ? "Yes" : "No"}</Text>
      ) : null}
      <TouchableOpacity onPress={() => vote(true)}>
        <Text>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => vote(false)}>
        <Text>No</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BillVoteWidget;
