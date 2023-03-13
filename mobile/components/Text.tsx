import {
  StyleSheet,
  Text as NativeText,
  TextProps,
  TextStyle,
} from "react-native";

export enum TextVariant {
  SECTION_TITLE = "SECTION_TITLE",
}
interface BreakdownTextProps extends TextProps {
  variant?: TextVariant;
}
const Text = ({ variant, children, style, ...props }: BreakdownTextProps) => {
  return (
    <NativeText
      style={[variant ? styles[variant] : {}, styles.text, style]}
      {...props}
    >
      {children}
    </NativeText>
  );
};

const variants: { [key in TextVariant]: TextStyle } = {
  SECTION_TITLE: {
    fontSize: 24,
    fontWeight: "bold",
  },
};

const styles = StyleSheet.create({
  text: {
    fontFamily: "SF Pro Text",
  },
  SECTION_TITLE: {
    ...variants.SECTION_TITLE,
  },
});

export default Text;
