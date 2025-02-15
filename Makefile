.DEFAULT_GOAL := all
projectname = openelectricity-client
bump=patch

.PHONY: install test test-watch lint format format-check build bump release publish

install:
	bun install
	npm install --package-lock-only

test:
	bun test

test-watch:
	bun test --watch

lint:
	bun run lint

format:
	bun run format

format-check:
	bun run format:check

build:
	bun run build

bump:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "There are uncommitted changes, please commit or stash them before running make bump"; \
		exit 1; \
	fi

	# if the current branch is develop then the bump level is prepatch
	current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" = "develop" ]; then \
		bump=prepatch; \
	fi; \
	npm version $(bump)

release: format format-check lint test bump build
	# Push changes and tags
	git push origin $$(git rev-parse --abbrev-ref HEAD)
	git push origin v$$(node -p "require('./package.json').version")

publish: release
	npm publish