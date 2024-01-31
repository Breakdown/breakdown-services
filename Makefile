MAKEFLAGS += -j2

.PHONY: run-backend
run-backend:
	docker compose down
	docker compose up

.PHONY: run-app
run-app:
	cd mobile; npx expo start

.PHONY: run
run: run-backend run-app

.PHONY: rebuild
rebuild:
	docker compose down
	docker compose up --build