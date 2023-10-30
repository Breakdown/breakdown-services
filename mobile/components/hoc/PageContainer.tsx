import { StyleSheet, View } from "react-native";

const PageContainer = ({ children }: { children: JSX.Element }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 8,
  },
});

export default PageContainer;
