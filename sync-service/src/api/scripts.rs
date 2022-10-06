use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs};

pub fn router() -> Router {
    let service_router = Router::new()
        .route("/create_issues", post(create_issues))
        .route("/seed_states", post(seed_states));
    Router::new().nest("/scripts", service_router)
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
