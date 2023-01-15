// use futures::Future;

// use super::api_error::ApiError;

// pub async fn parallelize_futures<T>(
//     futures: Vec<impl Future<Output = Vec<impl FromIterator<Vec<T>>>>>,
//     concurrency: usize,
// ) -> Vec<T> {
//     let mut this_chunk = Vec::new();
//     let mut all_results = Vec::new();
//     for future in futures {
//         this_chunk.push(future);
//         if this_chunk.len() == concurrency {
//             println!("Executing chunk");
//             let results = futures::future::join_all(this_chunk)
//                 .await
//                 .into_iter()
//                 .collect::<Vec<T>>();
//             all_results.push(results);
//             this_chunk = Vec::new();
//         }
//     }
//     println!("Executing final chunk: {} left over", this_chunk.len());
//     if this_chunk.len() > 0 {
//         let results = futures::future::join_all(this_chunk)
//             .await
//             .into_iter()
//             .collect::<Vec<Result<T, ApiError>>>();
//         all_results.push(results);
//     }
//     println!("Final results length: {}", all_results.len());
//     return all_results.into_iter().flatten().collect::<Vec<T>>();
// }
