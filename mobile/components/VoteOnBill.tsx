import { StyleSheet, View } from "react-native";
import Button, { ButtonType } from "./Button";
import Text, { TextVariant } from "./Text";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  QUERY_GET_BILL,
  QUERY_GET_BILL_SPONSOR,
  QUERY_GET_USER_VOTE_ON_BILL,
  getBillById,
  getBillSponsorById,
  getUserVoteOnBill,
} from "../data/queries";
import { useMemo } from "react";
import { voteOnBillMutation } from "../data/mutations";
import useAuth from "../hooks/useAuth";

const VoteOnBill = ({ id }: { id: string }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: [QUERY_GET_BILL, id],
    queryFn: () => getBillById(id),
  });
  const { data: sponsorData } = useQuery({
    queryKey: [QUERY_GET_BILL_SPONSOR, id],
    queryFn: () => getBillSponsorById(id),
  });

  const relevantRepTitle = useMemo(() => {
    if (isLoading) return "Representative";
    if (sponsorData?.short_title === "Sen." || !!data?.house_passage) {
      return "Senator";
    }
    return "Representative";
  }, [sponsorData, isLoading, data]);

  const auth = useAuth();
  const existingVoteOnBill = useQuery({
    queryKey: [QUERY_GET_USER_VOTE_ON_BILL, id, auth?.user?.id],
    queryFn: () => getUserVoteOnBill({ billId: id }),
  });

  const voteOnBill = useMutation({
    mutationFn: (vote: boolean) => {
      if (vote === true) {
        if (existingVoteOnBill.data?.vote === true) {
          // No need to mutate, all good
          // Maybe still show a success message?
          return;
        } else {
          return voteOnBillMutation({ billId: id, vote: true });
        }
      }
      if (vote === false) {
        if (existingVoteOnBill.data?.vote === false) {
          // No need to mutate, all good
          // Maybe still show a success message?
          return;
        } else {
          return voteOnBillMutation({ billId: id, vote: false });
        }
      }
    },
    onSuccess: () => {
      existingVoteOnBill.refetch();
    },
  });

  return (
    <View style={styles.stack}>
      <Text variant={TextVariant.SUBHEADER}>
        Should your {relevantRepTitle} vote Yes or No on this Bill?
      </Text>
      <View style={styles.container}>
        <Button
          onPress={() => {
            voteOnBill.mutate(true);
          }}
          type={ButtonType.Default}
          title={"Yes"}
          style={[
            styles.button,
            existingVoteOnBill.data?.vote === true
              ? { backgroundColor: "green" }
              : {},
          ]}
        />
        <Button
          onPress={() => {
            voteOnBill.mutate(false);
          }}
          type={ButtonType.Default}
          title={"No"}
          style={[
            styles.button,
            existingVoteOnBill.data?.vote === false
              ? { backgroundColor: "green" }
              : {},
          ]}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  stack: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    width: "40%",
  },
});
export default VoteOnBill;
