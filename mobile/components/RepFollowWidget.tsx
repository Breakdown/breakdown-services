import { useMutation, useQuery } from "@tanstack/react-query";
import { Text } from "dripsy";
import { TouchableOpacity } from "react-native";
import {
  GET_FOLLOWING_REPS,
  getFollowingReps,
  setFollowingRep,
} from "../data/appService";
import useAuth from "../hooks/useAuth";
import { useMemo } from "react";

interface Props {
  repId: string;
}

const RepFollowWidget = ({ repId }: Props) => {
  const auth = useAuth();

  const followingReps = useQuery({
    enabled: !!auth?.user?.id,
    queryKey: [GET_FOLLOWING_REPS, auth?.user?.id],
    queryFn: getFollowingReps,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const followRep = useMutation({
    mutationFn: setFollowingRep,
    onSuccess: () => {
      followingReps.refetch();
    },
  });

  console.log("id", repId);
  console.log("following", followingReps);

  const following = followingReps.data?.data.some((r) => r.id === repId);

  const onPress = () => {
    followRep.mutate({ id: repId, following: !following });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{following ? "Unfollow" : "Follow"}</Text>
    </TouchableOpacity>
  );
};

export default RepFollowWidget;
