import { StyleSheet } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "tamagui";
import { useMutation } from "react-query";
import { signInWithApple } from "@/data/appService";
// import { Text, View } from "@/components/Themed";

export default function TabOneScreen() {
  const signInWithAppleMutation = useMutation({
    mutationFn: signInWithApple,
  });
  const handleAppleButtonPress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      console.log(credential);
      // signed in
    } catch (e: any) {
      // TODO: Type this
      if (e.code === "ERR_REQUEST_CANCELED") {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
      <View style={styles.container}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={5}
          style={styles.button}
          onPress={handleAppleButtonPress}
        />
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
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  button: {
    width: 200,
    height: 44,
    marginTop: 20,
  },
});
