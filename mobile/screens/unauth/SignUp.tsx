import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button, { ButtonType } from "../../components/Button";
import Divider from "../../components/Divider";
import PhoneInput from "../../components/PhoneInput";
import TextInput from "../../components/TextInput";
import useAuth from "../../hooks/useAuth";
import { titleText } from "../../styles";
import BasePhoneInput from "react-native-phone-number-input";
import {
  signUpEmailPassword,
  signUpSMS,
  verifyCodeSMS,
} from "../../data/mutations";

export default function SignUp() {
  const { refetch } = useAuth({ allowUnauth: true });
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [verifyPassword, setVerifyPassword] = useState(null);
  const [phone, setPhone] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState(null);
  const phoneInput = useRef<BasePhoneInput>(null);
  const [displayVerificationField, setDisplayVerificationField] =
    useState(false);

  const signUpEmailPassMutation = useMutation({
    mutationFn: signUpEmailPassword,
    onSuccess: () => {
      refetch();
    },
  });

  const signUpSmsMutation = useMutation({
    mutationFn: signUpSMS,
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
    if (email && password?.length >= 6 && verifyPassword.length >= 6) {
      if (password === verifyPassword) {
        await signUpEmailPassMutation.mutateAsync({
          email: email.toLowerCase(),
          password,
        });
      } else {
        alert("Passwords do not match");
      }
    }
  };

  const onSubmitSms = async () => {
    // TODO: More validation - move to backend if errors are able to be parsed into messages
    if (phoneInput.current?.isValidNumber(phone)) {
      await signUpSmsMutation.mutateAsync({ phoneNumber: formattedPhone });
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
            />
            <TextInput
              value={verifyPassword}
              onChangeText={setVerifyPassword}
              textContentType={"newPassword"}
              placeholder={"Verify Password"}
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
