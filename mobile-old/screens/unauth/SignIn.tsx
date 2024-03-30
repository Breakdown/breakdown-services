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
import Button, { ButtonType } from "../../components/Button";
import Divider from "../../components/Divider";
import KeyboardAvoidView from "../../components/hoc/KeyboardAvoidView";
import BasePhoneInput from "react-native-phone-number-input";
import PhoneInput from "../../components/PhoneInput";
import TextInput from "../../components/TextInput";
import useAuth from "../../hooks/useAuth";
import { titleText } from "../../styles/text";
import { emailSignin, smsSignin, smsSigninVerify } from "../../data/appService";

export default function SignIn() {
  const navigation = useNavigation();
  const { refetch } = useAuth({ allowUnauth: true });
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [phone, setPhone] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState(null);
  const phoneInput = useRef<BasePhoneInput>(null);
  const [displayVerificationField, setDisplayVerificationField] =
    useState(false);

  const signInEmailPassMutation = useMutation({
    mutationFn: emailSignin,
    onSuccess: () => {
      refetch();
    },
  });

  const signInSmsMutation = useMutation({
    mutationFn: smsSignin,
    onSuccess: () => {
      setDisplayVerificationField(true);
    },
  });

  const verifyCodeSMSMutation = useMutation({
    mutationFn: smsSigninVerify,
    onSuccess: () => {
      refetch();
    },
  });

  const onSubmitEmailPass = async () => {
    await signInEmailPassMutation.mutateAsync({
      email: email.toLowerCase(),
      password,
    });
  };

  const onSubmitSms = async () => {
    await signInSmsMutation.mutateAsync({ phone: formattedPhone });
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
        code: verificationCode,
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Sign In with Email</Text>
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
            <Button
              onPress={onSubmitEmailPass}
              title={"Sign In"}
              loading={signInEmailPassMutation.isLoading}
            />
            <Divider label={"OR"} />
            <Text style={styles.title}>
              {displayVerificationField ? "Verify Code" : "Sign In with SMS"}
            </Text>

            {displayVerificationField ? (
              <TextInput
                value={verificationCode}
                onChangeText={handleVerificationFieldInput}
                textContentType={"oneTimeCode"}
                placeholder={"123456"}
                style={{
                  marginBottom: 12,
                }}
              />
            ) : (
              <PhoneInput
                inputRef={phoneInput}
                value={phone}
                setPhone={setPhone}
                setFormattedPhone={setFormattedPhone}
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
