# Tiptap Editor Bundle — development (Docker + pnpm + PHPUnit).
.PHONY: help up down build shell install test test-coverage coverage-php-percent cs-check cs-fix qa clean assets assets-build assets-watch test-ts ensure-up rector rector-dry phpstan igor release-check release-check-demos demo-smoke composer-sync update validate validate-translations validate-phpdoc setup-hooks twig-lint check-no-cursor-coauthor check-open-prs strip-cursor-coauthor-from-history check-twig-extra check-no-raw-html-form

COMPOSE_FILE ?= docker-compose.yml
# Prefer Compose V2 plugin (GitHub Actions / modern Docker Desktop); fall back to docker-compose V1 (REQ-MAKE-010).
COMPOSE_BIN ?= $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
COMPOSE     ?= $(COMPOSE_BIN) -f $(COMPOSE_FILE)
SERVICE_PHP ?= php

help:
	@echo "Tiptap Editor Bundle - Development Commands"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Container:"
	@echo "  up                    Start the Docker environment (build, composer + pnpm install)"
	@echo "  down                  Stop the Docker environment"
	@echo "  build                 Rebuild the Docker image (no cache)"
	@echo "  shell                 Open a shell in the PHP container"
	@echo ""
	@echo "Dependencies:"
	@echo "  install               composer install + pnpm install in the container"
	@echo ""
	@echo "Assets:"
	@echo "  assets                pnpm install + pnpm run build (src/Resources/public/tiptap-editor.js)"
	@echo ""
	@echo "Tests:"
	@echo "  test                  Run PHPUnit"
	@echo "  test-coverage         PHPUnit with coverage (fails under 100% lines)"
	@echo ""
	@echo "Quality:"
	@echo "  cs-check              PHP-CS-Fixer dry-run"
	@echo "  cs-fix                PHP-CS-Fixer fix"
	@echo "  rector                Apply Rector"
	@echo "  rector-dry            Rector dry-run"
	@echo "  phpstan               PHPStan static analysis"
	@echo "  igor                  Igor worker-state audit (REQ-CS-008)"
	@echo "  qa                    cs-check + test"
	@echo ""
	@echo "Release:"
	@echo "  release-check         Full pre-release pipeline (REQ-MAKE-002)"
	@echo "  composer-sync         composer validate --strict + align composer.lock"
	@echo ""
	@echo "Cleanup:"
	@echo "  clean                 Remove vendor, node_modules, coverage and caches"
	@echo ""
	@echo "Composer:"
	@echo "  update                composer update in the bundle container"
	@echo "  update-deps           composer update in the bundle and every demo (needs the monorepo helper, REQ-MAKE-008)"
	@echo "  validate              composer validate --strict"
	@echo ""
	@echo "Bundle-specific:"
	@echo "  assets-watch          Vite build in watch mode"
	@echo "  test-ts               Vitest with coverage over every TS module (REQ-TEST-003)"
	@echo "  validate-phpdoc       Fail when a class or public method in src/ has no PHPDoc (REQ-CS-001)"
	@echo "  validate-translations YAML syntax + key parity of NowoTiptapEditorBundle.<locale>.yaml (REQ-MAKE-004)"
	@echo "  twig-lint             Twig-CS-Fixer lint"
	@echo "  check-twig-extra      Twig extra filters/functions are required (REQ-TWIG-004)"
	@echo "  check-no-raw-html-form Fail on raw <form>/<input>/<textarea>/<select> in Twig (REQ-TWIG-005)"
	@echo "  check-open-prs        Fail on unresolved open GitHub PRs (REQ-REL-003)"
	@echo "  check-no-cursor-coauthor  Fail on Cursor co-author trailers (REQ-GIT-001)"
	@echo "  strip-cursor-coauthor-from-history  Rewrite history without Cursor trailers"
	@echo "  setup-hooks           Install git hooks (.githooks)"
	@echo ""
	@echo "Demos:"
	@echo "  release-check-demos   Demo release-check (update bundle, tests, HTTP verify)"
	@echo "  demo-smoke            Boot demo/symfony8 and expect HTTP 200 (REQ-TEST-011)"
	@echo "  make -C demo/symfony8 test-e2e | demo-screenshots   Playwright e2e / README screenshots (REQ-DEMO-013)"
	@echo "  make -C demo help     All demo targets (up/down/update-bundle/verify, see demo/README.md)"

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

# REQ-MAKE-004: YAML syntax + key parity against the en catalogue (exit 1 on any problem).
validate-translations: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) php .scripts/validate-translations.php

# REQ-CS-001: every class and public method in src/ has a PHPDoc block.
validate-phpdoc: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) php .scripts/complete-public-phpdoc.php

qa: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer qa

composer-sync: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer validate --strict
	$(COMPOSE) exec -T $(SERVICE_PHP) composer install --no-interaction --prefer-dist


check-twig-extra:
	@chmod +x .scripts/check-twig-extra.sh
	@./.scripts/check-twig-extra.sh

check-no-raw-html-form:
	@bash .scripts/check-no-raw-html-form.sh

# Run Igor worker-state audit (REQ-CS-008)
igor: ensure-up
	$(COMPOSE) exec -T php composer igor

# REQ-MAKE-002 order.
release-check: ensure-up check-no-cursor-coauthor check-open-prs check-twig-extra check-no-raw-html-form composer-sync cs-fix cs-check rector-dry phpstan validate-phpdoc igor validate-translations test-coverage release-check-demos test-ts

release-check-demos:
	@if [ -d demo ]; then $(MAKE) -C demo release-check; fi

demo-smoke:
	@$(MAKE) -C demo demo-smoke

clean:
	rm -rf vendor node_modules .phpunit.cache coverage coverage-ts .php-cs-fixer.cache coverage-php.txt coverage-ts.txt

update: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer update --no-interaction

validate: ensure-up
	$(COMPOSE) exec -T $(SERVICE_PHP) composer validate --strict



setup-hooks:
	@chmod +x .githooks/pre-commit 2>/dev/null || true
	@chmod +x .githooks/commit-msg 2>/dev/null || true
	@git config core.hooksPath .githooks
	@echo "✅ Git hooks installed (.githooks — includes commit-msg for REQ-GIT-001)."

# REQ-MAKE-008: update-deps (REQ-MAKE-008)
BUNDLE_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
# Optional: monorepo helper absent on standalone GitHub Actions checkout (REQ-MAKE-009).
-include $(BUNDLE_ROOT)/../.scripts/Makefile.update-deps.mk
check-no-cursor-coauthor:
	@chmod +x .scripts/check-no-cursor-coauthor.sh
	@./.scripts/check-no-cursor-coauthor.sh HEAD

check-open-prs:
	@chmod +x .scripts/check-open-prs.sh
	@bash .scripts/check-open-prs.sh

strip-cursor-coauthor-from-history:
	@chmod +x .scripts/strip-cursor-coauthor-from-history.sh
	@./.scripts/strip-cursor-coauthor-from-history.sh main

twig-lint: ensure-up
	@$(COMPOSE) exec -T $(SERVICE_PHP) composer twig:lint || $(COMPOSE) exec -T $(SERVICE_PHP) ./vendor/bin/twig-cs-fixer lint --config=.twig-cs-fixer.php
