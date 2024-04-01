import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Welcome: undefined;
  Bill: { billId: string };
  Representative: { repId: string };
  Issue: { issueId: string };
};

export type SignUpScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SignUp"
>;

export type SignInScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SignIn"
>;

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Home"
>;

export type BillScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Bill"
>;

export type RepresentativeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Representative"
>;

export type IssueScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Issue"
>;

export type WelcomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Welcome"
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
