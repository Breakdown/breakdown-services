use crate::{
    services::{propublica::propublica_get_bills_paginated, reps::save_propub_rep},
    types::propublica_api::{ProPublicaBill, ProPublicaRepsResponse},
};

use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/reps", post(reps_sync))
        .route("/bills", post(bills_sync));
    Router::new().nest("/sync", service_router)
}

async fn reps_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let reqwest_client = reqwest::Client::new();
    // Fetch reps from ProPublica
    let get_all_reps_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "house",
    );
    let get_all_senators_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "senate"
    );
    let house_response = reqwest_client
        .get(&get_all_reps_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let senate_response = reqwest_client
        .get(&get_all_senators_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let house_results = &house_response.results[0].members;
    let senate_results = &senate_response.results[0].members;

    // Save Representatives to DB
    log::info!("Syncing Representatives");
    for rep in house_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &ctx.connection_pool).await?;
    }
    // Save Senators to DB
    log::info!("Syncing Senators");
    for rep in senate_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &ctx.connection_pool).await?;
    }

    Ok("Synced All Representatives and Senators")
}

async fn bills_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    // Fetch reps from ProPublica
    // Get last 100 passed bills
    // Get last 100 enacted bills
    let introduced_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "introduced",
        500,
    )
    .await;
    let updated_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "updated",
        500,
    )
    .await;
    let active_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "active",
        100,
    )
    .await;
    let enacted_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "enacted",
        100,
    )
    .await;
    let passed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "passed",
        100,
    )
    .await;
    let vetoed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "vetoed",
        100,
    )
    .await;
    println!("introduced bills: {}", introduced_bills.len());
    println!("updated_bills: {}", updated_bills.len());
    println!("active_bills: {}", active_bills.len());
    println!("enacted_bills: {}", enacted_bills.len());
    println!("passed_bills: {}", passed_bills.len());
    println!("vetoed_bills: {}", vetoed_bills.len());
    let meta_bills: Vec<ProPublicaBill> = introduced_bills
        .into_iter()
        .chain(updated_bills.into_iter())
        .chain(active_bills.into_iter())
        .chain(enacted_bills.into_iter())
        .chain(passed_bills.into_iter())
        .chain(vetoed_bills.into_iter())
        .collect();
    println!("Total bills amount: {}", meta_bills.len());
    // Format and upsert bills to DB
    Ok("Synced All Bills")
}
