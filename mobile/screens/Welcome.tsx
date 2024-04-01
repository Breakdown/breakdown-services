import { useNavigation } from "@react-navigation/native";
import { Text } from "dripsy";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import useAuth from "../hooks/useAuth";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  useAuth({ unauth: true });
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
          <Text>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: "100%",
          }}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text>Sign Up</Text>
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
