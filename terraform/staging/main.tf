# Enable necessary management APIs
resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = true
}
resource "google_project_service" "vpcaccess-api" {
  project = var.gcp_project
  service = "vpcaccess.googleapis.com"
}
resource "google_project_service" "sqladmin-api" {
  project = var.gcp_project
  service = "sqladmin.googleapis.com"
}


# VPC Network

module "vpc" {
  source                         = "../modules/vpc"
  project                        = var.gcp_project
  name                           = "staging"
  region                         = "us-central1"
  access_connector_max_instances = 3
}

# Cloud SQL DB

module "sql_db" {
  source               = "../modules/sql"
  project              = var.gcp_project
  db_name              = "core"
  region               = "us-central1"
  db_tier              = "db-g1-small"
  disk_size            = 100
  backups_enabled      = true
  private_network_link = module.vpc.private_network_link
  max_connections      = 1000

  depends_on = [module.vpc]
}

# Artifact Registry

# Backend
module "app_service_staging_ar_repo" {
  source  = "../modules/ar_repo"
  project = var.gcp_project
  repo_id = "app-service-staging"
}

# Cloud Run

# Backend
module "app-service" {
  name     = "app-service"
  location = "us-central1"

  source = "../modules/cloudrun"

  image = "us-central1-docker.pkg.dev/${var.gcp_project}/app-service-staging/app-service:latest"

  # Optional parameters
  allow_public_access = true
  cloudsql_connections = [
    module.sql_db.connection_name
  ]
  concurrency = 200
  cpus        = 1
  env = [
    {
      key   = "DATABASE_URL"
      value = "postgres://postgres:${module.sql_db.db_user_password}@${module.sql_db.private_ip_address}:5432/postgres"
    },
    {
      key   = "NODE_ENV"
      value = "staging"
    },
    {
      key   = "MEILI_HOST",
      value = var.meili_host
    },
    {
      key   = "MEILI_MASTER_KEY",
      value = var.meili_master_key
    },

  ]
  execution_environment          = "gen1"
  http2                          = false
  max_instances                  = 50
  memory                         = 512
  container_port                 = 8080
  startup_initial_delay_seconds  = 30
  liveness_initial_delay_seconds = 30
  project                        = var.gcp_project
  vpc_access                     = { connector = module.vpc.connector_id, egress = "private-ranges-only" }
  startup_probe_http = [{
    port = 8080
    path = "/healthcheck"
  }]
  liveness_probe_http = [{
    port = 8080
    path = "/healthcheck"
  }]

  depends_on = [module.vpc, module.sql_db, module.app_service_staging_ar_repo]
}
