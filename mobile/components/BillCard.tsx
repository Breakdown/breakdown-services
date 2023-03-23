import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BreakdownBill } from "../types/api";
import { Dimensions } from "react-native";
import {
  BD_BLUE,
  BD_LIGHT_BLUE,
  BD_PURPLE,
  BD_RED,
  titleText,
} from "../styles";
import { baseText, subtitleText } from "../styles/text";
import { getBillSummary, getBillTitle } from "../utils/bills";
interface Props {
  bill: BreakdownBill;
}

const getColorsForSponsorParty = (party: string) => {
  if (party === "D") {
    return [BD_BLUE, BD_PURPLE, BD_RED];
  } else if (party === "R") {
    return [BD_RED, BD_PURPLE, BD_BLUE];
  } else {
    return ["#000000", "#000000", "#000000"];
  }
};

const getMidpointFromNumCosponsors = (
  numD: number,
  numR: number,
  sponsorParty: string
) => {
  const total = numD + numR;
  if (total > 0) {
    if (sponsorParty === "D") {
      const dPercentage = numD / total;
      return dPercentage;
    } else if (sponsorParty === "R") {
      const rPercentage = numR / total;
      return rPercentage;
    }
  }

  return 0.5;
};

const BillCard = ({ bill }: Props) => {
  const { navigate } = useNavigation();
  const sponsorParty = bill.sponsor_party;

  const gradientColors = useMemo(() => {
    return getColorsForSponsorParty(sponsorParty);
  }, [sponsorParty]);

  const midpoint = useMemo(() => {
    return getMidpointFromNumCosponsors(
      bill.cosponsors_d,
      bill.cosponsors_r,
      bill.sponsor_party
    );
  }, [bill.cosponsors_d, bill.cosponsors_r]);

  return (
    <View style={styles.container}>
      <LinearGradient
        style={styles.gradientContainer}
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.0, y: 1.0 }}
        locations={[0.0, midpoint, 1.0]}
      />
      <View style={styles.innerContainer}>
        {/* TODO: Image */}
        {/* TODO: Likelihood to pass - this will probably require building a dataset manually */}
        <View style={styles.titleContainer}>
          <View style={styles.titleContainerBackground} />
          <Text style={styles.billTitle} numberOfLines={2}>
            {getBillTitle(bill)}
          </Text>
          <Text style={styles.billSummary} numberOfLines={3}>
            {getBillSummary(bill)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 12,
    opacity: 0.8,
  },
  container: {
    position: "relative",
    width: Dimensions.get("window").width * 0.6,
    height: Dimensions.get("window").height * 0.3,
    marginHorizontal: 8,
    backgroundColor: "transparent",
    borderRadius: 12,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  imageContainer: {
    width: "100%",
    height: 100,
    borderRadius: 5,
    flexDirection: "column",
    justifyContent: "flex-end",
    paddingLeft: 12,
  },
  innerContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    width: "100%",
  },
  titleContainer: {
    position: "relative",
    borderRadius: 12,
    width: "100%",
    padding: 16,
  },
  titleContainerBackground: {
    position: "absolute",
    backgroundColor: "#d3d3d3",
    borderRadius: 12,
    opacity: 0.4,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  billTitle: {
    ...subtitleText,
    marginBottom: 8,
  },
  billSummary: {
    ...baseText,
  },
});

export default BillCard;
