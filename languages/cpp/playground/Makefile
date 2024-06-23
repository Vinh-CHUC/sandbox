compile-commands:
	cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON build

run: compile-commands
	cmake --build build
	./build/playground

test: compile-commands
	cmake --build build
	./build/playground_test
