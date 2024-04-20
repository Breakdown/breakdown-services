## Import syntax:

```
GOOGLE_APPLICATION_CREDENTIALS=./staging-sa-key.json terraform import -var-file=staging.tfvars module.web.google_cloud_run_service.google_cloud_run_domain_mapping.domains us-west1/staging-382518/***.***.com
```

## Manual steps to set up

- Create GCS bucket for tfstate
