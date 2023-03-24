import { useQuery } from "@tanstack/react-query";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import BillCard from "../components/BillCard";
import Text, { TextVariant } from "../components/Text";
import {
  getBills,
  getYourReps,
  QUERY_GET_BILLS,
  QUERY_GET_YOUR_REPS,
} from "../data/queries";
import RepsCarousel from "../components/RepsCarousel";

const Home = ({ navigation }) => {
  const yourBillsQueryResult = useQuery({
    queryKey: [QUERY_GET_BILLS],
    queryFn: getBills,
  });
  const yourRepsQueryResult = useQuery({
    queryKey: [QUERY_GET_YOUR_REPS],
    queryFn: getYourReps,
  });

  const yourBills = yourBillsQueryResult.data?.data?.data;
  const yourReps = yourRepsQueryResult.data?.data?.data;

  console.log(yourReps);

  return (
    <View style={styles.container}>
      <View style={styles.yourBillsContainer}>
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          Bills For You
        </Text>
        <FlatList
          style={styles.listContainer}
          horizontal
          renderItem={({ item }) => {
            return <BillCard bill={item} />;
          }}
          data={yourBills}
          showsHorizontalScrollIndicator={false}
        />
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          Your Reps
        </Text>
        <RepsCarousel reps={yourReps} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  yourBillsContainer: {
    width: "100%",
    height: "100%",
  },
  sectionHeader: {
    marginVertical: 12,
    paddingLeft: 8,
  },
  listContainer: {
    paddingVertical: 12,
    maxHeight: Dimensions.get("window").height * 0.3 + 12,
  },
});

export default Home;
