.PHONY: build ci doc fmt fmt-check lock precommit test

build:
	@deno run --allow-env --lock=lock.json --reload mod.ts

ci:
	@make fmt-check
	@make build
	@make test

doc:
	@deno doc ./mod.ts

fmt:
	@deno fmt deps.ts mod.ts src test

fmt-check:
	@deno fmt deps.ts mod.ts src test --check

lock:
	@deno run --allow-env --lock=lock.json --lock-write --reload mod.ts
	@deno run --allow-env --allow-net --lock=test/lock.json --lock-write --reload ./test/deps.ts

precommit:
	@make fmt
	@make lock

test:
	@deno cache --lock=test/lock.json ./test/deps.ts
	@deno test --allow-env --allow-net ./test
