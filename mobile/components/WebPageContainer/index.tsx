import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";

const WebPageContainer = ({ open, uri, onExitPress }) => {
  return (
    <>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={{ height: 24, width: 24, marginBottom: 18 }}
          onPress={onExitPress}
        >
          <Exit height={24} width={24} stroke={"#000000"} />
        </TouchableOpacity>
      </View>
      <WebView
        source={{
          uri,
        }}
        decelerationRate={0.5}
        scalesPageToFit
        contentInset={{ top: 10, left: 0, bottom: 0, right: 0 }}
        startInLoadingState
        style={{ flex: 1 }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  continer: {
    width: "100%",
    height: "100%",
    marginTop: 50,
  },
  headerContainer: {
    backgroundColor: "#ffffff",
    width: "100%",
    height: "10%",
    justifyContent: "center",
    paddingTop: "14%",
    paddingLeft: "3%",
    alignItems: "flex-start",
    borderBottomColor: "#707070",
    borderBottomWidth: 2,
  },
});

export default WebPageContainer;
