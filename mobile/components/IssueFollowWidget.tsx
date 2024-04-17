import { useMutation, useQuery } from "@tanstack/react-query";
import { Text } from "dripsy";
import { TouchableOpacity } from "react-native";
import {
  GET_FOLLOWING_ISSUES,
  GET_FOLLOWING_REPS,
  getFollowingIssues,
  getFollowingReps,
  setFollowingIssue,
  setFollowingRep,
} from "../data/appService";
import useAuth from "../hooks/useAuth";

interface Props {
  issueId: string;
}

const IssueFollowWidget = ({ issueId }: Props) => {
  const auth = useAuth();

  const followingIssues = useQuery({
    enabled: !!auth?.user?.id,
    queryKey: [GET_FOLLOWING_ISSUES, auth?.user?.id],
    queryFn: getFollowingIssues,
    refetchInterval: 1000 * 60 * 15, // 15 minutes
  });
  const followIssue = useMutation({
    mutationFn: setFollowingIssue,
    onSuccess: () => {
      followingIssues.refetch();
    },
  });

  const following = followingIssues.data?.data?.some((r) => r.id === issueId);

  const onPress = () => {
    followIssue.mutate({ id: issueId, following: !following });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{following ? "Unfollow" : "Follow"}</Text>
    </TouchableOpacity>
  );
};

export default IssueFollowWidget;
