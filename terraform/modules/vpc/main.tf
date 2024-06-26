# Create default VPC network
resource "google_compute_network" "vpc_network" {
  name = var.name
}

# Private network
resource "google_compute_network" "private_network" {
  provider = google-beta
  name     = "private-network"
}

# Private Subnet
resource "google_compute_subnetwork" "private-subnetwork" {
  name          = "private-subnet"
  ip_cidr_range = "10.10.0.0/28"
  region        = "us-central1"
  network       = google_compute_network.private_network.name
}

# Reserve global internal address range for the peering
resource "google_compute_global_address" "private_ip_address" {
  provider      = google-beta
  name          = "private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.private_network.self_link
}

# Establish VPC network peering connection using the reserved address range
resource "google_service_networking_connection" "private_vpc_connection" {
  provider                = google-beta
  network                 = google_compute_network.private_network.self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

resource "google_vpc_access_connector" "connector" {
  name = "vpc-access-conn"
  subnet {
    name = google_compute_subnetwork.private-subnetwork.name
  }
  min_instances = 2
  max_instances = var.access_connector_max_instances
  project       = var.project
  region        = var.region
}
