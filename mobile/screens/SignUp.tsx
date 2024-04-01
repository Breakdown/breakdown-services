import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { emailSignin, emailSignup } from "../data/appService";
import { useState } from "react";
import ErrorToast from "../components/ErrorToast";
import { TextInput } from "dripsy";
import { SignUpScreenProps } from "../navigation/types";
import useAuth from "../hooks/useAuth";

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  useAuth({ allowUnauth: true });
  const [receivePromotions, setReceivePromotions] = useState<boolean>(false);
  const emailSignupMutation = useMutation({
    mutationFn: emailSignup,
    onSuccess: () => {
      navigation.navigate("Home");
    },
    onError: (error) => {
      setErrorVisible(true);
      setErrorMessage(error.message);
    },
  });
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          textContentType={"emailAddress"}
          keyboardType={"email-address"}
          placeholder={"Email"}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          textContentType={"password"}
          placeholder={"Password"}
          secureTextEntry
        />
        {/* Receive Promotions Checkbox */}
        <TouchableOpacity
          onPress={() => {
            setReceivePromotions(!receivePromotions);
          }}
        >
          <Text>Receive Promotions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (email && password) {
              emailSignupMutation.mutate({
                email: email.toLowerCase(),
                password,
                receivePromotions,
              });
            } else {
              setErrorVisible(true);
              setErrorMessage("Email and password are required");
            }
          }}
        >
          <Text>Sign Up</Text>
        </TouchableOpacity>
        {errorVisible && errorMessage && <ErrorToast message={errorMessage} />}
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
