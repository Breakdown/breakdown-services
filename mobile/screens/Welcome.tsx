import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Breakdown</Text>
        <TouchableOpacity
          style={{
            width: "100%",
          }}
          onPress={() => navigation.navigate("SignIn")}
        >
          Sign In
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: "100%",
          }}
          onPress={() => navigation.navigate("SignUp")}
        >
          Sign Up
        </TouchableOpacity>
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
