.PHONY: run-backend
run-backend:
	docker compose down
	docker compose up -d
	cd app-service; cargo watch -x run

.PHONY: run-app
run-app:
	cd mobile; npx expo start
