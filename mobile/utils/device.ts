import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

export const getDeviceId = async () => {
  let uuid = uuidv4();
  let fetchUUID = await SecureStore.getItemAsync("secure_deviceid");
  //if user has already signed up prior
  if (fetchUUID) {
    uuid = fetchUUID;
  }
  await SecureStore.setItemAsync("secure_deviceid", JSON.stringify(uuid));
  return uuid;
};
