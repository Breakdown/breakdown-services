MAKEFLAGS += -j2

.PHONY: run-backend
run-backend:
	docker compose down
	docker compose up -d
	cd app-service; RUST_LOG=tower_http=trace cargo watch -x run

.PHONY: rebuild-backend
rebuild-backend:
	docker compose down
	docker compose up --build
	cd app-service; RUST_LOG=tower_http=trace cargo watch -x run

.PHONY: run-app
run-app:
	cd mobile; npx expo start

.PHONY: run
run: run-backend run-app

.PHONY: migrate
migrate:
	cd app-service; sqlx migrate --source=../migrations run --database-url=postgres://postgres:postgres@localhost:5438

.PHONY: rebuild
rebuild: rebuild-backend run-app
