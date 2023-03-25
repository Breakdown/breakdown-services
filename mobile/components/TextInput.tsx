import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { titleText } from "../styles/text";

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
  style,
  ...otherProps
}: Props) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
    height: 50,
  },
});
