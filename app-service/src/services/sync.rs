use crate::{
    config::Config,
    services::{
        bills::save_propub_bill,
        propublica::{
            propublica_get_bills_paginated, propublica_get_cosponsored_bills_paginated,
            propublica_get_votes_paginated,
        },
        reps::save_propub_rep,
        votes::save_propub_vote,
    },
    types::db::{BreakdownBill, BreakdownIssue, BreakdownRep},
    types::propublica::{ProPublicaBill, ProPublicaRepsResponse, ProPublicaVote},
    utils::api_error::ApiError,
};
use itertools::Itertools;
use log::{log, Level};
use sqlx::{Pool, Postgres};
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

pub async fn sync_reps(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    let reqwest_client = reqwest::Client::new();
    // Fetch reps from ProPublica
    let get_all_reps_url = format!(
        "{}/117/{}/members.json",
        config.PROPUBLICA_BASE_URI, "house",
    );
    let get_all_senators_url = format!(
        "{}/117/{}/members.json",
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
    log::info!("Syncing Representatives");
    for rep in house_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &connection_pool).await?;
    }
    // Save Senators to DB
    log::info!("Syncing Senators");
    for rep in senate_results.iter() {
        let rep_ref = rep.clone();
        save_propub_rep(rep_ref, &connection_pool).await?;
    }
    Ok(())
}

pub async fn sync_bills(
    connection_pool: &Pool<Postgres>,
    config: &Arc<Config>,
) -> Result<(), ApiError> {
    let introduced_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "introduced",
        600,
    )
    .await;
    let updated_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "updated",
        600,
    )
    .await;
    let active_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "active",
        200,
    )
    .await;
    let enacted_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "enacted",
        200,
    )
    .await;
    let passed_bills = propublica_get_bills_paginated(
        &config.PROPUBLICA_BASE_URI,
        &config.PROPUBLICA_API_KEY,
        "both",
        "passed",
        100,
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

    // Format and upsert bills to DB
    for (i, bill) in meta_bills.clone().iter().enumerate() {
        let bill_ref = bill.clone();
        println!("Saving bill {} of {}", i, meta_bills.len());
        if bill_id_map.contains_key(&bill.bill_id.as_ref().unwrap().to_string()) {
            println!("Bill duplicate {}", bill.bill_id.as_ref().unwrap());
            continue;
        } else {
            save_propub_bill(bill_ref, &connection_pool).await?;
            bill_id_map.insert(bill.bill_id.as_ref().unwrap().to_string(), true);
        }
    }
    println!("Duplicates count: {}", meta_bills.len() - bill_id_map.len());

    log!(Level::Info, "Synced All Bills");
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

pub async fn sync_bills_and_issues(connection_pool: &Pool<Postgres>) -> Result<(), ApiError> {
    let mut tx = connection_pool.begin().await?;
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
