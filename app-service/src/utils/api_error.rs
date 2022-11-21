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

    #[error("an internal server error occurred")]
    Anyhow(#[from] anyhow::Error),

    #[error("an error occured while decoding JSON")]
    Serde(#[from] serde_json::Error),

    #[error("an error occured with the file system")]
    FS(#[from] std::io::Error),

    #[error("an error occured with the database")]
    Sqlx(#[from] sqlx::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::NotFound => (StatusCode::NOT_FOUND, String::from("Not Found")),
            ApiError::UnprocessableEntity => (
                StatusCode::UNPROCESSABLE_ENTITY,
                String::from("Unprocessable entity"),
            ),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, String::from("Unauthorized")),
            ApiError::Forbidden => (StatusCode::FORBIDDEN, String::from("Forbidden")),
            ApiError::InternalError => (
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("Internal server error"),
            ),
            ApiError::Anyhow(ref e) => {
                tracing::error!("Anyhow error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
            }
            ApiError::Serde(ref e) => {
                tracing::error!("Serde error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    String::from("An error occurred"),
                )
            }
            ApiError::FS(ref e) => {
                tracing::error!("FS error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    String::from("An error occurred"),
                )
            }
            ApiError::Sqlx(ref e) => {
                tracing::error!("sqlx error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    String::from("An error occurred"),
                )
            }
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}
