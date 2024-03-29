# breakdown-services

## To view Rust version of app-service:

Check out [this commit](https://github.com/Breakdown/breakdown-services/tree/de6c2596133b0d2589acfb8b16f8988cf5f7fca0)

## Migrations

To add a new migration:

- Add a new migration file with `.up` in the `migrations/` directory for a service
- Add another file with the same file name but `.down`, undoing whatever you did in your `.up` migration
- `sqlx migrate run --database-url=postgres://postgres:postgres@localhost:5438`

To undo a migration:

- Make sure your `.down` file correctly undoes all of the actions in your `.up` file
- `sqlx migrate revert --database-url=postgres://postgres:postgres@localhost:5438`

## app-service Setup

Necessary to have a logically consistent DB:

- Run `POST /scripts/create_issues`
- Run `POST /scripts/seed_states`
- Run `POST /sync/reps`
- Run `POST /sync/bills`
- Run `POST /sync/votes`
- Run `POST /sync/cosponsors`
- Run `POST /sync/associate_bills_issues`

## mobile Setup

#### Creating API Response Types

- `~/breakdown-services$ typeshare-cli ./app-service --lang=typescript --output-file=mobile/types/api.ts`
- Note: You will have to run `cargo install typeshare-cli` before running this command

## Running mobile and app-service

- `~/breakdown-services$ make run`
