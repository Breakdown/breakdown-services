import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInputChangeEventData,
  View,
} from "react-native";
import PhoneInput from "react-native-phone-number-input";
import Button, { ButtonType } from "../../components/Button";
import Divider from "../../components/Divider";
import KeyboardAvoidView from "../../components/hoc/KeyboardAvoidView";
import TextInput from "../../components/TextInput";
import {
  signInEmailPassword,
  signInSMS,
  verifyCodeSMS,
} from "../../data/mutations";
import useAuth from "../../hooks/useAuth";
import { titleText } from "../../styles";

export default function SignIn() {
  const navigation = useNavigation();
  const { refetch } = useAuth({ allowUnauth: true });
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [phone, setPhone] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState(null);
  const phoneInput = useRef<PhoneInput>(null);
  const [displayVerificationField, setDisplayVerificationField] =
    useState(false);

  const signInEmailPassMutation = useMutation({
    mutationFn: signInEmailPassword,
    onSuccess: () => {
      refetch();
    },
  });

  const signInSmsMutation = useMutation({
    mutationFn: signInSMS,
    onSuccess: () => {
      setDisplayVerificationField(true);
    },
  });

  const verifyCodeSMSMutation = useMutation({
    mutationFn: verifyCodeSMS,
    onSuccess: () => {
      refetch();
    },
  });

  const onSubmitEmailPass = async () => {
    // TODO: More validation - move to backend if errors are able to be parsed into messages
    if (email && password?.length >= 6) {
      await signInEmailPassMutation.mutateAsync({
        email: email.toLowerCase(),
        password,
      });
    }
  };

  const onSubmitSms = async () => {
    // TODO: More validation - move to backend if errors are able to be parsed into messages
    if (phoneInput.current?.isValidNumber(phone)) {
      await signInSmsMutation.mutateAsync({ phoneNumber: formattedPhone });
    }
  };

  const [verificationCode, setVerificationCode] = useState(null);

  const handleVerificationFieldInput = (text: string) => {
    if (text.length <= 6) {
      setVerificationCode(text);
    }
  };

  useEffect(() => {
    if (verificationCode?.length === 6) {
      verifyCodeSMSMutation.mutate({
        phoneNumber: formattedPhone,
        verificationCode,
      });
    }
  }, [verificationCode]);

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
              onChangeText={setEmail}
              textContentType={"emailAddress"}
              placeholder={"Email"}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              textContentType={"password"}
              placeholder={"Password"}
            />
            <Button
              onPress={onSubmitEmailPass}
              title={"Sign In"}
              loading={signInEmailPassMutation.isLoading}
            />
            <Divider label={"OR"} />
            <Text style={styles.title}>
              {displayVerificationField ? "Verify Code" : "Sign In With SMS"}
            </Text>

            {displayVerificationField ? (
              <TextInput
                value={verificationCode}
                onChangeText={handleVerificationFieldInput}
                textContentType={"oneTimeCode"}
                placeholder={"123456"}
              />
            ) : (
              <PhoneInput
                containerStyle={{
                  backgroundColor: "transparent",
                  borderColor: "#20232a40",
                  borderWidth: 1,
                  borderRadius: 5,
                  marginVertical: 12,
                  height: 52,
                }}
                textContainerStyle={{
                  backgroundColor: "transparent",
                  padding: 0,
                  height: "100%",
                }}
                textInputStyle={{
                  fontSize: 14,
                }}
                flagButtonStyle={{
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8,
                  width: "20%",
                }}
                ref={phoneInput}
                defaultValue={phone}
                defaultCode="US"
                layout="second"
                onChangeText={(text) => {
                  setPhone(text);
                }}
                onChangeFormattedText={(text) => {
                  setFormattedPhone(text);
                }}
              />
            )}

            <Button
              onPress={onSubmitSms}
              type={ButtonType.Bordered}
              title={
                displayVerificationField ? "Verify" : "Send Verification Code"
              }
              loading={
                signInSmsMutation.isLoading || verifyCodeSMSMutation.isLoading
              }
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
