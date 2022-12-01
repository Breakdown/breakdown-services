import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signInEmailPassword } from "../data/mutations";

export default function TabOneScreen() {
  const signinMutation = useMutation({
    mutationFn: signInEmailPassword,
  });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <TouchableOpacity
        onPress={() => {
          signinMutation.mutate({
            email: "ryan@breakdown.us",
            password: "123456",
          });
        }}
      >
        <Text>Signin</Text>
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
