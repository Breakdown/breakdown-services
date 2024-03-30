import {
  FlatList,
  FlatListProps,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Text, { TextVariant } from "./Text";
import { BD_BLUE, BD_RED } from "../styles";
import { useNavigation } from "@react-navigation/native";
import { Representative } from "../data/types";

const RepCarouselItem = ({ rep }: { rep: Representative }) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        navigation.navigate("Representative", { representative: rep });
      }}
    >
      <View style={styles.repPfp}>
        <Text>
          {rep.firstName.charAt(0)}
          {rep.lastName.charAt(0)}
        </Text>
      </View>
      <Text style={styles.repNameText}>
        {rep.firstName} {rep.lastName}
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
    </TouchableOpacity>
  );
};

interface RepsCarouselProps extends Partial<FlatListProps<Representative>> {
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
  },
});

export default RepsCarousel;
