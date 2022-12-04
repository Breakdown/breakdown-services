import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityBase,
  TouchableOpacityProps,
} from "react-native";
import { buttonDefault, buttonText } from "../styles";

interface Props extends TouchableOpacityProps {
  children?: React.ReactNode;
  title: string;
  onPress: () => void;
}

const Button = ({ children, title, onPress, ...otherProps }: Props) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} {...otherProps}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { ...buttonDefault },
  buttonText: {
    ...buttonText,
  },
});

export default Button;
