use crate::types::propublica_api::ProPublicaBill;

pub async fn propublica_get_bills_paginated(
    base_url: &str,
    api_key: &str,
    house: &str,
    bill_type: &str,
    total: u32,
) -> Vec<ProPublicaBill> {
    let request_url = format!("{}/117/{}/bills/{}.json", base_url, house, bill_type);

    // TODO: Limit and offset
    todo!()
}
