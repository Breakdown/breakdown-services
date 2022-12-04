import { Text, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  label: string;
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
    >
      <View
        style={{
          borderBottomColor: "#E5E5E5",
          borderBottomWidth: 1,
          width: "45%",
        }}
      />
      <Text style={{ fontSize: 14, color: "#d3d3d3", marginHorizontal: 6 }}>
        {props.label}
      </Text>
      <View
        style={{
          borderBottomColor: "#E5E5E5",
          borderBottomWidth: 1,
          width: "45%",
        }}
      />
    </View>
  );
};

export default Divider;
