import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signInEmailPassword } from "../../data/mutations";
import useAuth from "../../hooks/useAuth";

export default function SignIn() {
  const navigation = useNavigation();
  const { refetch } = useAuth();

  const signInMutation = useMutation({
    mutationFn: signInEmailPassword,
    onSuccess: () => {
      refetch();
    },
  });
  const onSubmit = async () => {
    console.log("submitted");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
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
