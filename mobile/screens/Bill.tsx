import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { getBillById, QUERY_GET_BILL } from "../data/queries";
import Text, { TextVariant } from "../components/Text";
import PageContainer from "../components/hoc/PageContainer";
import VoteOnBill from "../components/VoteOnBill";
import { BreakdownBill } from "../types/api";

export const getBillSummary = (bill: BreakdownBill) => {
  if (bill?.human_summary) {
    return bill.human_summary;
  }
  return bill?.summary;
};

export const getBillShortSummary = (bill: BreakdownBill) => {
  if (bill?.human_short_summary) {
    return bill.human_short_summary;
  }
  if (bill?.summary_short) {
    return bill.summary_short;
  }
  if (bill?.summary) {
    return bill.summary.slice(0, 100) + "...";
  }
  return undefined;
};

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
        <Text variant={TextVariant.HEADER_LIGHT} style={styles.title}>
          {data?.title}
        </Text>
        {/* Short summary? */}
        {getBillShortSummary(data) ? (
          <>
            <Text variant={TextVariant.SECTION_TITLE}>Short Summary</Text>
            <Text variant={TextVariant.BODY}>{getBillShortSummary(data)}</Text>
          </>
        ) : getBillSummary(data) ? (
          // Summary
          <>
            <Text variant={TextVariant.SECTION_TITLE}>Summary</Text>
            <Text variant={TextVariant.BODY}>{getBillSummary(data)}</Text>
          </>
        ) : (
          // Oops, no summary
          <>
            <Text variant={TextVariant.SECTION_TITLE} style={styles.title}>
              Summary
            </Text>
            <Text variant={TextVariant.SUBHEADER_DETAIL}>
              No summary available (for now). Check back soon!
            </Text>
          </>
        )}

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
  title: {
    marginBottom: 12,
  },
});

export default Bill;
