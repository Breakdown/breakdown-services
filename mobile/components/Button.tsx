import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { buttonDefault, buttonBordered, BD_PURPLE } from "../styles";
import { buttonText, buttonTextInverted } from "../styles/text";

export enum ButtonType {
  Default = "default",
  Bordered = "bordered",
}
interface Props extends TouchableOpacityProps {
  children?: React.ReactNode;
  title: string;
  onPress: () => void;
  loading?: boolean;
  type?: ButtonType;
}

const Button = ({
  children,
  title,
  onPress,
  loading,
  type = ButtonType.Default,
  style,
  ...otherProps
}: Props) => {
  return (
    <TouchableOpacity
      style={[styles[type], style]}
      onPress={onPress}
      {...otherProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={[ButtonType.Bordered].includes(type) ? BD_PURPLE : "white"}
        />
      ) : (
        <Text
          style={
            [ButtonType.Bordered].includes(type)
              ? styles[`${type}Text`]
              : styles.buttonText
          }
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  default: { ...buttonDefault },
  bordered: { ...buttonBordered },
  borderedText: { ...buttonTextInverted },
  buttonText: {
    ...buttonText,
  },
});

export default Button;
