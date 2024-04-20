import { useQuery } from "@tanstack/react-query";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import useAuth from "../hooks/useAuth";
import IssuesOnboarding from "../components/IssuesOnboarding";
import LocationBottomSheet from "../components/LocationBottomSheet";
import { useMemo } from "react";
import {
  GET_FOLLOWING_ISSUES,
  GET_FOLLOWING_REPS,
  GET_LOCAL_REPS,
  GET_UPCOMING_BILLS,
  getFollowingIssues,
  getFollowingReps,
  getLocalReps,
  getUpcomingBills,
} from "../data/appService";

const Home = ({ navigation }) => {
  const { user } = useAuth();

  const upcomingBillsQueryResult = useQuery({
    queryKey: [GET_UPCOMING_BILLS],
    queryFn: getUpcomingBills,
  });

  const yourRepsQueryResult = useQuery({
    queryKey: [GET_LOCAL_REPS, user?.id],
    queryFn: getLocalReps,
  });

  const followingRepsQueryResult = useQuery({
    queryKey: [GET_FOLLOWING_REPS, user?.id],
    queryFn: getFollowingReps,
  });

  const yourIssuesQueryResult = useQuery({
    queryKey: [GET_FOLLOWING_ISSUES, user?.id],
    queryFn: getFollowingIssues,
  });

  const upcomingBills = upcomingBillsQueryResult.data || [];
  const yourReps = useMemo(() => {
    if (!yourRepsQueryResult.data) return [];
    return [
      ...yourRepsQueryResult.data?.data,
      ...followingRepsQueryResult.data?.data,
    ];
  }, [yourRepsQueryResult.data, followingRepsQueryResult.data]);

  const shouldOnboardIssues = user?.onboardedIssues;

  const shouldOnboardLocation = user?.onboardedLocation;

  return (
    <>
      <ScrollView style={styles.container}>
        {/* <View style={styles.yourBillsContainer}>
          <Text
            variant={TextVariant.SECTION_TITLE}
            style={styles.sectionHeader}
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
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          Your Representatives
        </Text>
        <RepsCarousel reps={yourReps} />
        <Text variant={TextVariant.SECTION_TITLE} style={styles.sectionHeader}>
          Your Issues
        </Text>
        <YourIssues /> */}
      </ScrollView>
      {shouldOnboardIssues ? <IssuesOnboarding /> : null}
      {shouldOnboardLocation && !shouldOnboardIssues ? (
        <LocationBottomSheet />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    height: "100%",
  },
  yourBillsContainer: {
    width: "100%",
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
