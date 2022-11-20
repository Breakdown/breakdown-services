use crate::{api::ApiContext, utils::api_error::ApiError};
use axum::{body::Body, Extension, Json};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginRequestBody {
    pub email: String,
    pub password: String,
}

pub async fn login(
    ctx: Extension<ApiContext>,
    Json(body): Json<LoginRequestBody>,
) -> Result<Json<HashMap<String, String>>, ApiError> {
    println!("{:#?}", body);
    todo!()
}
