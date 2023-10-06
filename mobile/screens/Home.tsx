import { useQuery } from "@tanstack/react-query";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import BillCard from "../components/BillCard";
import Text, { TextVariant } from "../components/Text";
import {
  getBills,
  getYourIssues,
  getYourReps,
  QUERY_GET_BILLS,
  QUERY_GET_YOUR_ISSUES,
  QUERY_GET_YOUR_REPS,
} from "../data/queries";
import RepsCarousel from "../components/RepsCarousel";
import useAuth from "../hooks/useAuth";
import IssuesOnboarding from "../components/IssuesOnboarding";

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
        {shouldOnboardIssues ? <IssuesOnboarding /> : null}
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
