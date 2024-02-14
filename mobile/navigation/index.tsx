import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ColorSchemeName } from "react-native";
import useAuth from "../hooks/useAuth";
import Bill from "../screens/Bill";
import Home from "../screens/Home";
import Text from "../components/Text";
import NotFoundScreen from "../screens/NotFound";
import SignIn from "../screens/unauth/SignIn";
import SignUp from "../screens/unauth/SignUp";
import Welcome from "../screens/unauth/Welcome";
import Account from "../screens/Account";
import { BD_PURPLE } from "../styles";
import Onboarding from "../screens/unauth/Onboarding";
import { TextVariant } from "../components/Text";
import Issue from "../screens/Issue";
import Representative from "../screens/Representative";
import AccountIcon from "../components/AccountIcon";

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

const getTimeOfDay = () => {
  const hours = new Date().getHours();
  if (hours < 12) {
    return "morning";
  } else if (hours < 17) {
    return "afternoon";
  } else {
    return "evening";
  }
};

const HomeStack = () => {
  const firstName = "";
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: "Home",
          headerLeft: (props) => {
            return (
              <Text variant={TextVariant.SUBHEADER}>
                Good {getTimeOfDay()} {firstName || ""}
              </Text>
            );
          },
          headerRight: (props) => {
            return <AccountIcon />;
          },
          headerLeftContainerStyle: {
            paddingLeft: 8,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen name="Bill" component={Bill} />
      <Stack.Screen name="Issue" component={Issue} />
      <Stack.Screen name="Representative" component={Representative} />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Screen name={"Account"} component={Account} />
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
      initialRouteName="Welcome"
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
