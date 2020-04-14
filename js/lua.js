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
  lua: [],
  result: [],
  error: [],
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
  } else if (matches = event.match(/^result ([\s\S]*)$/)) {
    lua_emit({ type: 'result', payload: matches[1] });
  } else if (matches = event.match(/^error ([\s\S]*)$/)) {
    lua_emit({ type: 'error', payload: matches[1] });
  } else {
    console.error('Unexpected lua event: "' + event + '"');
  }
}

var L = null;

function repl(code) {
  lua_emit({ type: 'lua', payload: 'start' });
  if (!L) {
    L = Module.ccall("init_lua", 'number', [], []);
  }
  var cont = Module.ccall("run_lua", 'number', ['number', 'string'], [L, code]);
  Promise.resolve(cont)
    .then(() => lua_emit({ type: 'lua', payload: 'end' }));
}

lua_listen('result', e => console.log("Result: " + e.payload));
lua_listen('error', e => console.log("Error: " + e.payload));
