use crate::types::propublica_api::{ProPublicaBill, ProPublicaBillsResponse};
use futures::stream;
use futures::StreamExt;

const CONCURRENT_API_REQUESTS: u8 = 10;

async fn single_propublica_request<'a>(url: &'a str, api_key: &'a str) -> Vec<ProPublicaBill> {
    let reqwest_client = reqwest::Client::new();
    let response = reqwest_client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaBillsResponse>()
        .await
        .expect("Failed to parse json");
    let results = &response.results[0].bills;
    return results.to_vec();
}

pub async fn propublica_get_bills_paginated(
    base_url: &str,
    api_key: &str,
    house: &str,
    bill_type: &str,
    total: u32,
) -> Vec<ProPublicaBill> {
    let reqwest_client = reqwest::Client::new();
    let request_url = format!("{}/117/{}/bills/{}.json", base_url, house, bill_type);
    let mut offset = 0;
    let mut urls = Vec::new();
    for i in 0..total {
        let url = format!("{}?offset={}", request_url, offset);
        urls.push(url);
        offset += 20;
    }

    let fetch_futures = urls
        .iter()
        .map(|url| async move { single_propublica_request(url, api_key).await });

    let fetch_stream = stream::iter(fetch_futures).buffer_unordered(CONCURRENT_API_REQUESTS.into());
    let results = fetch_stream.collect::<Vec<Vec<ProPublicaBill>>>().await;
    let flattened_results = results
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaBill>>();
    return flattened_results;
}
