#![allow(unused_variables)]
#![allow(non_snake_case)]
use envconfig::Envconfig;

// Outside of docker use this DATABASE_URL
// "postgres://postgres:postgres@localhost:5438"
#[derive(Envconfig)]
pub struct Config {
    #[envconfig(
        from = "DATABASE_URL",
        default = "postgres://postgres:postgres@localhost:5438"
    )]
    pub DATABASE_URL: String,

    #[envconfig(from = "DB_MAX_CONNECTIONS", default = "100")]
    pub DB_MAX_CONNECTIONS: String,

    #[envconfig(
        from = "HMAC_KEY",
        default = "12345678901234567890123456789012345678901234567890"
    )]
    pub HMAC_KEY: String,

    #[envconfig(
        from = "PROPUBLICA_API_KEY",
        default = "WGHe9MtCgoatFDVUF4n0a2lNO4tqRMj74QDHHtF3"
    )]
    pub PROPUBLICA_API_KEY: String,

    #[envconfig(
        from = "PROPUBLICA_BASE_URI",
        default = "https://api.propublica.org/congress/v1"
    )]
    pub PROPUBLICA_BASE_URI: String,
}
