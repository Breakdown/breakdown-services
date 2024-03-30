import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ColorSchemeName } from "react-native";
import LinkingConfiguration from "./LinkingConfiguration";
import useAuth from "../hooks/useAuth";
import WelcomeScreen from "../screens/Welcome";
import SignInScreen from "../screens/SignIn";
import SignUpScreen from "../screens/SignUp";
import HomeScreen from "../screens/Home";
import BillScreen from "../screens/Bill";
import RepresentativeScreen from "../screens/Representative";
import IssueScreen from "../screens/Issue";

const Stack = createNativeStackNavigator();

const UnauthenticatedStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

export const AuthenticatedStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Bill" component={BillScreen} />
      <Stack.Screen name="Representative" component={RepresentativeScreen} />
      <Stack.Screen name="Issue" component={IssueScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { authenticated } = useAuth({ allowUnauth: true });
  // return <UnauthenticatedStack />;
  return authenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />;
};

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
