# Makefile for Symfony 7.0 Demo (Tiptap Editor Bundle)
# Run from this directory: make up, make install, etc.

.PHONY: help up down build install shell logs test test-coverage cache-clear link-bundle update-bundle ensure-up restart

help:
	@echo "Symfony 7.0 Demo - Tiptap Editor Bundle"
	@echo ""
	@echo "  make up             Start containers"
	@echo "  make down           Stop containers"
	@echo "  make restart        Restart containers (depends on ensure-up)"
	@echo "  make build          Build images (no cache)"
	@echo "  make install        Install dependencies (composer install in container)"
	@echo "  make shell          Open shell in PHP container"
	@echo "  make logs           Show container logs"
	@echo "  make test           Run tests"
	@echo "  make test-coverage  Run tests with coverage"
	@echo "  make cache-clear    Clear Symfony cache"
	@echo "  make link-bundle    Use bundle from /var/tiptap-editor-bundle (see demo/README.md)"
	@echo "  make update-bundle  Update nowo-tech/tiptap-editor-bundle from path repo and clear cache"
	@echo ""

up:
	@if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || true; fi
	docker-compose up -d
	@echo "Waiting for container to be ready..."
	@sleep 5
	@echo "Installing dependencies..."
	@docker-compose exec -T -e COMPOSER_MEMORY_LIMIT=-1 php composer install --no-interaction
	@echo "Warming cache and installing assets..."
	@docker-compose exec -T php php -d memory_limit=256M bin/console cache:clear
	@docker-compose exec -T php php bin/console assets:install public
	@PORT=$$(grep "^PORT=" .env 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	[ -z "$$PORT" ] && PORT=$$(grep "^PORT=" .env.example 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	echo "Demo started at: http://localhost:$$PORT"

down:
	docker-compose down

restart: ensure-up
	docker-compose restart

build:
	docker-compose build --no-cache

ensure-up:
	@if ! docker-compose exec -T php true 2>/dev/null; then \
		echo "Starting container..."; \
		docker-compose up -d; \
		sleep 3; \
	fi

install: ensure-up
	docker-compose exec -T -e COMPOSER_MEMORY_LIMIT=-1 php composer install --no-interaction

shell: ensure-up
	docker-compose exec php sh

logs:
	docker-compose logs -f

test: ensure-up
	docker-compose exec -e APP_ENV=test php composer test

test-coverage: ensure-up
	docker-compose exec php composer test-coverage

cache-clear: ensure-up
	docker-compose exec php php bin/console cache:clear

link-bundle: ensure-up
	docker-compose exec php sh -c "rm -rf vendor/nowo-tech/tiptap-editor-bundle && ln -s /var/tiptap-editor-bundle vendor/nowo-tech/tiptap-editor-bundle && php bin/console cache:clear"
	@echo "Bundle linked to mounted source. Reload the page in the browser."

update-bundle: ensure-up
	docker-compose exec php composer update nowo-tech/tiptap-editor-bundle --no-interaction
	docker-compose exec php php bin/console cache:clear --env=dev
	@echo "Bundle updated. Reload the page in the browser."


# REQ-MAKE-008: update-deps (REQ-MAKE-008)
COMPOSE     ?= docker-compose
SERVICE_PHP ?= php
BUNDLE_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)
include $(BUNDLE_ROOT)/../.scripts/Makefile.demo-update-deps.mk
