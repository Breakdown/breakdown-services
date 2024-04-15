import { TouchableOpacity } from "react-native";
import { Bill } from "../data/types";
import { Text } from "dripsy";
import { useNavigation } from "@react-navigation/native";

interface Props {
  bill: Bill;
}
const BillCard = ({ bill }: Props) => {
  const navigation = useNavigation();
  const onPress = () => {
    navigation.navigate("Bill", { billId: bill.id });
  };
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{bill.title}</Text>
    </TouchableOpacity>
  );
};

export default BillCard;
