#![allow(unused_variables)]
#![allow(unused_must_use)]
#![allow(non_snake_case)]
use super::ApiContext;
use crate::{
    services::{
        bills::save_propub_bill, propublica::propublica_get_bills_paginated, reps::save_propub_rep,
    },
    types::{
        api::ResponseBody,
        db::{BreakdownBill, BreakdownIssue},
        propublica::{ProPublicaBill, ProPublicaRepsResponse},
    },
    utils::api_error::ApiError,
};
use axum::{routing::post, Extension, Json, Router};
use axum_macros::debug_handler;
use itertools::Itertools;
use log::{log, Level};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs};
use uuid::Uuid;

pub fn router() -> Router {
    let syncs_router = Router::new()
        .route("/reps", post(reps_sync))
        .route("/bills", post(bills_sync))
        .route("/relate_issues", post(associate_bills_and_issues));
    let scripts_router = Router::new()
        .route("/create_issues", post(create_issues))
        .route("/seed_states", post(seed_states));
    Router::new()
        .nest("/sync", syncs_router)
        .nest("/scripts", scripts_router)
}

async fn reps_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let reqwest_client = reqwest::Client::new();
    // Fetch reps from ProPublica
    let get_all_reps_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "house",
    );
    let get_all_senators_url = format!(
        "{}/117/{}/members.json",
        ctx.config.PROPUBLICA_BASE_URI, "senate"
    );
    let house_response = reqwest_client
        .get(&get_all_reps_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let senate_response = reqwest_client
        .get(&get_all_senators_url)
        .header("X-API-Key", &ctx.config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let house_results = &house_response.results[0].members;
    let senate_results = &senate_response.results[0].members;

    // Save Representatives to DB
    log::info!("Syncing Representatives");
    for rep in house_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &ctx.connection_pool).await?;
    }
    // Save Senators to DB
    log::info!("Syncing Senators");
    for rep in senate_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &ctx.connection_pool).await?;
    }

    Ok("Synced All Representatives and Senators")
}

async fn bills_sync(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    // Fetch reps from ProPublica
    let introduced_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "introduced",
        300,
    )
    .await;
    let updated_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "updated",
        300,
    )
    .await;
    let active_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "active",
        100,
    )
    .await;
    let enacted_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "enacted",
        100,
    )
    .await;
    let passed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "passed",
        100,
    )
    .await;
    let vetoed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "vetoed",
        20,
    )
    .await;

    let meta_bills = vec![
        introduced_bills,
        updated_bills,
        active_bills,
        enacted_bills,
        passed_bills,
        vetoed_bills,
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<ProPublicaBill>>();
    // Old concurrent way - too many requests at a time? Killing server?
    // let meta_bills = futures::future::join_all(fetch_futures)
    //     .await
    //     .into_iter()
    //     .flatten()
    //     .collect::<Vec<ProPublicaBill>>();

    // Format and upsert bills to DB
    for bill in meta_bills.iter() {
        let bill_ref = bill.clone();
        save_propub_bill(bill_ref, &ctx.connection_pool).await?;
    }

    log!(Level::Info, "Synced All Bills");

    Ok("Synced All Bills")
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

async fn create_issues(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
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
        .await?;
    }

    Ok("Seeded States")
}

#[debug_handler]
pub async fn associate_bills_and_issues(
    ctx: Extension<ApiContext>,
) -> Result<Json<ResponseBody<String>>, ApiError> {
    let mut tx = ctx.connection_pool.begin().await?;
    let all_bills = sqlx::query_as!(
        BreakdownBill,
        r#"
        SELECT * FROM bills
        "#,
    )
    .fetch_all(&ctx.connection_pool)
    .await?;
    let all_issues = sqlx::query_as!(
        BreakdownIssue,
        r#"
        SELECT * FROM issues
        "#,
    )
    .fetch_all(&ctx.connection_pool)
    .await?;

    for bill in all_bills {
        let bill_primary_subject = bill.primary_subject.unwrap_or("".to_string());
        let bill_subjects = bill.subjects.unwrap_or(vec![]);
        if (bill_primary_subject.chars().count() == 0) && (bill_subjects.len() == 0) {
            continue;
        }
        let mut associated_issue_ids: Vec<Uuid> = vec![];
        for issue in all_issues.clone() {
            let issue_subjects = issue.subjects.unwrap();
            println!("issue subjects: {:?}", issue_subjects);
            // TODO: Primary Issue ID
            if issue_subjects
                .iter()
                .any(|subject| subject == &bill_primary_subject)
            {
                println!("associated issue: {:#?}", issue.name);
                associated_issue_ids.push(issue.id);
            }
            for subject in bill_subjects.clone() {
                if issue_subjects.contains(&subject) {
                    associated_issue_ids.push(issue.id);
                }
            }
        }
        let associated_issue_ids = associated_issue_ids
            .into_iter()
            .unique()
            .collect::<Vec<Uuid>>();

        for issue_id in associated_issue_ids.into_iter() {
            println!("Associating bill {} with issue {}", bill.id, issue_id);
            sqlx::query!(
                r#"
                INSERT INTO bills_issues (bill_id, issue_id) values ($1, $2)
                "#,
                &bill.id,
                &issue_id,
            )
            .execute(&mut tx)
            .await?;
        }
    }
    tx.commit().await?;

    println!("Associated Bills and Issues");

    Ok(Json(ResponseBody {
        data: "ok".to_string(),
    }))
}
