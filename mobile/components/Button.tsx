import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import {
  buttonDefault,
  buttonText,
  buttonBordered,
  buttonTextInverted,
  BD_PURPLE,
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
