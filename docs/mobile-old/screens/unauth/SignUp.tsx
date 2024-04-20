import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button, { ButtonType } from "../../components/Button";
import Divider from "../../components/Divider";
import PhoneInput from "../../components/PhoneInput";
import TextInput from "../../components/TextInput";
import useAuth from "../../hooks/useAuth";
import BasePhoneInput from "react-native-phone-number-input";
import { titleText } from "../../styles/text";
import { emailSignup, smsSignup, smsSignupVerify } from "../../data/appService";

export default function SignUp() {
  const { refetch } = useAuth({ allowUnauth: true });
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [verifyPassword, setVerifyPassword] = useState(null);
  const [phone, setPhone] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState(null);
  const [receivePromotions, setReceivePromotions] = useState(false);
  const phoneInput = useRef<BasePhoneInput>(null);
  const [displayVerificationField, setDisplayVerificationField] =
    useState(false);

  const signUpEmailPassMutation = useMutation({
    mutationFn: emailSignup,
    onSuccess: () => {
      refetch();
    },
  });

  const signUpSmsMutation = useMutation({
    mutationFn: smsSignup,
    onSuccess: () => {
      setDisplayVerificationField(true);
    },
  });

  const verifyCodeSMSMutation = useMutation({
    mutationFn: smsSignupVerify,
    onSuccess: () => {
      refetch();
    },
  });

  const onSubmitEmailPass = async () => {
    // TODO: More validation - move to backend
    if (email && password?.length >= 6 && verifyPassword.length >= 6) {
      if (password === verifyPassword) {
        await signUpEmailPassMutation.mutateAsync({
          email: email.toLowerCase(),
          password,
          receivePromotions,
        });
      } else {
        alert("Passwords do not match");
      }
    }
  };

  const onSubmitSms = async () => {
    // TODO: More validation - move to backend
    if (phoneInput.current?.isValidNumber(phone)) {
      await signUpSmsMutation.mutateAsync({ phone: formattedPhone });
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
            <Text style={styles.title}>Sign Up with Email</Text>
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
              secureTextEntry
            />
            <TextInput
              value={verifyPassword}
              onChangeText={setVerifyPassword}
              textContentType={"newPassword"}
              placeholder={"Verify Password"}
              secureTextEntry
            />
            <Button
              onPress={onSubmitEmailPass}
              title={"Sign Up"}
              loading={signUpEmailPassMutation.isLoading}
            />
            <Divider label={"OR"} />
            <Text style={styles.title}>
              {displayVerificationField
                ? "Enter Your Verification Code"
                : "Sign Up with SMS"}
            </Text>

            {displayVerificationField ? (
              <TextInput
                value={verificationCode}
                onSubmitEditing={() => {
                  if (verificationCode?.length === 6) {
                    verifyCodeSMSMutation.mutate({
                      code: verificationCode,
                    });
                  }
                }}
                returnKeyType="done"
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

            {!displayVerificationField && (
              <Button
                onPress={onSubmitSms}
                type={ButtonType.Bordered}
                title={"Send Verification Code"}
                loading={
                  signUpSmsMutation.isLoading || verifyCodeSMSMutation.isLoading
                }
              />
            )}
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
