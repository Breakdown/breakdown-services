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
}

export default ({
  error,
  label,
  value,
  onChange,
  placeholder,
  ...otherProps
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChange={onChange}
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
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
  },
});
