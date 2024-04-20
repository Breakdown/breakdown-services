import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import Button, { ButtonType } from "../../components/Button";
import Divider from "../../components/Divider";
import { titleText } from "../../styles/text";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Breakdown</Text>
        <Button
          title={"Sign In"}
          // @ts-ignore
          onPress={() => navigation.navigate("SignIn")}
        />
        <Divider label={"OR"} />
        <Button
          title={"Sign Up"}
          type={ButtonType.Bordered}
          // @ts-ignore
          onPress={() => navigation.navigate("SignUp")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...titleText,
    marginBottom: 12,
    textAlign: "center",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  contentContainer: {
    width: "80%",
  },
});
