use std::borrow::Cow;

use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    ai::models::BillFullText,
    bills::{
        models::BreakdownBill,
        service::{get_house_from_bill_type, HouseEnum},
    },
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
        "https://www.congress.gov/118/bills/{}/BILLS-118{}i{}.xml",
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

struct BillTextQueryResult {
    text: String,
}
pub async fn fetch_and_save_bill_full_text(
    bill: &BreakdownBill,
    db_connection: &PgPool,
) -> Result<Option<String>, ApiError> {
    // If bill text exists, return it
    let existing_bill_text = sqlx::query_as!(
        BillTextQueryResult,
        "SELECT text FROM bill_full_texts WHERE bill_id = $1",
        bill.id
    )
    .fetch_optional(db_connection)
    .await?;
    match existing_bill_text {
        Some(existing_bill_text) => return Ok(Some(existing_bill_text.text)),
        None => (), // continue
    };
    // If bill text does not exist, fetch it
    match get_text_for_bill(bill).await {
        Ok(text) => {
            // Update or create bill full text row
            sqlx::query!(
                "INSERT INTO bill_full_texts (bill_id, text) VALUES ($1, $2)",
                bill.id,
                text
            )
            .execute(db_connection)
            .await?;
            return Ok(text);
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
) -> Result<Option<String>, ApiError> {
    let bill_full_text = sqlx::query_as!(
        BillFullText,
        "SELECT * FROM bill_full_texts WHERE bill_id = $1",
        bill_id
    )
    .fetch_optional(db_connection)
    .await?;

    if let Some(full_text) = bill_full_text {
        if full_text.text.len() > 0 {
            return Ok(Some(full_text.text));
        }
        // Save completion text to DB
        return Ok(None);
    } else {
        return Ok(None);
    }
}
