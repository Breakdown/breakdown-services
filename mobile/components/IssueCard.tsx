import { TouchableOpacity } from "react-native";
import { Bill, Issue } from "../data/types";
import { Text } from "dripsy";
import { useNavigation } from "@react-navigation/native";

interface Props {
  issue: Issue;
}
const IssueCard = ({ issue }: Props) => {
  const navigation = useNavigation();
  const onPress = () => {
    navigation.navigate("Issue", { issueId: issue.id });
  };
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{issue.name}</Text>
    </TouchableOpacity>
  );
};

export default IssueCard;
