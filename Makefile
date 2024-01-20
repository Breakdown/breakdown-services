MAKEFLAGS += -j2

.PHONY: run-backend
run-docker:
	docker compose down
	docker compose up -d

.PHONY: run-app-service
run-app-service:
	cd app-service; RUST_LOG=tower_http=trace cargo watch -x run

.PHONY: run-job-service
run-job-service:
	cd job-service; yarn dev

.PHONY: run-app
run-app:
	cd mobile; npx expo start

.PHONY: run
run: run-backend run-job-service run-app