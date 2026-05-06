# Tiptap Editor Bundle — development (Docker + pnpm + PHPUnit).
.PHONY: help up down build shell install test test-coverage coverage-php-percent cs-check cs-fix qa clean assets assets-build assets-watch test-ts ensure-up rector rector-dry phpstan release-check release-check-demos composer-sync update validate validate-translations

COMPOSE_FILE ?= docker-compose.yml
COMPOSE     ?= docker-compose -f $(COMPOSE_FILE)
SERVICE_PHP ?= php

help:
	@echo "Tiptap Editor Bundle - Development"
	@echo "  up / down / build / shell / install"
	@echo "  assets (pnpm install + build)  |  test-ts  |  test  |  test-coverage"
	@echo "  qa  |  release-check  |  make -C demo/symfony7|symfony8"
	@echo "  Demos: make -C demo (see demo/README.md)"

build:
	$(COMPOSE) build --no-cache

up:
	$(COMPOSE) build
	$(COMPOSE) up -d
	@sleep 3
	$(COMPOSE) exec -T $(SERVICE_PHP) composer install --no-interaction
	$(COMPOSE) exec -T -e CI=true $(SERVICE_PHP) pnpm install
	@echo "Container ready."

down:
	$(COMPOSE) down

ensure-up:
	@if ! $(COMPOSE) exec -T $(SERVICE_PHP) true 2>/dev/null; then \
		$(COMPOSE) up -d; sleep 3; \
		$(COMPOSE) exec -T $(SERVICE_PHP) composer install --no-interaction; \
		$(COMPOSE) exec -T -e CI=true $(SERVICE_PHP) pnpm install; \
	fi

shell:
	$(COMPOSE) exec $(SERVICE_PHP) sh

install: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer install
	$(COMPOSE) exec -T -e CI=true $(SERVICE_PHP) pnpm install

assets: ensure-up
	$(COMPOSE) exec -T -e CI=true $(SERVICE_PHP) pnpm install
	$(COMPOSE) exec -T $(SERVICE_PHP) pnpm run build
	@echo "Assets: src/Resources/public/tiptap-editor.js"

assets-build: assets

assets-watch: ensure-up
	$(COMPOSE) exec $(SERVICE_PHP) pnpm run watch

test-ts: ensure-up
	$(COMPOSE) exec -T -e CI=true $(SERVICE_PHP) pnpm install --no-frozen-lockfile 2>/dev/null || true
	$(COMPOSE) exec -T $(SERVICE_PHP) pnpm run test:coverage | tee coverage-ts.txt
	sh .scripts/ts-coverage-percent.sh coverage-ts.txt
assets-test: test-ts

test: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer install --no-interaction
	$(COMPOSE) exec $(SERVICE_PHP) composer test

test-coverage: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer install --no-interaction
	$(COMPOSE) exec $(SERVICE_PHP) composer test-coverage | tee coverage-php.txt
	sh .scripts/php-coverage-percent.sh coverage-php.txt

cs-check: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer cs-check

cs-fix: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer cs-fix

rector: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer rector

rector-dry: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer rector-dry

phpstan: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer phpstan

validate-translations: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) php -r 'require "vendor/autoload.php"; foreach (glob("src/Resources/translations/*.yaml") as $$f) { Symfony\Component\Yaml\Yaml::parseFile($$f); } echo "OK\n";'

qa: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer qa

composer-sync: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer validate --strict
	$(COMPOSE) exec -T $(SERVICE_PHP) composer update --lock --no-install --no-interaction

release-check: ensure-up composer-sync cs-fix cs-check rector-dry phpstan test-coverage test-ts release-check-demos

release-check-demos:
	@if [ -d demo ]; then $(MAKE) -C demo release-check; fi

clean:
	rm -rf vendor node_modules .phpunit.cache coverage .php-cs-fixer.cache coverage-php.txt coverage-ts.txt

update: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer update --no-interaction

validate: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer validate --strict
