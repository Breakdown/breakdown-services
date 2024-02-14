import { StyleSheet, View } from "react-native";
import Button, { ButtonType } from "./Button";
import Text, { TextVariant } from "./Text";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import AppService, {
  GET_BILL_BY_ID,
  GET_BILL_SPONSOR,
  GET_MY_VOTE_ON_BILL,
} from "../data/appService";

const VoteOnBill = ({ id }: { id: string }) => {
  const [appService] = useState(() => new AppService());
  const { data, error, isLoading } = useQuery({
    queryKey: [GET_BILL_BY_ID, id],
    queryFn: () => appService.getBillById({ id }),
  });
  const { data: sponsorData } = useQuery({
    queryKey: [GET_BILL_SPONSOR, id],
    queryFn: () => appService.getBillSponsor({ id }),
  });

  const relevantRepTitle = useMemo(() => {
    if (isLoading) return "Representative";
    if (sponsorData?.shortTitle === "Sen." || !!data?.housePassage) {
      return "Senator";
    }
    return "Representative";
  }, [sponsorData, isLoading, data]);

  const auth = useAuth();
  const existingVoteOnBill = useQuery({
    queryKey: [GET_MY_VOTE_ON_BILL, id, auth?.user?.id],
    queryFn: () => appService.getMyVoteOnBill({ billId: id }),
  });

  const voteOnBill = useMutation({
    mutationFn: (vote: boolean) => {
      if (vote === true) {
        if (existingVoteOnBill.data?.position === true) {
          // No need to mutate, all good
          // Maybe still show a success message?
          return;
        } else {
          return appService.voteOnBill({ billId: id, position: true });
        }
      }
      if (vote === false) {
        if (existingVoteOnBill.data?.position === false) {
          // No need to mutate, all good
          // Maybe still show a success message?
          return;
        } else {
          return appService.voteOnBill({ billId: id, position: false });
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
            existingVoteOnBill.data?.position === true
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
            existingVoteOnBill.data?.position === false
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
