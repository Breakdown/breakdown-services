import { FlatList, FlatListProps, StyleSheet, View } from "react-native";
import { BreakdownRep } from "../types/api";

const RepCarouselItem = ({ rep }) => {
  return <View></View>;
};

interface RepsCarouselProps extends Partial<FlatListProps<BreakdownRep>> {
  reps: BreakdownRep[];
}

const RepsCarousel = ({ reps, style, ...props }: RepsCarouselProps) => {
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
});

export default RepsCarousel;
