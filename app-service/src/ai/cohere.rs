use std::sync::Arc;

use crate::{config::Config, utils::api_error::ApiError};

const SUMMARIZATION_PROMPT_INITIAL: &str = "Write a professional and succinct summary of the following bill. It is the parsed full text a piece of legislation that is currently being debated in the House and Senate in the United States. The summary you create needs to be digestable by the average American, and needs to contain the most important consequences of passing this bill. Think 'What will happen if this bill is passed?'. Respond only with the summary, and respond in Markdown format.\n\nBill: ###\n";

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct CohereRequest {
    text: String,
    length: String,
    format: String,
    extractiveness: String,
    temperature: f32,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct CohereResponse {
    summary: String,
}

pub fn get_cohere_summary(text: &str, config: &Arc<Config>) -> Result<String, ApiError> {
    let client = reqwest::blocking::Client::new();
    let cohere_api_key = &config.COHERE_API_KEY;
    let response = client
        .post("https://api.cohere.ai/v1/summarize")
        .header("Authorization", format!("Bearer {}", cohere_api_key))
        .json(&CohereRequest {
            text: SUMMARIZATION_PROMPT_INITIAL.to_string() + text,
            length: "medium".to_string(),
            format: "paragraph".to_string(),
            extractiveness: "low".to_string(),
            temperature: 0.3,
        })
        .send()
        .expect("Failed to get response from Cohere")
        .json::<CohereResponse>()
        .expect("Failed to parse json");

    Ok(response.summary)
}
