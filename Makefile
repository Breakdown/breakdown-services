.PHONY: run
run:
	docker compose down
	docker compose up -d
	cd app-service; cargo watch -x run