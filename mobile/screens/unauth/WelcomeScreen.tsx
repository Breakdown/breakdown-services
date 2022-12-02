import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signInEmailPassword } from "../../data/mutations";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Breakdown</Text>
      {/* @ts-ignore */}
      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
        <Text>Sign In</Text>
      </TouchableOpacity>
      {/* @ts-ignore */}
      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text>Sign Up</Text>
      </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
