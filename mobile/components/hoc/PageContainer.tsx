import { ScrollView, StyleSheet, View } from "react-native";

const PageContainer = ({ children }: { children: JSX.Element }) => {
  return <ScrollView style={styles.container}>{children}</ScrollView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 8,
  },
});

export default PageContainer;
