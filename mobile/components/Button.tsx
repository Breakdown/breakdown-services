import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityBase,
  TouchableOpacityProps,
} from "react-native";
import {
  buttonDefault,
  buttonText,
  buttonBordered,
  buttonTextInverted,
} from "../styles";

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
  ...otherProps
}: Props) => {
  return (
    <TouchableOpacity style={styles[type]} onPress={onPress} {...otherProps}>
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
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
