use std::{collections::HashMap, fs};

use crate::{
    services::{
        bills::save_propub_bill, propublica::propublica_get_bills_paginated, reps::save_propub_rep,
    },
    types::propublica::{ProPublicaBill, ProPublicaRepsResponse},
    utils::api_error::ApiError,
};

use axum::{routing::post, Extension, Router};
use log::{log, Level};
use serde::{Deserialize, Serialize};

use super::ApiContext;

pub fn router() -> Router {
    let syncs_router = Router::new()
        .route("/reps", post(reps_sync))
        .route("/bills", post(bills_sync));
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
        500,
    );
    let updated_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "updated",
        500,
    );
    let active_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "active",
        100,
    );
    let enacted_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "enacted",
        100,
    );
    let passed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "passed",
        100,
    );
    let vetoed_bills = propublica_get_bills_paginated(
        &ctx.config.PROPUBLICA_BASE_URI,
        &ctx.config.PROPUBLICA_API_KEY,
        "both",
        "vetoed",
        100,
    );

    let fetch_futures = vec![
        introduced_bills,
        updated_bills,
        active_bills,
        enacted_bills,
        passed_bills,
        vetoed_bills,
    ];
    let meta_bills = futures::future::join_all(fetch_futures)
        .await
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaBill>>();

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

async fn create_issues(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
    let config = fs::read_to_string("./scripts/data/issuesToSubjectsMap.json")?;
    let parsed: HashMap<String, Vec<String>> = serde_json::from_str(&config)?;

    for (key, _) in &parsed {
        let subjects = &parsed[key];
        let issue = Issue {
            name: key.to_string(),
            slug: key.replace(" ", "_").to_lowercase(),
            subjects: subjects.to_vec(),
        };
        println!("{:#?}", issue);
        let record = sqlx::query!(
            r#"INSERT INTO issues (name, slug, subjects) values ($1, $2, $3) returning id"#,
            &issue.name,
            &issue.slug,
            &issue.subjects
        )
        .fetch_one(&ctx.connection_pool)
        .await?;
        println!("{:#?}", record);
    }
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
        println!("{:#?}", record);
    }

    Ok("Seeded States")
}
