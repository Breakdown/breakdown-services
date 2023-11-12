import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { getBillById, QUERY_GET_BILL } from "../data/queries";
import Text, { TextVariant } from "../components/Text";
import PageContainer from "../components/hoc/PageContainer";
import VoteOnBill from "../components/VoteOnBill";
import { BreakdownBill } from "../types/api";
import Button, { ButtonType } from "../components/Button";
import useAuth from "../hooks/useAuth";

const Account = ({ navigation, route }) => {
  const { logout } = useAuth();

  return (
    <PageContainer>
      <View style={styles.container}>
        <Button type={ButtonType.Bordered} onPress={logout} title={"Logout"} />
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

export default Account;
