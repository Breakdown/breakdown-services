# GCP authentication file
variable "gcp_auth_file" {
  type        = string
  description = "GCP authentication file"
}
# define GCP region
variable "gcp_region" {
  type        = string
  description = "GCP region"
}
# define GCP project name
variable "gcp_project" {
  type        = string
  description = "GCP project name"
}

variable "meili_host" {
  type        = string
  description = "MeiliSearch host"
}

variable "meili_master_key" {
  type        = string
  description = "MeiliSearch master key"
}
