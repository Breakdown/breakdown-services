import BasePhoneInput from "react-native-phone-number-input";

interface Props {
  inputRef: React.RefObject<BasePhoneInput>;
  value: string;
  setPhone: (value: string) => void;
  setFormattedPhone: (value: string) => void;
}

const PhoneInput = (props: Props) => {
  return (
    <BasePhoneInput
      containerStyle={{
        backgroundColor: "transparent",
        borderColor: "#20232a40",
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 12,
        height: 52,
      }}
      textContainerStyle={{
        backgroundColor: "transparent",
        padding: 0,
        height: "100%",
      }}
      textInputStyle={{
        fontSize: 14,
      }}
      flagButtonStyle={{
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        width: "20%",
      }}
      ref={props.inputRef}
      defaultValue={props.value}
      defaultCode="US"
      layout="second"
      onChangeText={(text) => {
        props.setPhone(text);
      }}
      onChangeFormattedText={(text) => {
        props.setFormattedPhone(text);
      }}
    />
  );
};

export default PhoneInput;
