.DEFAULT_GOAL := all
projectname = openelectricity-client
bump=patch

.PHONY: format
format:
	bun run format

.PHONY: format-check
format-check:
	bun run format:check

.PHONY: install
install:
	bun install
	npm install --package-lock-only

.PHONY: release
release:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "There are uncommitted changes, please commit or stash them before running make release"; \
		exit 1; \
	fi

	# Run format check first
	bun run format:check || (echo "Prettier check failed. Running formatter..." && bun run format && git add . && git commit -m "Format code for release")

	# Bump version
	current_branch=$(shell git rev-parse --abbrev-ref HEAD)

	# if the current branch is develop then the bump level is prepatch
	if [ "$$current_branch" = "develop" ]; then \
		bump=prepatch; \
	fi

	npm version $(bump)

	# Build the project
	bun run build

	# Push only the latest version tag
	git push origin $$current_branch
	git push origin v$$(node -p "require('./package.json').version")

	npm publish