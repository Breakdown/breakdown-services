import {
  StyleSheet,
  Text as NativeText,
  TextProps,
  TextStyle,
} from "react-native";

export enum TextVariant {
  SECTION_TITLE = "SECTION_TITLE",
  HEADER = "HEADER",
  HEADER_LIGHT = "HEADER_LIGHT",
  SUBHEADER = "SUBHEADER",
  SUBHEADER_DETAIL = "SUBHEADER_DETAIL",
  HEADER_DETAIL = "HEADER_DETAIL",
  TITLE = "TITLE",
  DETAIL = "DETAIL",
  TINY_TITLE = "TINY_TITLE",
  BODY = "BODY",
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
  HEADER: {
    fontSize: 24,
    fontWeight: "bold",
  },
  HEADER_LIGHT: {
    fontSize: 24,
    fontWeight: "500",
  },
  SUBHEADER: {
    fontWeight: "500",
    fontSize: 18,
  },
  SUBHEADER_DETAIL: {
    color: "#A0AEC0",
    fontWeight: "500",
    fontSize: 18,
  },
  HEADER_DETAIL: {
    color: "#A0AEC0",
    fontWeight: "500",
    fontSize: 16,
  },
  TITLE: {
    fontWeight: "500",
    fontSize: 16,
  },
  DETAIL: {
    color: "#A0AEC0",
    fontWeight: "400",
    fontSize: 12,
  },
  TINY_TITLE: {
    fontWeight: "500",
    fontSize: 12,
  },
  BODY: {
    fontWeight: "500",
    fontSize: 16,
  },
};

const styles = StyleSheet.create({
  text: {
    // fontFamily: "SF Pro Text",
  },
  SECTION_TITLE: {
    ...variants.SECTION_TITLE,
  },
  HEADER: {
    ...variants.HEADER,
  },
  HEADER_LIGHT: {
    ...variants.HEADER_LIGHT,
  },
  SUBHEADER: {
    ...variants.SUBHEADER,
  },
  SUBHEADER_DETAIL: {
    ...variants.SUBHEADER_DETAIL,
  },
  HEADER_DETAIL: {
    ...variants.HEADER_DETAIL,
  },
  TITLE: {
    ...variants.TITLE,
  },
  DETAIL: {
    ...variants.DETAIL,
  },
  TINY_TITLE: {
    ...variants.TINY_TITLE,
  },
});

export default Text;
