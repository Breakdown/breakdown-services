import { Text, TextInput, TextInputProps, View } from "react-native";

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
    <View>
      <Text>{label}</Text>
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...otherProps}
      />
      {error && <Text>{error}</Text>}
    </View>
  );
};
