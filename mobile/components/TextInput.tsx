import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { titleText } from "../styles";

interface Props extends TextInputProps {
  error?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default ({
  error,
  label,
  value,
  onChangeText,
  placeholder,
  ...otherProps
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(e) => onChangeText?.(e.toString())}
        placeholder={placeholder}
        {...otherProps}
      />
      {error && <Text>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    ...titleText,
  },
  input: {
    borderColor: "#20232a40",
    borderWidth: 1,
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 5,
  },
});
