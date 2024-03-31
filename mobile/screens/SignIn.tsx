import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import { emailSignin } from "../data/appService";

export default function SignInScreen() {
  const navigation = useNavigation();
  const emailSigninMutation = useMutation({
    mutationFn: emailSignin,
    onSuccess: () => {
      navigation.navigate("Home");
    },
    onError: (error) => {
      console.log(error);
    },
  });
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sign In</Text>
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
