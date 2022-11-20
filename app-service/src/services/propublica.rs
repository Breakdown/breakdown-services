use crate::types::propublica::{ProPublicaBill, ProPublicaBillsResponse};
use futures::future::join_all;

const PAGE_SIZE: u32 = 20;

async fn single_propublica_request(url: &str, api_key: &str) -> Vec<ProPublicaBill> {
    let reqwest_client = reqwest::Client::new();
    println!("Fetching bills from {}", url);
    let response = reqwest_client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaBillsResponse>()
        .await
        .expect("Failed to parse json");
    println!("Fetched {} bills", response.results[0].bills.len());
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
    let request_url = format!("{}/117/{}/bills/{}.json", base_url, house, bill_type);
    let mut offset = 0;
    let mut urls = Vec::new();
    // Construct URLs for all necessary fetches
    let num_pages = total / PAGE_SIZE;
    for _ in 0..num_pages {
        let url = format!("{}?offset={}", request_url, offset);
        urls.push(url);
        offset += PAGE_SIZE;
    }

    let fetch_futures = urls
        .iter()
        .map(|url| single_propublica_request(url, api_key));

    let results = join_all(fetch_futures).await;

    let flattened_results = results
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaBill>>();
    return flattened_results;
}
