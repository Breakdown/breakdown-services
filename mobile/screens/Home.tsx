import { useMutation, useQuery } from "@tanstack/react-query";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import BillCard from "../components/BillCard";
import Text, { TextVariant } from "../components/Text";
import {
  getAllIssues,
  getBills,
  getYourIssues,
  getYourReps,
  QUERY_GET_ALL_ISSUES,
  QUERY_GET_BILLS,
  QUERY_GET_YOUR_ISSUES,
  QUERY_GET_YOUR_REPS,
} from "../data/queries";
import RepsCarousel from "../components/RepsCarousel";
import useAuth from "../hooks/useAuth";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import { BreakdownIssue } from "../types/api";
import IssueCard from "../components/IssueCard";
import Button, { ButtonType } from "../components/Button";
import { submitIssuesInterests } from "../data/mutations";
import Toast from "react-native-toast-message";

const OnboardingBottomSheet = () => {
  const { user } = useAuth();
  const yourIssuesQueryResult = useQuery({
    queryKey: [QUERY_GET_YOUR_ISSUES, user?.id],
    queryFn: getYourIssues,
    enabled: false,
  });
  const sheetRef = useRef<BottomSheet>(null);

  const { data } = useQuery({
    queryKey: [QUERY_GET_ALL_ISSUES],
    queryFn: getAllIssues,
    staleTime: 6000 * 60 * 24,
  });

  const snapPoints = useMemo(() => ["25%", "50%", "96%"], []);

  // callbacks
  const handleSheetChange = useCallback((index) => {
    console.log("handleSheetChange", index);
  }, []);
  const handleSnapPress = useCallback((index) => {
    sheetRef.current?.snapToIndex(index);
  }, []);
  const handleClosePress = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const [selectedIssues, setSelectedIssues] = useState<BreakdownIssue[]>([]);
  // render
  const renderItem = useCallback(
    ({ item }: { item: BreakdownIssue }) => (
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
      await submitIssuesInterests({
        issueIds: selectedIssues.map((i) => i.id),
      });
      yourIssuesQueryResult.refetch();
      showToast();
    },
  });

  console.log("length", selectedIssues.length);
  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      style={styles.sheetContainer}
    >
      <View style={styles.titleRow}>
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          What interests you?
        </Text>
        <Text variant={TextVariant.HEADER_DETAIL} style={styles.subHeader}>
          We want to know what Issues you care about, so we can show you bills
          where you'll feel the need to vote.
        </Text>
      </View>
      <BottomSheetFlatList
        data={data}
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
const Home = ({ navigation }) => {
  const { user } = useAuth();
  const yourBillsQueryResult = useQuery({
    queryKey: [QUERY_GET_BILLS, user?.id],
    queryFn: getBills,
  });
  const yourRepsQueryResult = useQuery({
    queryKey: [QUERY_GET_YOUR_REPS, user?.id],
    queryFn: getYourReps,
  });
  const yourIssuesQueryResult = useQuery({
    queryKey: [QUERY_GET_YOUR_ISSUES, user?.id],
    queryFn: getYourIssues,
  });

  const yourBills = yourBillsQueryResult.data?.data?.data;
  const yourReps = yourRepsQueryResult.data?.data?.data;

  console.log("issues", yourIssuesQueryResult);

  const shouldOnboardIssues = !yourIssuesQueryResult.data?.length;

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
        {shouldOnboardIssues ? <OnboardingBottomSheet /> : null}
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
    marginTop: 12,
    marginBottom: 4,
    paddingLeft: 8,
  },
  subHeader: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  listContainer: {
    paddingVertical: 12,
    maxHeight: Dimensions.get("window").height * 0.3 + 12,
  },
  sheetContainer: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    // shadow: "#d3d3d3",
    // borderTopWidth: 1,
    shadowColor: "#d3d3d3",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  titleRow: {},
  contentContainer: {
    backgroundColor: "white",
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: "#eee",
  },
});

export default Home;
