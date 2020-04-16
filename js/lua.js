var Module = {
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = text;
    outputEl.appendChild(lineEl);
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = '[ERROR] ' + text;
    outputEl.appendChild(lineEl);
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

const replEl = document.getElementById('repl');
const replInputEl = document.getElementById('repl-input');
const outputEl = document.getElementById('output');

replEl.addEventListener('submit', event => {
  event.preventDefault();

  const code = replInputEl.value;

  const lineEl = document.createElement('div');
  lineEl.textContent = '>> ' + code;
  outputEl.appendChild(lineEl);

  repl(code);

  replInputEl.value = '';
  replInputEl.focus();
});

lua_listen('result', event => {
  const lineEl = document.createElement('div');
  lineEl.textContent = '=> ' + event.payload;
  outputEl.appendChild(lineEl);
});

lua_listen('error', event => {
  const lineEl = document.createElement('div');
  lineEl.textContent = 'Error: ' + event.payload;
  outputEl.appendChild(lineEl);
});

