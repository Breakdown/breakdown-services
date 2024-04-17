import { Text, View } from "dripsy";
import { Representative } from "../data/types";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

interface Props {
  rep: Representative;
}

const RepCard = ({ rep }: Props) => {
  const navigation = useNavigation();
  const onPress = () => {
    navigation.navigate("Representative", { repId: rep.id });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Text>
        {rep.firstName} {rep.lastName}
      </Text>
      <Text>{rep.party}</Text>
      <Text>{rep.state}</Text>
    </TouchableOpacity>
  );
};

export default RepCard;
