import { useQuery } from "@tanstack/react-query";
import { FlatList, StyleSheet, View } from "react-native";
import BillCard from "../components/BillCard";
import Text, { TextVariant } from "../components/Text";
import { getBills, QUERY_GET_BILLS } from "../data/queries";

const Home = ({ navigation }) => {
  const yourBillsQueryResult = useQuery({
    queryKey: [QUERY_GET_BILLS],
    queryFn: getBills,
  });

  const yourBills = yourBillsQueryResult.data?.data?.data;

  return (
    <View style={styles.container}>
      <View style={styles.yourBillsContainer}>
        <Text
          variant={TextVariant.SECTION_TITLE}
          style={styles.yourBillsHeader}
        >
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
    height: "30%",
    paddingHorizontal: 12,
  },
  yourBillsHeader: {
    marginVertical: 12,
  },
  listContainer: {
    width: "100%",
    paddingVertical: 12,
  },
});

export default Home;
