import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BD_PURPLE } from "../styles";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AccountIcon = () => {
  const nav = useNavigation();
  return (
    <TouchableOpacity
      style={styles.circle}
      onPress={() => {
        nav.navigate("Account");
      }}
    >
      <View style={styles.icon}>
        <MaterialIcons name="account-circle" size={32} color={BD_PURPLE} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: BD_PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
export default AccountIcon;
