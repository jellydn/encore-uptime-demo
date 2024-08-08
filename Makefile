.PHONY: dev
dev:
	encore run

.PHONY: test
test:
	encore test

.PHONY: deploy
deploy:
	git push encore

.PHONY: install-cli
install-cli:
	brew install encoredev/tap/encore 
