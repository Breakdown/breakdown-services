use std::borrow::Cow;

use openai_rs::endpoints::completion::Completion;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    services::bills::{get_house_from_bill_type, HouseEnum},
    types::db::BreakdownBill,
    utils::api_error::ApiError,
};

fn get_text_from_node(node: roxmltree::Node) -> Result<Option<String>, ApiError> {
    let mut text = String::new();
    for child in node.children() {
        match child.node_type() {
            roxmltree::NodeType::Text => {
                text.push_str(child.text().unwrap());
            }
            roxmltree::NodeType::Element => {
                let child_text = get_text_from_node(child)?;
                match child_text {
                    Some(child_text) => text.push_str(&child_text),
                    None => (),
                }
            }
            _ => (),
        }
    }
    Ok(Some(text))
}

fn get_text_from_xml(xml: String) -> Result<Option<String>, ApiError> {
    let opt = roxmltree::ParsingOptions {
        allow_dtd: true,
        ..roxmltree::ParsingOptions::default()
    };
    let doc = match roxmltree::Document::parse_with_options(&xml, opt) {
        Ok(doc) => doc,
        Err(e) => {
            println!("Error parsing xml: {}.", e);
            return Ok(None);
        }
    };
    let legis_body_element = doc
        .root_element()
        .descendants()
        .find(|n| n.has_tag_name("legis-body"));

    let text = match legis_body_element {
        Some(legis_body_element) => get_text_from_node(legis_body_element)?,
        None => return Ok(None),
    };
    Ok(text)
}

pub async fn get_text_for_bill(bill: &BreakdownBill) -> Result<Option<String>, ApiError> {
    println!("Getting XML text for bill: {:?}", bill.bill_code.as_ref());
    let bill_type = bill.bill_type.as_ref().unwrap();
    let bill_house = get_house_from_bill_type(bill_type);
    if (String::from(bill_type) != "hr".to_string()) && (String::from(bill_type) != "s".to_string())
    {
        return Ok(None);
    }
    let url_param = match bill_house {
        HouseEnum::House => "h",
        HouseEnum::Senate => "s",
        HouseEnum::Joint => return Ok(None),
        HouseEnum::Unknown => return Ok(None),
    };
    let bill_xml_url = format!(
        "https://www.congress.gov/117/bills/{}/BILLS-117{}i{}.xml",
        bill.bill_code.as_ref().unwrap(),
        bill.bill_code.as_ref().unwrap(),
        url_param
    );

    let client = reqwest::Client::new();
    let response = match client.get(&bill_xml_url).send().await {
        Ok(response) => match response.text().await {
            Ok(text) => text,
            Err(_) => return Ok(None),
        },
        Err(_) => {
            println!("Error getting xml for bill: {:?}", bill.bill_code.as_ref());
            return Ok(None);
        }
    };

    let text = get_text_from_xml(response)?;
    Ok(text)
}

pub async fn fetch_and_save_bill_full_text(
    bill: &BreakdownBill,
    db_connection: &PgPool,
) -> Result<Option<String>, ApiError> {
    match get_text_for_bill(bill).await {
        Ok(text) => {
            let existing_bill_text = sqlx::query!(
                "SELECT text FROM bill_full_texts WHERE bill_id = $1",
                bill.id
            )
            .fetch_optional(db_connection)
            .await?;
            // Update or create bill full text row
            match existing_bill_text {
                Some(_) => {
                    sqlx::query!(
                        "UPDATE bill_full_texts SET text = $1 WHERE bill_id = $2",
                        text,
                        bill.id
                    )
                    .execute(db_connection)
                    .await?;
                }
                None => {
                    sqlx::query!(
                        "INSERT INTO bill_full_texts (bill_id, text) VALUES ($1, $2)",
                        bill.id,
                        text
                    )
                    .execute(db_connection)
                    .await?;
                }
            }
            Ok(text)
        }
        Err(_) => return Ok(None),
    }
}

const CHUNK_MAX_LENGTH_CHARS: f64 = 8000.0;
const OPENAI_SUMMARIZATION_PROMPT_INITIAL: &str =
    "Write a professional and succinct summary of the following bill.\n\nBill: ###\n";

pub async fn fetch_and_save_davinci_bill_summary(
    bill_id: &Uuid,
    db_connection: &PgPool,
    client: &openai_rs::client::Client,
) -> Result<Option<String>, ApiError> {
    let full_text = sqlx::query!("SELECT * FROM bill_full_texts WHERE bill_id = $1", bill_id)
        .fetch_optional(db_connection)
        .await?;

    if let Some(full_text) = full_text {
        if full_text.initial_summary.is_some() {
            return Ok(full_text.initial_summary);
        }
        let text_chars = full_text.text.chars().collect::<Vec<char>>();
        let text_char_count = full_text.text.chars().count() as f64;
        let num_chunks = (text_char_count / CHUNK_MAX_LENGTH_CHARS).round() + 1.0;
        // let num_chunks = Integer::div_ceil(text_char_count / CHUNK_MAX_LENGTH_CHARS, 0);
        println!("Num chunks: {}", num_chunks);
        let chunks = text_chars
            .chunks(num_chunks as usize)
            .map(|chunk| chunk.iter().collect::<String>())
            .collect::<Vec<String>>();

        let mut full_completion_text = "".to_string();
        for (_, chunk) in chunks.iter().enumerate() {
            let prompt = format!(
                "{}{}\n{}",
                OPENAI_SUMMARIZATION_PROMPT_INITIAL, chunk, "###"
            );
            // Fetch summary from OpenAI
            let completion = Completion {
                prompt: Some(Cow::Borrowed(prompt.as_str())),
                temperature: 1.0,
                stop: None,
                max_tokens: 4000,
                top_p: 1.0,
                suffix: None,
                presence_penalty: 0.0,
                frequency_penalty: 0.0,
                best_of: 1,
                n: 1,
                stream: false,
                logprobs: None,
                echo: false,
                logit_bias: None,
                user: Some(Cow::Borrowed("breakdown_core")),
            };

            let response = match client
                .create(
                    Some("davinci:ft-ignite-prep-2023-01-05-05-14-39"),
                    &completion,
                )
                .await
            {
                Ok(response) => response,
                Err(e) => {
                    println!("Error getting summary from OpenAI: {}", e);
                    return Ok(None);
                }
            };
            let chunk_completion = response.completion;
            full_completion_text
                .push_str(format!("{}{}", &chunk_completion.unwrap(), "\n").as_str());
        }
        // Save completion text to DB
        sqlx::query!(
            "UPDATE bill_full_texts SET initial_summary = $1 WHERE bill_id = $2",
            full_completion_text,
            bill_id
        )
        .execute(db_connection)
        .await?;
        return Ok(Some(full_completion_text));
    } else {
        return Ok(None);
    }
}
