import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BreakdownBill } from "../types/api";

interface Props {
  bill: BreakdownBill;
}

const BillCard = ({ bill }: Props) => {
  const { navigate } = useNavigation();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        // @ts-ignore
        navigate("Bill", {
          billId: bill.id,
        })
      }
    >
      <Text>{bill.title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    padding: 12,
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: 100,
    borderRadius: 5,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingLeft: 12,
  },
});

export default BillCard;
