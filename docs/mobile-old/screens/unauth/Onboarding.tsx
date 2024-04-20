import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { titleText } from "../../styles/text";

const Onboarding = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "First" },
    { key: "second", title: "Second" },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* {routeToComponentMap[routes[index].key];} */}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...titleText,
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

export default Onboarding;
