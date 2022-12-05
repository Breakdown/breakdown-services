import { FlexAlignType } from "react-native";

export const BUTTON_BACKGROUND_COLOR = "";
export const BD_PURPLE = "#5856D6";

export const titleText = {
  fontSize: 24,
  fontWeight: "bold" as const,
  color: "black",
};

export const buttonText = {
  fontSize: 16,
  fontWeight: "bold" as const,
  color: "white",
};

export const buttonTextInverted = {
  fontSize: 16,
  fontWeight: "bold" as const,
  color: BD_PURPLE,
};

export const buttonDefault = {
  alignItems: "center" as FlexAlignType,
  borderRadius: 8,
  backgroundColor: BD_PURPLE,
  paddingVertical: 12,
  marginVertical: 10,
  width: "100%",
};

export const buttonBordered = {
  alignItems: "center" as FlexAlignType,
  borderRadius: 8,
  backgroundColor: "transparent",
  borderColor: BD_PURPLE,
  borderWidth: 2,

  paddingVertical: 12,
  marginVertical: 10,
  width: "100%",
};
