.PHONY: build
build:
	idris2 main.idr -o main

check:
	idris2 --check main.idr && echo "OK"

run: build
	./build/exec/main

repl:
	idris2 main.idr
