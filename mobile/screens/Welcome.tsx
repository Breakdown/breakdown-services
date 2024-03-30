import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "tamagui";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Breakdown</Text>
        <Button
          width="100%"
          margin="$3"
          onPress={() => navigation.navigate("SignIn")}
        >
          Sign In
        </Button>
        <Button
          width="100%"
          margin="$3"
          onPress={() => navigation.navigate("SignUp")}
        >
          Sign Up
        </Button>
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
