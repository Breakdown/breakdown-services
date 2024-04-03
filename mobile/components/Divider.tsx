import { Text, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  label?: string;
}
const Divider = (props: Props) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginVertical: 10,
      }}
      {...props}
    >
      <View
        style={{
          borderBottomColor: "#20232a40",
          borderBottomWidth: 1,
          width: "45%",
        }}
      />
      {props.label && (
        <Text style={{ fontSize: 16, color: "#20232a40", marginHorizontal: 6 }}>
          {props.label}
        </Text>
      )}

      <View
        style={{
          borderBottomColor: "#20232a40",
          borderBottomWidth: 1,
          width: "45%",
        }}
      />
    </View>
  );
};

export default Divider;
