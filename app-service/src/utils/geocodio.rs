use super::api_error::ApiError;
use crate::config::Config;
use envconfig::Envconfig;
use serde::{Deserialize, Serialize};

const GEOCODIO_BASE_API_URI: &str = "https://api.geocod.io/v1.7/";
#[derive(Debug, Serialize, Deserialize)]
struct GeocodioCongressionalDistrict {
    district_number: i64,
}
#[derive(Debug, Serialize, Deserialize)]
struct GeocodioFields {
    congressional_districts: Vec<GeocodioCongressionalDistrict>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeocodioAddressComponents {
    number: String,
    formatted_street: String,
    city: String,
    county: String,
    state: String,
    zip: String,
    country: String,
}
#[derive(Debug, Serialize, Deserialize)]
struct GeocodioResult {
    fields: GeocodioFields,
    formatted_address: String,
    address_components: GeocodioAddressComponents,
}
#[derive(Debug, Serialize, Deserialize)]
struct GeocodioResponse {
    results: Vec<GeocodioResult>,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct GeocodeResult {
    pub state: String,
    pub district: i64,
    pub formatted_address: String,
}
pub async fn geocode_address(address: &str, api_key: &str) -> Result<GeocodeResult, ApiError> {
    let reqwest_client = reqwest::Client::new();
    let encoded_address = urlencoding::encode(address);
    let url = format!(
        "{}geocode?q={}&fields=cd&api_key={}",
        &GEOCODIO_BASE_API_URI, encoded_address, api_key
    );
    println!("{}", url);
    let response = reqwest_client
        .get(url)
        .send()
        .await
        .expect("Failed to get response from Geocodio")
        .json::<GeocodioResponse>()
        .await
        .expect("Failed to parse json");

    let district = &response.results[0].fields.congressional_districts[0]
        .district_number
        .clone();
    let state = &response.results[0].address_components.state.clone();
    let formatted_address = &response.results[0].formatted_address.clone();

    return Ok(GeocodeResult {
        state: state.to_string(),
        district: *district,
        formatted_address: formatted_address.to_string(),
    });
}

pub async fn geocode_lat_lon(lat: &f64, lon: &f64) -> Result<GeocodeResult, ApiError> {
    let config = Config::init_from_env().unwrap();
    let reqwest_client = reqwest::Client::new();
    let url = format!(
        "{}geocode?q={},{}&fields=cd&api_key={}",
        &GEOCODIO_BASE_API_URI, lat, lon, &config.GEOCODIO_API_KEY
    );
    let response = reqwest_client
        .get(url)
        .send()
        .await
        .expect("Failed to get response from Geocodio")
        .json::<GeocodioResponse>()
        .await
        .expect("Failed to parse json");

    let district = &response.results[0].fields.congressional_districts[0]
        .district_number
        .clone();
    let state = &response.results[0].address_components.state.clone();
    let formatted_address = &response.results[0].formatted_address.clone();

    return Ok(GeocodeResult {
        state: state.to_string(),
        district: *district,
        formatted_address: formatted_address.to_string(),
    });
}
