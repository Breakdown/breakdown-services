MAKEFLAGS += -j2

.PHONY: run-backend
run-backend:
	docker compose down
	docker compose up -d
	cd app-service-v2; RUST_LOG=tower_http=trace cargo watch -x run

.PHONY: run-app
run-app:
	cd mobile; npx expo start

.PHONY: run
run: run-backend run-app