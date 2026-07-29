# Makefile for Symfony 8.0 Demo (Tiptap Editor Bundle)
# Run from this directory: make up, make install, etc.

.PHONY: help up down build install shell logs test test-coverage cache-clear link-bundle update-bundle ensure-up restart

help:
	@echo "Symfony 8.0 Demo - Tiptap Editor Bundle"
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
	$(COMPOSE) up -d
	@echo "Waiting for container to be ready..."
	@sleep 5
	@echo "Installing dependencies..."
	@$(COMPOSE) exec -T -e COMPOSER_MEMORY_LIMIT=-1 php composer install --no-interaction
	@echo "Warming cache and installing assets..."
	@$(COMPOSE) exec -T php php -d memory_limit=256M bin/console cache:clear
	@$(COMPOSE) exec -T php php bin/console assets:install public
	@PORT=$$(grep "^PORT=" .env 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	[ -z "$$PORT" ] && PORT=$$(grep "^PORT=" .env.example 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	echo "Demo started at: http://localhost:$$PORT"

down:
	$(COMPOSE) down

restart: ensure-up
	$(COMPOSE) restart

build:
	$(COMPOSE) build --no-cache

ensure-up:
	@if ! $(COMPOSE) exec -T php true 2>/dev/null; then \
		echo "Starting container..."; \
		$(COMPOSE) up -d; \
		sleep 3; \
	fi

install: ensure-up
	$(COMPOSE) exec -T -e COMPOSER_MEMORY_LIMIT=-1 php composer install --no-interaction

shell: ensure-up
	$(COMPOSE) exec php sh

logs:
	$(COMPOSE) logs -f

test: ensure-up
	$(COMPOSE) exec -e APP_ENV=test php composer test

test-coverage: ensure-up
	$(COMPOSE) exec php composer test-coverage

cache-clear: ensure-up
	$(COMPOSE) exec php php bin/console cache:clear

link-bundle: ensure-up
	$(COMPOSE) exec php sh -c "rm -rf vendor/nowo-tech/tiptap-editor-bundle && ln -s /var/tiptap-editor-bundle vendor/nowo-tech/tiptap-editor-bundle && php bin/console cache:clear"
	@echo "Bundle linked to mounted source. Reload the page in the browser."

update-bundle: ensure-up
	$(COMPOSE) exec php composer update nowo-tech/tiptap-editor-bundle --no-interaction
	$(COMPOSE) exec php php bin/console cache:clear --env=dev
	@echo "Bundle updated. Reload the page in the browser."


# Prefer Compose V2; absolute docker path avoids shadowing by local docker/ when PATH has "." (REQ-MAKE-010).
DOCKER_BIN := $(shell PATH="/usr/local/bin:/usr/bin:/bin:$$PATH" command -v docker 2>/dev/null)
ifeq ($(DOCKER_BIN),)
COMPOSE ?= docker-compose
else
COMPOSE ?= $(shell $(DOCKER_BIN) compose version >/dev/null 2>&1 && echo "$(DOCKER_BIN) compose" || echo "docker-compose")
endif
SERVICE_PHP ?= php
BUNDLE_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/../..)
# Optional: monorepo helper absent on standalone GitHub Actions checkout (REQ-MAKE-009).
-include $(BUNDLE_ROOT)/../.scripts/Makefile.demo-update-deps.mk
