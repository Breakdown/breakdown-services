variable "project" {
  type        = string
  description = "GCP Project"
}
variable "access_connector_max_instances" {
  type        = number
  default     = 3
  description = "Maximum number of access connector instances"
}
variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP Region"
}

variable "name" {
  type        = string
  description = "VPC name"
}
