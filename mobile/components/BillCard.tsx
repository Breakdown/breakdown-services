import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { BreakdownBill } from "../types/api";
interface Props {
  bill: BreakdownBill;
}

const getColorsForSponsorParty = (party: string) => {
  if (party === "D") {
    return ["#4c669f", "#3b5998", "#192f6a"];
  } else if (party === "R") {
    return ["#ff0000", "#cc0000", "#990000"];
  } else {
    return ["#000000", "#000000", "#000000"];
  }
};

const BillCard = ({ bill }: Props) => {
  const { navigate } = useNavigation();
  const sponsorParty = bill.sponsor_party;

  const gradientColors = useMemo(() => {
    return getColorsForSponsorParty(sponsorParty);
  }, [sponsorParty]);
  return (
    <LinearGradient
      style={[
        styles.container,
        sponsorParty &&
          (sponsorParty === "D" ? styles.dSponsor : styles.rSponsor),
      ]}
      // onPress={() =>
      //   // @ts-ignore
      //   navigate("Bill", {
      //     billId: bill.id,
      //   })
      // }
      colors={gradientColors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 0.9 }}
      locations={[0.0, 0.5, 1.0]}
    >
      <Text>{bill.title}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    padding: 12,
    alignItems: "center",
    width: 200,
    marginHorizontal: 8,
    backgroundColor: "transparent",
    borderRadius: 8,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  gradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    width: "100%",
    height: 100,
    borderRadius: 5,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingLeft: 12,
  },
  dSponsor: {},
  rSponsor: {},
});

export default BillCard;
