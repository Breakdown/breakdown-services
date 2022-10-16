# breakdown-services

## Migrations

To add a new migration:

- Add a new migration file with `.up` in the `migrations/` directory for a service
- Add another file with the same file name but `.down`, undoing whatever you did in your `.up` migration
- `docker exec -it {SERVICE_CONTAINER_ID} /bin/bash`
- `sqlx migrate run --database-url=postgres://postgres:postgres@postgres:5432`

To undo a migration:

- Make sure your `.down` file correctly undoes all of the actions in your `.up` file
- `docker exec -it {SERVICE_CONTAINER_ID} /bin/bash`
- `sqlx migrate revert --database-url=postgres://postgres:postgres@postgres:5432`

## Setup

Necessary to have a logically consistent DB:

- Run `POST /scripts/create_issues`
- Run `POST /scripts/seed_states`
- Run `POST /syncs/reps`
- Run `POST /syncs/bills`
