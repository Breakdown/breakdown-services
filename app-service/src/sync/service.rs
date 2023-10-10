#![allow(unused_variables)]
#![allow(non_snake_case)]
use super::models::BillFullText;
use crate::{
    bills::{
        models::BreakdownBill,
        service::{save_propub_bill, BillAgeStatus, BillUpsertInfo},
    },
    config::Config,
    issues::models::BreakdownIssue,
    jobs::service::get_job_configuration,
    propublica::{
        models::{ProPublicaBill, ProPublicaRepsResponse, ProPublicaVote},
        service::{
            propublica_get_bills_paginated, propublica_get_cosponsored_bills_paginated,
            propublica_get_votes_paginated,
        },
    },
    reps::{models::BreakdownRep, service::save_propub_rep},
    types::api::ApiContext,
    utils::api_error::ApiError,
    votes::service::save_propub_vote,
};
use anyhow::anyhow;
use axum::Extension;
use itertools::Itertools;
use log::info;
use log::{log, Level};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres};
use std::{collections::HashMap, fs, sync::Arc};
use tokio::time::{sleep, Duration};
use uuid::Uuid;

use crate::ai::service::{fetch_and_save_bill_full_text, fetch_and_save_davinci_bill_summary};

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

pub async fn seed_states(ctx: Extension<ApiContext>) -> Result<&'static str, ApiError> {
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

    // For testing purposes
    let all_bills_filtered = all_bills
        .iter()
        .filter(|bill| bill.bill_code == Some(String::from("s5134")))
        .collect::<Vec<&BreakdownBill>>();
    for bill in all_bills.iter() {
        match fetch_and_save_bill_full_text(&bill, &ctx.connection_pool).await {
            Ok(_) => {}
            Err(e) => {
                log!(Level::Error, "Error fetching bill full text: {}", e);
            }
        }
    }

    // Send full text to OpenAI for summarization
    let openai_client: openai_rs::client::Client =
        openai_rs::openai::new(&ctx.config.OPENAI_API_KEY);
    let all_bill_texts = sqlx::query_as!(BillFullText, r#"SELECT * FROM bill_full_texts"#,)
        .fetch_all(&ctx.connection_pool)
        .await?;

    // TODO: Parallelize this
    for bill_text in all_bill_texts.iter() {
        fetch_and_save_davinci_bill_summary(
            &bill_text.bill_id.unwrap(),
            &ctx.connection_pool,
            &openai_client,
        )
        .await?;
    }
    Ok("Seeded Bill Summaries")
}

pub async fn sync_reps(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    let reqwest_client = reqwest::Client::new();
    // Fetch reps from ProPublica
    let get_all_reps_url = format!(
        "{}/118/{}/members.json",
        config.PROPUBLICA_BASE_URI, "house",
    );
    let get_all_senators_url = format!(
        "{}/118/{}/members.json",
        config.PROPUBLICA_BASE_URI, "senate"
    );
    let house_response = reqwest_client
        .get(&get_all_reps_url)
        .header("X-API-Key", &config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let senate_response = reqwest_client
        .get(&get_all_senators_url)
        .header("X-API-Key", &config.PROPUBLICA_API_KEY)
        .send()
        .await
        .expect("Failed to get response from ProPublica")
        .json::<ProPublicaRepsResponse>()
        .await
        .expect("Failed to parse json");
    let house_results = &house_response.results[0].members;
    let senate_results = &senate_response.results[0].members;

    // Save Representatives to DB
    println!("Syncing Representatives");
    for rep in house_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &connection_pool).await?;
    }
    // Save Senators to DB
    println!("Syncing Senators");
    for rep in senate_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &connection_pool).await?;
    }
    Ok(())
}

pub async fn queue_bill_updated_jobs(info: BillUpsertInfo) -> Result<(), ApiError> {
    match info.status {
        BillAgeStatus::New => {
            tokio::task::spawn(async move {
                let job_configuration = match get_job_configuration().await {
                    Ok(jc) => jc,
                    Err(e) => {
                        log!(Level::Error, "Error getting job configuration: {}", e);
                        return;
                    }
                };

                let issues_copy = sqlx::query_as!(BreakdownIssue, "SELECT * FROM issues",)
                    .fetch_all(&job_configuration.connection_pool)
                    .await
                    .expect("Failed to fetch issues");
                let info_copy = info.to_owned();
                let connection_pool_copy = &job_configuration.connection_pool;

                // Run sync bill issues
                match sync_single_bill_issues(
                    info_copy.bill.to_owned(),
                    issues_copy.to_vec(),
                    &connection_pool_copy,
                )
                .await
                {
                    Ok(_) => {}
                    Err(e) => {
                        log!(
                            Level::Error,
                            "Error syncing bill issues for bill {}: {}",
                            &info_copy.bill.to_owned().id,
                            e
                        );
                    }
                };
                connection_pool_copy.close().await;

                // Commenting out for now, will readd once in prod
                // and max connections on DB are accurate
                // Run get bill text from XML
                // match fetch_and_save_bill_full_text(
                //     &info_copy.bill.to_owned(),
                //     &connection_pool_copy,
                // )
                // .await
                // {
                //     Ok(_) => {}
                //     Err(e) => {
                //         log!(
                //             Level::Error,
                //             "Error syncing full text for bill {}: {}",
                //             &info_copy.bill.to_owned().id,
                //             e
                //         );
                //     }
                // };
                // // Get OpenAI summary for bill
                // let openai_client: openai_rs::client::Client =
                //     openai_rs::openai::new(&job_configuration.config.OPENAI_API_KEY);
                // let bill_clone = &info.bill.clone();
                // match fetch_and_save_davinci_bill_summary(
                //     &bill_clone.id,
                //     &connection_pool_copy,
                //     &openai_client,
                // )
                // .await
                // {
                //     Ok(_) => {}
                //     Err(e) => {
                //         log!(
                //             Level::Error,
                //             "Error syncing summary for bill {}: {}",
                //             &bill_clone.id,
                //             e
                //         );
                //     }
                // };
            });
            ()
        }
        BillAgeStatus::Updated => {
            // TODO: Figure out how often text changes, only trigger update if it has
        }
    }
    Ok(())
}

pub async fn sync_bills(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    println!("Syncing Bills");
    let introduced_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "introduced",
        50,
    )
    .await;
    let updated_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "updated",
        50,
    )
    .await;
    let active_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "active",
        50,
    )
    .await;
    let enacted_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "enacted",
        50,
    )
    .await;
    let passed_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "passed",
        50,
    )
    .await;
    let vetoed_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
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

    let mut bill_id_map = HashMap::new();

    info!("Bills fetched");
    info!("Bills length: {}", meta_bills.len());
    // Chunk into 20 and wait 10 seconds between each chunk
    let mut fetch_futures = vec![];
    // Format and upsert bills to DB
    for (i, bill) in meta_bills.clone().iter().enumerate() {
        let bill_ref = bill.clone();
        println!("Saving bill {} of {}", i, meta_bills.len());
        if bill_id_map.contains_key(&bill.bill_id.as_ref().unwrap().to_string()) {
            println!("Bill duplicate {}", bill.bill_id.as_ref().unwrap());
            continue;
        } else {
            let bill_info = save_propub_bill(bill_ref, &connection_pool).await?;

            fetch_futures.push(queue_bill_updated_jobs(bill_info));
            bill_id_map.insert(bill.bill_id.as_ref().unwrap().to_string(), true);
        }
        if i % 20 == 0 {
            println!("Executing queue futures");
            futures::future::join_all(fetch_futures).await;
            println!("Waiting 10 seconds");
            sleep(Duration::from_secs(10)).await;
            fetch_futures = vec![];
        }
    }
    println!("Duplicates count: {}", meta_bills.len() - bill_id_map.len());

    println!("Synced All Bills");
    Ok(())
}

pub async fn sync_votes(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    let representatives = sqlx::query!(
        r#"
      SELECT id, propublica_id
      FROM representatives
      "#,
    )
    .fetch_all(connection_pool)
    .await?;

    let mut fetch_futures = vec![];
    // let mut vote_upsert_queries = vec![];
    for rep in representatives.iter() {
        let rep_votes = propublica_get_votes_paginated(
            &config.PROPUBLICA_BASE_URI,
            &config.PROPUBLICA_API_KEY,
            &rep.propublica_id,
            20,
        );
        fetch_futures.push(rep_votes);
    }
    log!(Level::Info, "Fetching Votes in parallel");
    // Parallellize requests
    let rep_votes = futures::future::join_all(fetch_futures)
        .await
        .into_iter()
        .flatten()
        .collect::<Vec<ProPublicaVote>>();

    log!(Level::Info, "Fetched Votes, Building Saves");
    let mut vote_upsert_queries = vec![];
    log!(Level::Info, "Saving Votes");
    for (i, vote) in rep_votes.iter().enumerate() {
        let vote_ref = vote.clone();
        vote_upsert_queries.push(save_propub_vote(vote_ref, connection_pool));
        if i % 100 == 0 {
            // Parallellize saves in chunks of 100
            futures::future::join_all(vote_upsert_queries).await;
            vote_upsert_queries = vec![];
        }
    }

    Ok(())
}

pub async fn sync_single_bill_issues(
    bill: BreakdownBill,
    issues: Vec<BreakdownIssue>,
    connection_pool: &Pool<Postgres>,
) -> Result<Option<Uuid>, ApiError> {
    println!("Syncing bill issues for bill {}", bill.id);
    let bill_primary_subject = bill.primary_subject.unwrap_or("".to_string());
    let bill_subjects = bill.subjects.unwrap_or(vec![]);
    if (bill_primary_subject.chars().count() == 0) && (bill_subjects.len() == 0) {
        return Ok(Some(bill.id));
    }

    // Issues
    let mut associated_issue_ids: Vec<Uuid> = vec![];
    for issue in issues {
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
                INSERT INTO bills_issues (bill_id, issue_id) values ($1, $2) ON CONFLICT DO NOTHING
                "#,
            &bill.id,
            &issue_id,
        )
        .execute(connection_pool)
        .await?;
    }

    // Primary Issue
    if bill_primary_subject.chars().count() == 0 {
        return Ok(Some(bill.id));
    }
    let primary_issue = sqlx::query_as!(
        BreakdownIssue,
        r#"
            SELECT * FROM issues WHERE $1 = ANY(subjects)
            "#,
        &bill_primary_subject
    )
    .fetch_optional(connection_pool)
    .await?;
    if primary_issue.is_some() {
        sqlx::query!(
            r#"
                UPDATE bills SET primary_issue_id = $1 WHERE id = $2
                "#,
            &primary_issue.unwrap().id,
            &bill.id
        )
        .execute(connection_pool)
        .await?;
    }
    return Ok(Some(bill.id));
}

pub async fn sync_bills_and_issues(connection_pool: &Pool<Postgres>) -> Result<(), ApiError> {
    let all_bills = sqlx::query_as!(
        BreakdownBill,
        r#"
        SELECT * FROM bills
        "#,
    )
    .fetch_all(connection_pool)
    .await?;
    let all_issues = sqlx::query_as!(
        BreakdownIssue,
        r#"
        SELECT * FROM issues
        "#,
    )
    .fetch_all(connection_pool)
    .await?;

    info!("{}", all_bills.len());
    for bill in all_bills {
        info!("Syncing bill {}", bill.id);
        sync_single_bill_issues(bill, all_issues.clone(), connection_pool).await?;
    }
    println!("Associated Bills and Issues");

    Ok(())
}

pub async fn sync_cosponsors(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    let representatives = sqlx::query_as!(
        BreakdownRep,
        r#"
        SELECT *
        FROM representatives
        "#,
    )
    .fetch_all(connection_pool)
    .await?;

    let mut fetch_futures = vec![];
    // let mut vote_upsert_queries = vec![];
    let mut rep_ids_ordered_for_fetch_futures = vec![];
    // Introduced
    for rep in representatives.iter() {
        let rep_cosponsored_bills = propublica_get_cosponsored_bills_paginated(
            &config.PROPUBLICA_BASE_URI,
            &config.PROPUBLICA_API_KEY,
            &rep.propublica_id,
            "introduced",
            40,
        );
        rep_ids_ordered_for_fetch_futures.push(&rep.id);
        fetch_futures.push(rep_cosponsored_bills);
    }
    // Updated
    for rep in representatives.iter() {
        let rep_cosponsored_bills = propublica_get_cosponsored_bills_paginated(
            &config.PROPUBLICA_BASE_URI,
            &config.PROPUBLICA_API_KEY,
            &rep.propublica_id,
            "updated",
            40,
        );
        rep_ids_ordered_for_fetch_futures.push(&rep.id);
        fetch_futures.push(rep_cosponsored_bills);
    }

    println!("Fetching cosponsored bills for all reps");

    let results = futures::future::join_all(fetch_futures)
        .await
        .into_iter()
        .collect::<Vec<Vec<ProPublicaBill>>>();

    let mut bill_count = 0;
    println!("Saving Reps Cosponsored Bills: {}", results.len());
    for (i, result) in results.into_iter().enumerate() {
        let rep_id = rep_ids_ordered_for_fetch_futures[i];
        println!(
            "Saving Reps Cosponsored Bills: {}: {} bills",
            rep_id,
            result.len()
        );
        bill_count += result.len();
        for bill in result {
            let bill_id = bill.bill_id;
            let bill_record = sqlx::query!(
                r#"
                SELECT id
                FROM bills
                WHERE propublica_id = $1
                "#,
                bill_id
            )
            .fetch_optional(connection_pool)
            .await?;
            if let Some(bill_record) = bill_record {
                let bill_id = bill_record.id;
                match sqlx::query!(
                    r#"
                        INSERT INTO cosponsors (bill_id, rep_id) values ($1, $2)
                    "#,
                    &bill_id,
                    &rep_id
                )
                .execute(connection_pool)
                .await
                {
                    Ok(_) => {}
                    Err(e) => {
                        println!("Error inserting cosponsor: {}", e);
                    }
                }
            }
        }
    }
    println!("Saved Reps Cosponsored Bills: {}", bill_count);
    Ok(())
}
