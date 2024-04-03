import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { emailSignin, smsSignin, smsSigninVerify } from "../data/appService";
import { useCallback, useRef, useState } from "react";
import ErrorToast from "../components/ErrorToast";
import { TextInput } from "dripsy";
import BasePhoneInput from "react-native-phone-number-input";
import useAuth from "../hooks/useAuth";
import Divider from "../components/Divider";
import PhoneInput from "../components/PhoneInput";

export default function SignInScreen() {
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState<string>("");
  const [formattedPhone, setFormattedPhone] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string | undefined>(
    undefined
  );
  const [verifyCode, setVerifyCode] = useState<boolean>(false);
  const { refetch } = useAuth({ unauth: true });
  const navigation = useNavigation();
  const phoneInput = useRef<BasePhoneInput>(null);

  // Automatically exit keyboard when phone input is 10
  const onPhoneInputChange = useCallback((text: string) => {
    if (text.length >= 10) {
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
  const emailSigninMutation = useMutation({
    mutationFn: emailSignin,
    onSuccess: () => {
      refetch();
      navigation.navigate("Home");
    },
    onError: (error) => {
      onMutationError(error);
    },
  });

  const smsSigninMutation = useMutation({
    mutationFn: smsSignin,
    onSuccess: () => {
      setVerifyCode(true);
      Keyboard.dismiss();
    },
    onError: onMutationError,
  });

  const verifyCodeSMSMutation = useMutation({
    mutationFn: smsSigninVerify,
    onSuccess: () => {
      navigation.navigate("Home");
    },
    onError: onMutationError,
  });

  const onSubmitSms = async () => {
    if (formattedPhone) {
      // Remove () - and spaces from phone number
      const cleanPhoneNumber = formattedPhone.replace(/[- )(]/g, "");
      if (phoneInput.current?.isValidNumber(cleanPhoneNumber)) {
        smsSigninMutation.mutate({
          phone: cleanPhoneNumber,
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
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sign In</Text>
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
        <TouchableOpacity
          onPress={() => {
            if (email && password) {
              emailSigninMutation.mutate({
                email: email.toLowerCase(),
                password,
              });
            } else {
              setErrorVisible(true);
              setErrorMessage("Email and password are required");
            }
          }}
        >
          <Text>Sign In</Text>
        </TouchableOpacity>
        <Divider label={"OR"} />
        <Text style={styles.title}>
          {verifyCode ? "Enter Your Verification Code" : "Sign In with SMS"}
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
              <Text>Sign In with SMS</Text>
            </TouchableOpacity>
          </>
        )}
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
