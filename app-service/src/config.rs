#![allow(unused_variables)]
#![allow(non_snake_case)]
use envconfig::Envconfig;

// Outside of docker use this DATABASE_URL
// "postgres://postgres:postgres@localhost:5438"
#[derive(Envconfig, Clone)]
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

    #[envconfig(
        from = "SESSION_SECRET",
        default = "123456789012345678901234567890123456789012345678901234567890"
    )]
    pub SESSION_SECRET: String,

    #[envconfig(from = "REDIS_HOST", default = "localhost")]
    pub REDIS_HOST: String,

    #[envconfig(from = "REDIS_PASSWORD", default = "password_to_redis")]
    pub REDIS_PASSWORD: String,

    #[envconfig(from = "REDIS_PORT", default = "6378")]
    pub REDIS_PORT: String,
}
