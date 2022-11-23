use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct GetBillsPagination {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Deserialize)]
pub struct GetRepsPagination {
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct ResponseBody<T> {
    pub data: T,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestState {
    pub user_id: String,
}
