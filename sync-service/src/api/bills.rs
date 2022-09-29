use super::ApiContext;
use axum::{http::StatusCode, routing::post, Extension, Json, Router};
use std::collections::HashMap;

pub fn router() -> Router {
    Router::new().route("/bills/sync", post(bills_sync))
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SuccessMessage {
    success: bool,
}

async fn bills_sync(ctx: Extension<ApiContext>) -> Result<Json<SuccessMessage>, reqwest::Error> {
    // Fetch bills from ProPublica
    let get_all_bills_url = format!(
        "{}{}",
        ctx.config.PROPUBLICA_BASE_URI, "/118/house/bills/introduced.json"
    );
    let response = reqwest::get(&get_all_bills_url)
        .header("X-API-Key", ctx.config.PROPUBLICA_API_KEY)
        .await?
        .json()
        .await?;
    println!("{:#?}", response);
    // Format into our format
    // Insert/Update into DB
    Ok(Json(SuccessMessage { success: true }))
}
