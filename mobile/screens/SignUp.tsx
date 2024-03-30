import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "tamagui";

export default function SignUpScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sign Up</Text>
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