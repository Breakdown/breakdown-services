// TODO: Move this to core
#[derive(Clone, Debug)]
pub struct ApiContext {
    pub config: Arc<Config>,
    pub connection_pool: PgPool,
}
