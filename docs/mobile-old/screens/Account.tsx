import { StyleSheet, View } from "react-native";
import PageContainer from "../components/hoc/PageContainer";
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
