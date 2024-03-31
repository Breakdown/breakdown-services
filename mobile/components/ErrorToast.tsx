import { Text } from "react-native";
import Toast from "react-native-root-toast";

const ErrorToast = ({ message }: { message: string }) => {
  return (
    <Toast
      visible={true}
      position={-50}
      hideOnPress
      animation
      shadow
      duration={Toast.durations.SHORT}
      style={{
        backgroundColor: "red",
        borderRadius: 10,
        padding: 10,
      }}
    >
      <Text>{message}</Text>
    </Toast>
  );
};

export default ErrorToast;
