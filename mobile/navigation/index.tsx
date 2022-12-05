import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ColorSchemeName, useColorScheme } from "react-native";
import useAuth from "../hooks/useAuth";
import Feed from "../screens/Feed";
import NotFoundScreen from "../screens/NotFound";
import SignIn from "../screens/unauth/SignIn";
import SignUp from "../screens/unauth/SignUp";
import WelcomeScreen from "../screens/unauth/WelcomeScreen";
import { BD_PURPLE } from "../styles";

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

const FirstTabStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Feed" component={Feed} />
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
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Feed"
      screenOptions={{ tabBarActiveTintColor: "#d3d3d3" }}
    >
      <BottomTab.Screen
        name="Feed"
        component={FirstTabStack}
        options={{
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
