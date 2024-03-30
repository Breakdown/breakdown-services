import { useMutation, useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import { useCallback, useMemo, useRef, useState } from "react";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import IssueCard from "./IssueCard";
import Toast from "react-native-toast-message";
import { StyleSheet, View } from "react-native";
import Text, { TextVariant } from "./Text";
import Button, { ButtonType } from "./Button";
import {
  GET_FOLLOWING_ISSUES,
  GET_ISSUES,
  getFollowingIssues,
  getIssues,
} from "../data/appService";
import { Issue } from "../data/types";

const IssuesOnboarding = () => {
  const { user } = useAuth();
  const yourIssuesQueryResult = useQuery({
    queryKey: [GET_FOLLOWING_ISSUES, user?.id],
    queryFn: getFollowingIssues,
    enabled: false,
  });
  const sheetRef = useRef<BottomSheet>(null);

  const { data } = useQuery({
    queryKey: [GET_ISSUES],
    queryFn: getIssues,
    staleTime: 6000 * 60 * 24,
  });

  const snapPoints = useMemo(() => ["25%", "50%", "96%"], []);

  const [selectedIssues, setSelectedIssues] = useState<Issue[]>([]);
  // render
  const renderItem = useCallback(
    ({ item }: { item: Issue }) => (
      <IssueCard
        issue={item}
        onChangeChecked={(checked) => {
          if (checked) {
            setSelectedIssues((prevState) => [...prevState, item]);
          } else {
            setSelectedIssues((prevState) =>
              prevState.filter((i) => i.id !== item.id)
            );
          }
        }}
      />
    ),
    []
  );
  const showToast = () => {
    Toast.show({
      type: "success",
      text1: "Thank you!",
      text2:
        "Your interests should help us give you the most relevant bills you may want to see.",
    });
  };
  const submitIssuesMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement this
      // await submitIssuesInterests({
      //   issueIds: selectedIssues.map((i) => i.id),
      // });
      yourIssuesQueryResult.refetch();
      showToast();
    },
  });

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      style={styles.sheetContainer}
    >
      <View>
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          What interests you?
        </Text>
        <Text variant={TextVariant.HEADER_DETAIL} style={styles.subHeader}>
          We want to know what Issues you care about, so we can show you bills
          where you'll feel the need to vote.
        </Text>
      </View>
      <BottomSheetFlatList
        data={data?.data || []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
      />
      <Button
        type={
          selectedIssues.length === 0 ? ButtonType.Bordered : ButtonType.Default
        }
        title={"Submit"}
        onPress={() => submitIssuesMutation.mutate()}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    shadowColor: "#d3d3d3",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 4,
    paddingLeft: 8,
  },
  subHeader: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  contentContainer: {
    backgroundColor: "white",
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: "#eee",
  },
});

export default IssuesOnboarding;
