import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { getBillById, QUERY_GET_BILL } from "../data/queries";
import Text, { TextVariant } from "../components/Text";
import PageContainer from "../components/hoc/PageContainer";
import VoteOnBill from "../components/VoteOnBill";

const Bill = ({ navigation, route }) => {
  const {
    bill: { id },
  } = route.params;

  const { data, error, isLoading } = useQuery({
    queryKey: [QUERY_GET_BILL, id],
    queryFn: () => getBillById(id),
  });

  return (
    <PageContainer>
      <View style={styles.container}>
        <Text variant={TextVariant.SECTION_TITLE}>{data?.title}</Text>
        <VoteOnBill id={id} />
      </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});

export default Bill;
