import { FlatList, FlatListProps, StyleSheet, View } from "react-native";
import { BreakdownRep } from "../types/api";
import Text, { TextVariant } from "./Text";
import { BD_BLUE, BD_RED } from "../styles";

const RepCarouselItem = ({ rep }: { rep: BreakdownRep }) => {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.repPfp}>
        <Text>
          {rep.first_name.charAt(0)}
          {rep.last_name.charAt(0)}
        </Text>
      </View>
      <Text style={styles.repNameText}>
        {rep.first_name} {rep.last_name}
      </Text>
      <Text
        variant={TextVariant.SUBHEADER}
        style={{
          ...styles.repNameText,
          color: rep.party === "R" ? BD_RED : BD_BLUE,
        }}
      >
        {rep.party} {rep.state}-{rep.district}
      </Text>
    </View>
  );
};

interface RepsCarouselProps extends Partial<FlatListProps<BreakdownRep>> {
  reps: BreakdownRep[];
}

const RepsCarousel = ({ reps, style, ...props }: RepsCarouselProps) => {
  console.log("carousel", reps);
  return (
    <FlatList
      {...props}
      style={[styles.listContainer, style ?? {}]}
      horizontal
      renderItem={({ item }) => {
        return <RepCarouselItem rep={item} />;
      }}
      data={reps}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 12,
  },
  itemContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  repPfp: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: "#E5E5E5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  repNameText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    fontColor: "black",
  },
});

export default RepsCarousel;
