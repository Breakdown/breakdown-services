import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "../../components/Button";
import Divider from "../../components/Divider";
import KeyboardAvoidView from "../../components/hoc/KeyboardAvoidView";
import TextInput from "../../components/TextInput";
import { signInEmailPassword } from "../../data/mutations";
import useAuth from "../../hooks/useAuth";
import { titleText } from "../../styles";

export default function SignIn() {
  const navigation = useNavigation();
  const { refetch } = useAuth({ allowUnauth: true });
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);

  const signInEmailPassMutation = useMutation({
    mutationFn: signInEmailPassword,
    onSuccess: () => {
      refetch();
    },
  });
  const onSubmit = async () => {
    console.log(email);
    console.log(password);
    // TODO: More validation - move to backend if errors are able to be parsed into messages
    if (email && password?.length > 6) {
      await signInEmailPassMutation.mutateAsync({
        email: email.toLowerCase(),
        password,
      });
    }
    console.log("submitted");
  };
  return (
    <View style={styles.pageContainer}>
      <KeyboardAvoidingView behavior="padding" style={styles.pageContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={styles.pageContainer}
          keyboardDismissMode="interactive"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In With Email</Text>
            <TextInput
              value={email}
              onChange={setEmail}
              textContentType={"emailAddress"}
              placeholder={"Email"}
            />
            <TextInput
              value={password}
              onChange={setPassword}
              textContentType={"password"}
              placeholder={"Password"}
            />
            <Button onPress={onSubmit} title={"Sign In"} />
            <Divider label={"OR"} />
            <Text style={styles.title}>Sign In With Phone #</Text>
            <TextInput
              value={email}
              onChange={setEmail}
              textContentType={"telephoneNumber"}
              placeholder={"Email"}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  formContainer: {
    width: "80%",
  },
  title: {
    ...titleText,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
