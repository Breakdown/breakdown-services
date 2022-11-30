import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ColorSchemeName } from "react-native";
import NotFoundScreen from "../screens/NotFound";
import { BaseNavigator } from "./navigator";

interface Props {
  colorScheme: ColorSchemeName;
}

export const Navigation = ({ colorScheme }: Props) => {
  return (
    <NavigationContainer
      // linking={LinkingConfiguration}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

const Stack = createStackNavigator();

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={BaseNavigator} />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
    </Stack.Navigator>
  );
}
