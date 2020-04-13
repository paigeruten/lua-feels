var Module = {
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.log(text);
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.error(text);
  }
};

var lua_listeners = {
  opcode: []
};

function lua_listen(event_type, handler) {
  lua_listeners[event_type].push(handler);
}

function lua_emit(event) {
  lua_listeners[event.type].forEach(handler => handler(event));
}

function lua_event(event) {
  var matches;
  if (matches = event.match(/^opcode (\d+)$/)) {
    lua_emit({ type: 'opcode', payload: parseInt(matches[1]) });
  } else {
    console.error('Unexpected lua event: "' + event + '"');
  }
}

function repl(code) {
  var lua = Module.ccall("init_lua", 'number', [], []);
  Module.ccall("run_lua", 'number', ['number', 'string'], [lua, code])
    .then(() => Module.ccall("free_lua", 'void', ['number'], [lua]));
}
