use super::service::{
    create_issues, get_bill_summaries, seed_states, sync_bills, sync_bills_and_issues,
    sync_cosponsors, sync_reps, sync_votes,
};
use crate::{
    types::api::{ApiContext, ResponseBody},
    utils::api_error::ApiError,
};

use axum::{routing::post, Extension, Json, Router};

pub fn router() -> Router {
    let syncs_router = Router::new()
        .route("/reps", post(reps_sync))
        .route("/bills", post(bills_sync))
        .route("/associate_bills_issues", post(associate_bills_and_issues))
        .route("/votes", post(votes_sync))
        .route("/cosponsors", post(cosponsors_sync))
        .route("/summaries", post(get_bill_summaries));
    let scripts_router = Router::new()
        .route("/create_issues", post(create_issues))
        .route("/seed_states", post(seed_states));
    Router::new()
        .nest("/sync", syncs_router)
        .nest("/scripts", scripts_router)
}

pub async fn reps_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    sync_reps(&ctx.connection_pool, &ctx.config).await?;
    Ok("Synced All Representatives and Senators")
}

pub async fn bills_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    // Fetch reps from ProPublica
    sync_bills(&ctx.connection_pool, &ctx.config).await?;
    Ok("Synced All Bills")
}

pub async fn votes_sync(ctx: Extension<ApiContext>) -> Result<String, ApiError> {
    sync_votes(&ctx.connection_pool, &ctx.config).await?;

    Ok("Synced All Votes".to_string())
}

pub async fn associate_bills_and_issues(
    ctx: Extension<ApiContext>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    sync_bills_and_issues(&ctx.connection_pool).await?;

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}

pub async fn cosponsors_sync(ctx: Extension<ApiContext>) -> Result<String, ApiError> {
    sync_cosponsors(&ctx.connection_pool, &ctx.config).await?;

    Ok("Synced All Cosponsored bills".to_string())
}
