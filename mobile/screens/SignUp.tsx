import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import {
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  emailSignin,
  emailSignup,
  smsSignup,
  smsSignupVerify,
} from "../data/appService";
import { useCallback, useRef, useState } from "react";
import ErrorToast from "../components/ErrorToast";
import { TextInput } from "dripsy";
import { SignUpScreenProps } from "../navigation/types";
import useAuth from "../hooks/useAuth";
import Divider from "../components/Divider";
import BasePhoneInput from "react-native-phone-number-input";
import PhoneInput from "../components/PhoneInput";

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string>("");
  const [formattedPhone, setFormattedPhone] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string | undefined>(
    undefined
  );
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [verifyCode, setVerifyCode] = useState<boolean>(false);
  useAuth({ unauth: true });
  const [receivePromotions, setReceivePromotions] = useState<boolean>(false);
  const phoneInput = useRef<BasePhoneInput>(null);

  // Automatically exit keyboard when user clicks outside of input
  // Automatically exit keyboard when phone input is 10
  const onPhoneInputChange = useCallback((text: string) => {
    if (text.length === 10) {
      Keyboard.dismiss();
    }
  }, []);

  const onMutationError = useCallback(
    (error: Error) => {
      setErrorVisible(true);
      setErrorMessage(error.message);
      setTimeout(() => {
        setErrorVisible(false);
      }, 3000);
    },
    [setErrorVisible, setErrorMessage]
  );

  const emailSignupMutation = useMutation({
    mutationFn: emailSignup,
    onSuccess: () => {
      navigation.navigate("Home");
    },
    onError: onMutationError,
  });

  const smsSignupMutation = useMutation({
    mutationFn: smsSignup,
    onSuccess: () => {
      setVerifyCode(true);
      Keyboard.dismiss();
    },
    onError: onMutationError,
  });

  const verifyCodeSMSMutation = useMutation({
    mutationFn: smsSignupVerify,
    onSuccess: () => {
      navigation.navigate("Home");
    },
    onError: onMutationError,
  });

  const onSubmitSms = async () => {
    console.log("phone", phone);
    console.log("formattedPhone", formattedPhone);
    if (phone) {
      if (phoneInput.current?.isValidNumber(phone)) {
        smsSignupMutation.mutate({
          phone: formattedPhone,
        });
      } else {
        onMutationError(new Error("Invalid phone number"));
      }
    } else {
      onMutationError(new Error("Phone number is required"));
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={"padding"}>
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
                onMutationError(new Error("Phone number is required"));
              }
            }}
          >
            <Text>Sign Up</Text>
          </TouchableOpacity>
          <Divider label={"OR"} />
          <Text style={styles.title}>
            {verifyCode ? "Enter Your Verification Code" : "Sign Up with SMS"}
          </Text>
          {verifyCode ? (
            <>
              <TextInput
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType={"phone-pad"}
                placeholder={"+1"}
              />
              <TouchableOpacity
                onPress={() => {
                  if (verificationCode?.length === 6) {
                    Keyboard.dismiss();
                    verifyCodeSMSMutation.mutate({
                      code: verificationCode,
                    });
                  }
                }}
              >
                <Text>Verify Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <PhoneInput
                inputRef={phoneInput}
                value={phone}
                setPhone={(phoneNumber: string) => {
                  setPhone(phoneNumber);
                  onPhoneInputChange(phoneNumber);
                }}
                setFormattedPhone={setFormattedPhone}
              />
              <TouchableOpacity onPress={onSubmitSms}>
                <Text>Sign Up with SMS</Text>
              </TouchableOpacity>
            </>
          )}

          {errorVisible && errorMessage && (
            <ErrorToast message={errorMessage} />
          )}
        </View>
      </KeyboardAvoidingView>
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
