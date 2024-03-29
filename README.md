# lua-feels v0

What if programs made noise as they ran, giving you a feel for what's going on inside them?

This is a spinoff of https://github.com/paileyq/feels that will let you run a Lua REPL and visualize the Lua internals as it executes your code, all within the browser (thanks to WebAssembly).

[Slides from a related presentation](noisy-programs.pdf)

## Live demo

* REPL edition: https://paigeruten.github.io/lua-feels/feels.html
* Livecoding edition: https://paigeruten.github.io/lua-feels/feels-live.html

## Usage

Pre-requisites: `emscripten`, `make` (if you aren't editing the C code, these aren't required and you can skip step 1, as the build artifacts are included in this repo)

1. `cd lua/` and run `make`.
2. Open `feels.html` in your browser (you will probably need to run a local http server).
3. Type Lua code into REPL, and see nice sights and hear nice sounds in your browser as the code executes. :D

## State of this project

It's a toy and I'm probably abandoning it for now. It's all yours. One day I'd like to create a comprehensive live visualization of all aspects of Lua's internals (parsing, codegen, VM, stack, GC, etc.) as it runs your code, but we'll see if that day comes.

