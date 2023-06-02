all: main.js

main.js: main.c lua
	emcc -Isrc main.c src/liblua.a -O2 -o main.js -s ASYNCIFY=1 -s ASSERTIONS=1 -s EXPORTED_FUNCTIONS="['_init_lua', '_free_lua', '_run_lua']" -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'

lua:
	cd src && make a CC=emcc

clean:
	rm -f main.js main.wasm
	cd src && make clean
