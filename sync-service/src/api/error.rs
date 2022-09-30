use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
#[derive(thiserror::Error, Debug)]
pub enum ApiError {
    #[error("Authentication required")]
    Unauthorized,

    #[error("Forbidden: user may not perform that action")]
    Forbidden,

    #[error("Request path not found")]
    NotFound,

    #[error("Error in the request body")]
    UnprocessableEntity,

    #[error("An internal server error occurred")]
    InternalError,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, "Not Found"),
            ApiError::UnprocessableEntity => {
                (StatusCode::UNPROCESSABLE_ENTITY, "Unprocessable entity")
            }
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            ApiError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            ApiError::InternalError => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}
