use super::models::{
    ProPublicaBill, ProPublicaBillsResponse, ProPublicaVote, ProPublicaVotesResponse,
};
use futures::future::join_all;

const PAGE_SIZE: u32 = 20;

pub async fn single_propublica_bills_req(url: &str, api_key: &str) -> Vec<ProPublicaBill> {
    let reqwest_client = reqwest::Client::new();
    // println!("Fetching bills from {}", url);
    let response = reqwest_client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaBillsResponse>()
        .await
        .expect("Failed to parse json");
    // println!("Fetched {} bills", response.results[0].bills.len());
    let results = &response.results[0].bills;
    return results.to_vec();
}

pub async fn single_propublica_votes_req(url: &str, api_key: &str) -> Vec<ProPublicaVote> {
    let reqwest_client = reqwest::Client::new();
    // println!("Fetching votes from {}", url);
    let response = reqwest_client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await;
    let results = match response {
        Ok(response) => {
            let response = response.json::<ProPublicaVotesResponse>().await;
            let votes = match response {
                Ok(response) => {
                    let votes = response.results[0].votes.to_vec();
                    votes
                }
                Err(_) => {
                    // println!("Failed to parse json: {}", e);
                    let result: Vec<ProPublicaVote> = vec![];
                    result
                }
            };
            return votes;
        }
        Err(_) => {
            // println!("Error fetching votes for url: {}", url);
            vec![]
        }
    };

    return results;
}

pub async fn propublica_get_bills_paginated(
    base_url: &str,
    api_key: &str,
    house: &str,
    bill_type: &str,
    total: u32,
) -> Vec<ProPublicaBill> {
    let request_url = format!("{}/118/{}/bills/{}.json", base_url, house, bill_type);
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
        .map(|url| single_propublica_bills_req(url, api_key));

    let results = join_all(fetch_futures).await;

    let flattened_results = results
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaBill>>();
    log::info!("Fetched {} bills", flattened_results.len());
    log::info!("{:?}", flattened_results);
    return flattened_results;
}

pub async fn propublica_get_votes_paginated(
    base_url: &str,
    api_key: &str,
    member_id: &str,
    total: u32,
) -> Vec<ProPublicaVote> {
    let request_url = format!("{}/members/{}/votes.json", base_url, member_id);
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
        .map(|url| single_propublica_votes_req(url, api_key));

    let results = join_all(fetch_futures).await;

    let flattened_results = results
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaVote>>();
    return flattened_results;
}

pub async fn single_propublica_cosponsored_bills_req(
    url: &str,
    api_key: &str,
) -> Vec<ProPublicaBill> {
    let reqwest_client = reqwest::Client::new();
    let response = reqwest_client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await;
    let results = match response {
        Ok(response) => {
            let response = response.json::<ProPublicaBillsResponse>().await;
            let votes = match response {
                Ok(response) => {
                    let votes = response.results[0].bills.to_vec();
                    votes
                }
                Err(_) => {
                    // println!("Failed to parse json: {}", e);
                    let result: Vec<ProPublicaBill> = vec![];
                    result
                }
            };
            return votes;
        }
        Err(_) => {
            // println!("Error fetching votes for url: {}", url);
            vec![]
        }
    };

    return results;
}

pub async fn propublica_get_cosponsored_bills_paginated(
    base_url: &str,
    api_key: &str,
    member_id: &str,
    bill_type: &str,
    total: u32,
) -> Vec<ProPublicaBill> {
    let request_url = format!(
        "{}/members/{}/bills/{}.json",
        base_url, member_id, bill_type
    );
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
        .map(|url| single_propublica_cosponsored_bills_req(url, api_key));

    let results = join_all(fetch_futures).await;

    let flattened_results = results
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaBill>>();
    return flattened_results;
}
