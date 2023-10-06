import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BreakdownIssue } from "../types/api";
import Text, { TextVariant } from "./Text";
import { DEM_GRADIENT } from "./BillCard";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";

const IssueCard = ({
  issue,
  onChangeChecked,
  onPress,
}: {
  issue: BreakdownIssue;
  onChangeChecked?: (checked: boolean) => void;
  onPress?: (issue: BreakdownIssue) => void;
}) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    onChangeChecked?.(checked);
  }, [checked]);
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.5}
      onPress={onPress ? () => onPress(issue) : () => setChecked(!checked)}
    >
      <LinearGradient
        style={styles.gradientContainer}
        colors={DEM_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.0, y: 1.0 }}
        locations={[0.0, 0.5, 1.0]}
      />
      <View style={styles.innerContainer}>
        {checked && (
          <View style={styles.checkContainer}>
            <Text variant={TextVariant.SUBHEADER} style={styles.issueText}>
              ✓
            </Text>
          </View>
        )}
        <Text variant={TextVariant.SUBHEADER} style={styles.issueText}>
          {issue.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: "relative",
    backgroundColor: "transparent",
    borderRadius: 12,
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  gradientContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
    opacity: 0.7,
  },
  innerContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  issueText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  checkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 24,
    height: 24,
    width: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#75D9B5",
  },
});

export default IssueCard;
