# makefile-tier: infra
.PHONY: help install compile watch lint typecheck test package clean build dev format pre-commit quality-gate-verify

help:  ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n",$$1,$$2}'

install:  ## Install npm dependencies
	npm ci

compile:  ## Compile TypeScript
	npm run compile

watch:  ## Watch and recompile on change
	npm run watch

lint:  ## Run ESLint
	npm run lint

typecheck:  ## Type-check without emitting
	npm run typecheck

test: compile  ## Run tests via @vscode/test-electron
	npm test

package: compile  ## Package the extension as a .vsix
	npm run package

clean:  ## Remove compiled output
	rm -rf out

build: compile  ## Compile the extension (alias)

dev: watch  ## Watch and recompile on change (alias)

format: ## Auto-fix lint issues (ESLint)
	npx eslint . --fix

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

quality-gate-verify: lint typecheck compile  ## CI no-regression gate (display-free)
	@# The headless test suite (npm run coverage) runs in the main CI job, which
	@# provides xvfb. The no-regression gate job has no display, so it verifies the
	@# display-free quality signals only: lint clean, types clean, build succeeds.
	@echo "Quality gate verified: lint + typecheck + compile passed"
