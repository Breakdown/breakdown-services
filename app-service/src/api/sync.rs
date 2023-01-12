#![allow(unused_variables)]
#![allow(non_snake_case)]
use super::ApiContext;
use crate::{
    services::{
        ai::get_bill_summary,
        sync::{sync_bills, sync_bills_and_issues, sync_cosponsors, sync_reps, sync_votes},
    },
    types::api::ResponseBody,
    types::db::BreakdownBill,
    utils::api_error::ApiError,
};

use anyhow::anyhow;
use axum::{routing::post, Extension, Json, Router};
use axum_macros::debug_handler;
use log::{log, Level};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs};

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

#[debug_handler]
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

#[derive(Serialize, Deserialize, Debug)]
struct Issue {
    name: String,
    slug: String,
    subjects: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct SubjectUrlNameMapping {
    name: String,
    url_name: String,
}
#[derive(Serialize, Deserialize, Debug)]
struct SlugifyFile {
    allSubjectsFiltered: Vec<SubjectUrlNameMapping>,
}

pub fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

pub async fn create_issues(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let config = fs::read_to_string("./scripts/data/issuesToSubjectsMap.json")?;
    let parsed: HashMap<String, Vec<String>> = serde_json::from_str(&config)?;

    let all_subjects_config = fs::read_to_string("./scripts/data/allSubjects.json")?;
    let all_subjects_parsed: SlugifyFile = serde_json::from_str(&all_subjects_config)?;

    let default_slugified = SubjectUrlNameMapping {
        name: "".to_string(),
        url_name: "".to_string(),
    };

    for (key, _) in &parsed {
        let subjects = &parsed[key];
        let mut subjects_named: Vec<String> = vec![];

        for subject_slug in subjects.iter() {
            let subject_unslugified = capitalize(subject_slug).replace("-", " ");
            let subject_named = all_subjects_parsed
                .allSubjectsFiltered
                .iter()
                .find(|subject| subject.url_name == *subject_slug)
                .unwrap_or(&default_slugified)
                .clone();
            if subject_named.name.chars().count() > 0 {
                subjects_named.push(subject_named.name.to_string());
            } else {
                if !subject_unslugified.chars().any(|c| c.is_whitespace()) {
                    subjects_named.push(subject_unslugified);
                } else {
                    log!(
                        Level::Info,
                        "Could not find subject named for slug: {}",
                        subject_slug
                    );
                    subjects_named.push(subject_unslugified);
                }
            }
        }

        let issue = Issue {
            name: key.to_string(),
            slug: key.replace(" ", "_").to_lowercase(),
            subjects: subjects_named,
        };

        let record = sqlx::query!(
            r#"INSERT INTO issues (name, slug, subjects) values ($1, $2, $3) returning id"#,
            &issue.name,
            &issue.slug,
            &issue.subjects
        )
        .fetch_one(&ctx.connection_pool)
        .await?;
    }
    println!("Created Issues");
    Ok("Created Issues")
}

async fn seed_states(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let config = fs::read_to_string("./scripts/data/stateCodes.json")?;
    let parsed: HashMap<String, String> = serde_json::from_str(&config)?;

    for (key, val) in &parsed {
        let state_code = key;
        let state_name = val;
        let record = sqlx::query!(
            r#"INSERT INTO states (name, code) values ($1, $2) returning id"#,
            &state_name,
            &state_code,
        )
        .fetch_one(&ctx.connection_pool)
        .await
        .map_err(|e| {
            return ApiError::Anyhow(anyhow!("Error upserting state"));
        });
    }

    Ok("Seeded States")
}

pub async fn get_bill_summaries(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let all_bills = sqlx::query_as!(
        BreakdownBill,
        r#"SELECT * FROM bills WHERE bill_type IS NOT NULL"#,
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    let all_bills_filtered = all_bills
        .iter()
        .filter(|bill| bill.bill_code == Some(String::from("s5134")))
        .collect::<Vec<&BreakdownBill>>();
    for bill in all_bills_filtered.iter() {
        let summary = get_bill_summary(&bill).await?;
        // Get
    }

    Ok("Seeded States")
}
