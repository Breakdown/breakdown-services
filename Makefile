.PHONY: run
run:
	docker compose down
	docker compose up -d
	cd sync-service; cargo watch -x run