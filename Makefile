.PHONY: run
run:
	docker compose down
	docker compose up -d
	cd api; cargo watch -x run