import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ColorSchemeName } from "react-native";
import useAuth from "../hooks/useAuth";
import NotFoundScreen from "../screens/NotFound";
import SignIn from "../screens/unauth/SignIn";
import SignUp from "../screens/unauth/SignUp";
import WelcomeScreen from "../screens/unauth/WelcomeScreen";
import { BaseNavigator } from "./navigator";

const Stack = createStackNavigator();

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

const AuthenticatedStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Root" component={BaseNavigator} />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
    </Stack.Navigator>
  );
};

const UnauthenticatedStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
};

function RootNavigator() {
  const { authenticated } = useAuth({ allowUnauth: true });
  return authenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />;
}
