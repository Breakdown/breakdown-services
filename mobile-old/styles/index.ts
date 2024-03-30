import { FlexAlignType } from "react-native";

export const BUTTON_BACKGROUND_COLOR = "";
export const BD_PURPLE = "#5856D6";
export const BD_BLUE = "#007AFF";
export const BD_RED = "#FF3B30";
export const BD_LIGHT_RED = "#FF8982";
export const BD_LIGHT_BLUE = "#7ABAFF";
export const BD_LIGHT_PURPLE = "#8B8AD4";
export const BD_LIGHT_GREEN = "#34C759";

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
