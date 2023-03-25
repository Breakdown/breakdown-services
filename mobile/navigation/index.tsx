import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect } from "react";
import { ColorSchemeName, Text, useColorScheme } from "react-native";
import useAuth from "../hooks/useAuth";
import Bill from "../screens/Bill";
import Home from "../screens/Home";
import NotFoundScreen from "../screens/NotFound";
import SignIn from "../screens/unauth/SignIn";
import SignUp from "../screens/unauth/SignUp";
import Welcome from "../screens/unauth/Welcome";
import { BD_PURPLE } from "../styles";
import LinkingConfiguration from "./LinkingConfiguration";
import Onboarding from "../screens/unauth/Onboarding";

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

function TabBarIcon(props) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Bill" component={Bill} />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
    </Stack.Navigator>
  );
};

const BottomTab = createBottomTabNavigator();

export const AuthenticatedStack = () => {
  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{ tabBarActiveTintColor: "#d3d3d3" }}
    >
      <BottomTab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name="ios-home"
              color={focused ? BD_PURPLE : "#D3D3D3"}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};

const horizontalAnimation = {
  gestureDirection: "horizontal",
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
};

const UnauthenticatedStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen
        name="Onboarding"
        component={Onboarding}
        options={horizontalAnimation}
      />
    </Stack.Navigator>
  );
};

function RootNavigator() {
  const { authenticated } = useAuth({ allowUnauth: true });
  return authenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />;
}
