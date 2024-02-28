import dbClient from "../utils/prisma.js";
import InternalError from "../utils/errors/InternalError.js";
import axios from "axios";
import UsersService from "../users/service.js";

const GEOCODIO_BASE_API_URI = "https://api.geocod.io/v1.7/";
class LocationService {
  geocodioApiKey: string;
  constructor() {
    if (!process.env.GEOCODIO_API_KEY) {
      throw new InternalError("Missing Twilio environment variables");
    }
    this.geocodioApiKey = process.env.GEOCODIO_API_KEY;
  }

  async getDistrictAndStateFromAddress(
    address: string
  ): Promise<{ district: string; state: string; formattedAddress: string }> {
    // Call Geocodio API to get district and state
    const response = await axios.get(
      `${GEOCODIO_BASE_API_URI}geocode?q=${address}&fields=cd&api_key=${this.geocodioApiKey}`
    );
    const data = response.data;
    if (data.results.length === 0) {
      throw new InternalError("Geocodio API returned no results");
    }
    const locationData = data.results[0];
    const district =
      locationData.fields.congressional_districts[0].district_number;
    const state = locationData.address_components.state;
    const formattedAddress = locationData.formatted_address;
    return {
      district,
      state,
      formattedAddress,
    };
  }

  async getDistrictAndStateFromLatLon(
    lat: number,
    lon: number
  ): Promise<{ district: string; state: string; formattedAddress: string }> {
    // Call Geocodio API to get district and state
    const response = await axios.get(
      `${GEOCODIO_BASE_API_URI}reverse?q=${lat},${lon}&fields=cd&api_key=${this.geocodioApiKey}`
    );
    const data = response.data;
    if (data.results.length === 0) {
      throw new InternalError("Geocodio API returned no results");
    }
    const locationData = data.results[0];
    const district =
      locationData.fields.congressional_districts[0].district_number;
    const state = locationData.address_components.state;
    const formattedAddress = locationData.formatted_address;
    return {
      district,
      state,
      formattedAddress,
    };
  }

  async submitUserLocationLatLon(
    userId: string,
    lat: number,
    lon: number
  ): Promise<void> {
    // Find user district and state
    const locationData = await this.getDistrictAndStateFromLatLon(lat, lon);
    const { district, state, formattedAddress } = locationData;
    // Update user with district and state
    await dbClient.userLocationData.update({
      where: {
        userId,
      },
      data: {
        district,
        state,
        address: formattedAddress,
      },
    });
    // Update user's myReps
    const userService = new UsersService(userId);
    await userService.updateUserLocationAndReps({
      district,
      state,
      formattedAddress,
      latitude: lat,
      longitude: lon,
    });

    return;
  }

  async submitUserLocationAddress(
    userId: string,
    address: string
  ): Promise<void> {
    // Find user district and state
    const locationData = await this.getDistrictAndStateFromAddress(address);
    const { district, state, formattedAddress } = locationData;
    // Update user with district and state
    const userService = new UsersService(userId);
    await userService.updateUserLocationAndReps({
      district,
      state,
      formattedAddress,
    });

    return;
  }
}

export default LocationService;
