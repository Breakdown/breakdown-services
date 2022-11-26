use axum::{
    middleware,
    routing::{get, post},
    Extension, Json, Router,
};
use axum_sessions::extractors::ReadableSession;
use uuid::Uuid;

use crate::{
    types::{api::ResponseBody, db::User},
    utils::{api_error::ApiError, auth::create_session_auth_layer},
};

use super::ApiContext;

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/location", post(|| async { "Hello, World!" })) // TODO
        .route("/me", get(get_me))
        .route_layer(middleware::from_fn(create_session_auth_layer));
    Router::new().nest("/users", service_router)
}

pub async fn get_me(
    ctx: Extension<ApiContext>,
    session: ReadableSession,
) -> Result<Json<ResponseBody<User>>, ApiError> {
    let user_id = session.get::<Uuid>("user_id").unwrap();
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT * FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(&ctx.connection_pool)
    .await
    .unwrap();
    Ok(Json(ResponseBody { data: user }))
}
