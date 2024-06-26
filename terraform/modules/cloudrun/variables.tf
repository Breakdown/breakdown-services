variable "name" {
  type        = string
  description = "Name of the service."
}

variable "image" {
  type        = string
  description = "Docker image name."
}

variable "location" {
  type        = string
  description = "Location of the service."
}

// --

variable "allow_public_access" {
  type        = bool
  default     = true
  description = "Allow unauthenticated access to the service."
}


variable "cloudsql_connections" {
  type        = set(string)
  default     = []
  description = "Cloud SQL connections to attach to container instances."
}

variable "execution_environment" {
  type        = string
  default     = "gen1"
  description = "Execution environment to run container instances under."
}

variable "concurrency" {
  type        = number
  default     = null
  description = "Maximum allowed concurrent requests per container for this revision."
}

variable "cpu_throttling" {
  type        = bool
  default     = false
  description = "Configure CPU throttling outside of request processing."
}

variable "cpus" {
  type        = number
  default     = 1
  description = "Number of CPUs to allocate per container."
}

variable "env" {
  type = list(
    object({
      key   = string,
      value = string,
    })
  )

  default     = []
  description = "Environment variables to inject into container instances."
}


variable "http2" {
  type        = bool
  default     = false
  description = "Enable use of HTTP/2 end-to-end."
}

variable "ingress" {
  type        = string
  default     = "all"
  description = "Ingress settings for the service. Allowed values: [`\"all\"`, `\"internal\"`, `\"internal-and-cloud-load-balancing\"`]"

  validation {
    error_message = "Ingress must be one of: [\"all\", \"internal\", \"internal-and-cloud-load-balancing\"]."
    condition     = contains(["all", "internal", "internal-and-cloud-load-balancing"], var.ingress)
  }
}

variable "labels" {
  type        = map(string)
  default     = {}
  description = "Labels to apply to the service."
}

variable "max_instances" {
  type        = number
  default     = 1000
  description = "Maximum number of container instances allowed to start."
}

variable "memory" {
  type        = number
  default     = 256
  description = "Memory (in Mi) to allocate to containers. Minimum of 512Mi is required when `execution_environment` is `\"gen2\"`."
}

variable "container_port" {
  type        = number
  default     = 8080
  description = "Port on which the container is listening for incoming HTTP requests."
}

variable "project" {
  type        = string
  description = "Google Cloud project in which to create resources."
}

variable "service_account_email" {
  type        = string
  default     = null
  description = "IAM service account email to assign to container instances."
}

variable "timeout" {
  type        = number
  default     = 240
  description = "Maximum duration (in seconds) allowed for responding to requests."
}

variable "vpc_access" {
  type        = object({ connector = optional(string), egress = optional(string) })
  default     = { connector = null, egress = "private-ranges-only" }
  description = "Control VPC access for the service."

  validation {
    error_message = "VPC access egress must be one of the following values: [\"all-traffic\", \"private-ranges-only\"]."
    condition     = var.vpc_access.connector == null || var.vpc_access.egress == null || contains(["all-traffic", "private-ranges-only"], coalesce(var.vpc_access.egress, "private-ranges-only"))
  }
}

# variable "healthcheck_path" {
#   type        = string
#   default     = "/healthcheck"
#   description = "Path to use for healthchecks."
# }

# variable "healthcheck_port" {
#   type        = number
#   default     = 8080
#   description = "Port to use for healthchecks."
# }

# variable "healthcheck_grpc_service" {
#   type        = string
#   default     = null
#   description = "Fully qualified name of a gRPC service to use for healthchecks."
# }

# Attempt at dynamic
variable "startup_probe_http" {
  type = list(object({
    path = string
    port = number
  }))
  default     = []
  description = "Only use this or `startup_probe_grpc`."
}

variable "liveness_probe_http" {
  type = list(object({
    path = string
    port = number
  }))
  default     = []
  description = "Only use this or `liveness_probe_grpc`."
}

# variable "startup_probe_grpc" {
#   type = list(object({
#     service = string
#   }))
#   default     = []
#   description = "Only use this or `startup_probe_http`."
# }

# variable "liveness_probe_grpc" {
#   type = list(object({
#     service = string
#   }))
#   default     = []
#   description = "Only use this or `liveness_probe_http`."
# }

variable "startup_initial_delay_seconds" {
  type        = number
  default     = 100
  description = "Number of seconds after the container has started before probes are initiated."
}

variable "liveness_initial_delay_seconds" {
  type        = number
  default     = 100
  description = "Number of seconds after the container has started before probes are initiated."
}
