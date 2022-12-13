import { useQuery } from "@tanstack/react-query";
import { ListRenderItemInfo, StyleSheet, Text, View } from "react-native";
import BillCard from "../components/BillCard";
import List from "../components/hoc/List";
import { getBills, QUERY_GET_BILLS } from "../data/queries";
import { BreakdownBill } from "../types/api";

const Feed = ({ navigation }) => {
  // TODO: Swap this out for actual feed route
  const feedQueryResult = useQuery({
    queryKey: [QUERY_GET_BILLS],
    queryFn: getBills,
  });

  const renderBillCard = ({
    item,
    index,
  }: ListRenderItemInfo<BreakdownBill>) => {
    return <BillCard bill={item} key={index} />;
  };
  return (
    <View style={styles.container}>
      <List
        onRefresh={feedQueryResult.refetch}
        refreshing={feedQueryResult.isFetching}
        renderItem={renderBillCard}
        data={feedQueryResult.data?.data?.data}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default Feed;
