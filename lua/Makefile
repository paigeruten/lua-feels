all: main.js

main.js: main.c lua
	emcc -Isrc main.c src/liblua.a -O2 -o main.js -s ASYNCIFY=1 -s ASSERTIONS=1 -s EXPORTED_FUNCTIONS="['_init_lua', '_free_lua', '_set_vm_delay', '_run_lua']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'

lua:
	cd src && make generic CC=emcc
