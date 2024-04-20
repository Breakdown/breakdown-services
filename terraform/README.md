# Breakdown Terraform

## Improvements to be made

- Include WIF pieces in Terraform
- GCP Secrets for env var management

## How to use (from scratch):

- Create 2 new files in `/staging` directory:
  - `staging.tfvars`
    - Fill out with all required variables (visible in `variables.tf`)
  - `staging-sa-key.json`
    - Comes from the IAM section of GCP's console - download the Key for the service account into this directory and rename it to the filename above

### To apply changes:

- `cd terraform/staging`
- `GOOGLE_APPLICATION_CREDENTIALS=./staging-sa-key.json terraform init`
- `GOOGLE_APPLICATION_CREDENTIALS=./staging-sa-key.json terraform apply --var-file=./staging.tfvars`
