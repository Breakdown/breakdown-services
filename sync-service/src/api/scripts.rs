use super::{error::ApiError, ApiContext};
use axum::{routing::post, Extension, Router};
use serde::{Deserialize, Serialize};
use serde_json::Map;
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
    let default = Map::new();
    let parsed: HashMap<String, Vec<String>> = serde_json::from_str(&config)?;
    // println!("{:#?}", obj);

    let mut transaction = &ctx.connection_pool.begin().await?;
    for (key, _) in &parsed {
        let subjects = &parsed[key];
        let issue = Issue {
            name: key.to_string(),
            slug: key.replace(" ", "_").to_lowercase(),
            subjects: subjects.to_vec(),
        };
        println!("{:#?}", issue);
        sqlx::query("INSERT INTO issues (name, slug, subjects) values (?, ?, ?) returning id")
            .bind(&issue.name)
            .bind(&issue.slug)
            .bind(&issue.subjects)
            .execute(&mut transaction)
            .await?;
    }

    // Format into issues and upsert

    // transaction.commit().await?;
    // TODO: Migration for issues table
    Ok("Created Issues")
    // todo!()
}
