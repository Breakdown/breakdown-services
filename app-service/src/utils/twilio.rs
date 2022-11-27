use super::api_error::ApiError;
use crate::api::ApiContext;
use axum::Extension;
use twilio_async::TwilioRequest;

pub async fn send_sms_message(
    ctx: &Extension<ApiContext>,
    to: &str,
    body: &str,
) -> Result<String, ApiError> {
    let client =
        twilio_async::Twilio::new(&ctx.config.TWILIO_ACCOUNT_ID, &ctx.config.TWILIO_AUTH_TOKEN)
            .map_err(|e| {
                ApiError::Anyhow(anyhow::anyhow!("Failed to create Twilio client: {}", e))
            })?;
    let from = &ctx.config.TWILIO_PHONE_NUMBER;
    client
        .send_msg(from, to, body)
        .run()
        .await
        .map_err(|_| ApiError::InternalError)?;
    println!("Message sent - from: {}, to: {}, body: {}", from, to, body);
    Ok("ok".to_string())
}
