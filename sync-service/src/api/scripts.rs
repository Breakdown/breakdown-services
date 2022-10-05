use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs};

pub fn router() -> Router {
    let service_router = Router::new().route("/create_issues", post(create_issues));
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
