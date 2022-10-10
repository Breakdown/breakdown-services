#![allow(non_snake_case)]
use super::{error::ApiError, ApiContext};
use crate::{services::reps::save_propub_rep, types::propublica_api::ProPublicaRepsResponse};
use axum::{routing::post, Extension, Router};

pub fn router() -> Router {
    let service_router = Router::new().route("/sync", post(reps_sync));
    Router::new().nest("/reps", service_router)
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
