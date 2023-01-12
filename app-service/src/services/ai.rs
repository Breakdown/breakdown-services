use crate::{
    services::bills::{get_house_from_bill_type, HouseEnum},
    types::db::BreakdownBill,
    utils::api_error::ApiError,
};
use reqwest::multipart::{self, Form};
use std::{collections::HashMap, io::Read};
fn process_pdf_text(text: String) -> String {
    str::replace(&text, "\n", "")
}

pub async fn get_pdf_text_for_bill(bill: &BreakdownBill) -> Result<Option<String>, ApiError> {
    println!("Getting PDF text for bill: {:?}", bill.bill_code.as_ref());
    let bill_type = bill.bill_type.as_ref().unwrap();
    let bill_house = get_house_from_bill_type(bill_type);
    if String::from(bill_type) != "hr".to_string() && String::from(bill_type) != "s".to_string() {
        return Ok(None);
    }
    let url_param = match bill_house {
        HouseEnum::House => "h",
        HouseEnum::Senate => "s",
        HouseEnum::Joint => return Ok(None),
        HouseEnum::Unknown => return Ok(None),
    };
    let bill_pdf_url = format!(
        "https://www.congress.gov/117/bills/{}/BILLS-117{}i{}.pdf",
        bill.bill_code.as_ref().unwrap(),
        bill.bill_code.as_ref().unwrap(),
        url_param
    );
    // Request the PDF file from congress.gov
    let pdf_response = reqwest::get(&bill_pdf_url).await;
    // If it doesn't exist, return none
    if pdf_response.is_err() {
        println!("Error getting PDF for bill: {:?}", bill.bill_code.as_ref());
        return Ok(None);
    }
    println!("Got PDF for bill: {:?}", bill.bill_code.as_ref());
    // If it does exist, write it to the tmp file directory
    let file_path = format!("/tmp/bill_pdfs/{}.pdf", bill.bill_code.as_ref().unwrap());
    // Create the directory
    match std::fs::create_dir_all("/tmp/bill_pdfs") {
        Ok(_) => {}
        Err(e) => {
            println!("Error creating temp directory: {:?}", e);
            return Ok(None);
        }
    }
    // Clear the way
    match std::fs::remove_file(&file_path) {
        Ok(_) => {
            println!("Deleted temp file");
        }
        Err(e) => {
            println!("Error deleting temp file: {:?}", e);
        }
    }
    println!("Writing PDF to file: {:?}", file_path);
    let mut file = std::fs::File::create(&file_path).expect("Unable to create file");
    let response = match pdf_response.unwrap().bytes().await {
        Ok(res) => res,
        Err(e) => {
            println!("Error converting response to bytes: {:?}", e);
            return Ok(None);
        }
    };

    match std::io::copy(&mut response.as_ref(), &mut file) {
        Ok(_) => {}
        Err(e) => {
            println!("Error writing PDF to file: {:?}", e);
            return Ok(None);
        }
    }

    println!("Wrote PDF to file: {:?}", file_path);
    // Convertapi.com the PDF file to text

    let client = reqwest::Client::new();
    println!("Sending to ConvertAPI: {:?}", file_path);
    let api_url = "https://v2.convertapi.com/convert/pdf/to/txt?Secret=k2dQ8q5kW2cZu7gr";

    let new_fp_str = String::from(file_path.as_str());
    let file = std::fs::read(&file_path).unwrap();
    let file_part = reqwest::multipart::Part::bytes(file)
        .file_name(new_fp_str)
        .mime_str("application/pdf")
        .unwrap();
    let form = reqwest::multipart::Form::new()
        .text("StoreFile", "true")
        .part("File", file_part);

    let request = client.post(api_url).multipart(form);
    println!("request: {:#?}", request);
    let response = match request.send().await {
        Ok(res) => res.json().await.unwrap_or("no message".to_string()),
        Err(_) => "{\"error\":400}".to_string(),
    };

    println!("Got response from ConvertAPI: {:#?}", response);

    // let file_contents = fs::read("/path/to/s5134.pdf").await.unwrap();
    // let file_part =
    //     multipart::Part::stream(std::io::Cursor::new(file_contents)).file_name("s5134.pdf");
    // let store_file_part = Part::text("StoreFile".into(), "true".into());

    // let form = Form::new().part(file_part).part(store_file_part);

    // let form = Form::new().part(file_part).part(store_file_part);

    // let resp = client.post(url).multipart(form).send().await.unwrap();

    // Read in file content
    // let reader = tokio::fs::File::open(&file_path).await?;
    // let part = reqwest::multipart::Part::stream(reader).file_name(&file_path);
    // let file = std::fs::File::open(&file_path).unwrap();
    // let mut file_data = Vec::new();
    // let content = file.read_to_end(&mut file_data);
    // let part = Part::bytes(content).file_name("file_name");

    // match block_on(async {
    //     let client = reqwest::blocking::Client::new();
    //     let form = multipart::Form::new()
    //         .text("StoreFile", "true")
    //         .file("File", &file_path)
    //         .unwrap();

    //     let response = match unblock(move || client.post(api_url).multipart(form).send()).await {
    //         Ok(res) => res,
    //         Err(e) => {
    //             println!("Error sending to ConvertAPI: {:?}", e);
    //             return Ok(None);
    //         }
    //     };
    //     println!("{:#?}", response);
    //     // Ok(Some(contents))
    //     io::Result::Ok(Some(response))
    // }) {
    //     Ok(res) => {
    //         println!("Got response from ConvertAPI: {:?}", res);
    //     }
    //     Err(e) => {
    //         println!("Error getting response from ConvertAPI");
    //         return Ok(None);
    //     }
    // };

    // println!("Response: {:#?}", dbg!(response));

    todo!()

    // match pdf_extract::extract_text(&file_path) {
    //     Ok(text) => {
    //         let processed_text = process_pdf_text(text);
    //         return Ok(Some(processed_text));
    //     }
    //     Err(e) => {
    //         println!(
    //             "Error getting text for bill {:?}: {:#?}",
    //             bill.bill_code.as_ref(),
    //             e
    //         );
    //         return Ok(None);
    //     }
    // }
}

pub async fn get_bill_summary(bill: &BreakdownBill) -> Result<Option<String>, ApiError> {
    let pdf_text = get_pdf_text_for_bill(bill).await?;

    println!("PDF_TEXT {:?}", pdf_text);

    // Get summary from OpenAI

    match pdf_text {
        Some(text) => Ok(Some(text)),
        None => Ok(None),
    }
}
