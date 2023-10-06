import BottomSheet from "@gorhom/bottom-sheet";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, View } from "react-native";
import Text, { TextVariant } from "./Text";
import * as Location from "expo-location";
import Button, { ButtonType } from "./Button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { submitLocationAddress, submitLocationLatLon } from "../data/mutations";
import useAuth from "../hooks/useAuth";
import TextInput from "./TextInput";
import Divider from "./Divider";
import { QUERY_GET_YOUR_REPS, getYourReps } from "../data/queries";

const LocationBottomSheet = () => {
  const { refetch, user } = useAuth();
  const snapPoints = useMemo(() => ["25%", "96%"], []);
  const sheetRef = useRef<BottomSheet>(null);
  const [location, setLocation] = useState(null);
  const userRepsQuery = useQuery({
    queryKey: [QUERY_GET_YOUR_REPS, user?.id],
    queryFn: getYourReps,
  });
  const postLocationLatLonMutation = useMutation({
    mutationFn: submitLocationLatLon,
  });
  const postLocationAddressMutation = useMutation({
    mutationFn: submitLocationAddress,
  });
  const onClickAllowLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    await postLocationLatLonMutation.mutateAsync({
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    });
    refetch();
    userRepsQuery.refetch();
  };
  const [address, setAddress] = useState<string>(null);
  const onClickSubmitAddress = async () => {
    await postLocationAddressMutation.mutateAsync({
      address,
    });
    refetch();
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      style={styles.sheetContainer}
    >
      <Text variant={TextVariant.HEADER} style={styles.header}>
        Location, location, location!
      </Text>
      <Text variant={TextVariant.SUBHEADER} style={styles.subheader}>
        Where you live determines who represents you.
      </Text>
      <Text variant={TextVariant.HEADER_DETAIL} style={styles.paragraph}>
        Please allow us to use your current location (assuming you're in your
        home district) by clicking below, or enter your address, so we can find
        and track all of your federal representatives for you!
      </Text>
      <Button
        type={ButtonType.Default}
        onPress={onClickAllowLocation}
        title={"Allow Location"}
      />
      <Divider label={"OR"} />
      {/* TODO: Fix this up - still kinda messy */}
      <KeyboardAvoidingView>
        <Text variant={TextVariant.SUBHEADER} style={styles.subheader}>
          Enter your home address below
        </Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          textContentType={"fullStreetAddress"}
          placeholder={"12345 Main St, City, State, Zip"}
        />
        <Button
          type={ButtonType.Default}
          onPress={onClickSubmitAddress}
          title={"Submit Address"}
        />
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  subheader: { marginBottom: 16 },
  paragraph: {
    marginBottom: 32,
  },
  sheetContainer: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    shadowColor: "#d3d3d3",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  button: {
    // marginTop: 8,
  },
});

export default LocationBottomSheet;
