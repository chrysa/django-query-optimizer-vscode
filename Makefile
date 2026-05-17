.PHONY: help install compile watch lint typecheck test package clean

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
