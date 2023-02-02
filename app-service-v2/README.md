#### Generating entities:

```bash
~/app-service/ $ sea-orm-cli generate entity -u=postgres://postgres:postgres@localhost:5438/postgres -o entity/src --lib --ignore-tables=_sqlx_migrations --with-serde=both --max-connections=100
```

- This will create the necessary files for SeaOrm to use in `app-service/entity`
