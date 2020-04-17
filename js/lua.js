var Module = {
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = text;
    outputEl.appendChild(lineEl);
    jumpToBottom();
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = '[ERROR] ' + text;
    outputEl.appendChild(lineEl);
    jumpToBottom();
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
    .then(() => {
      replFormEl.classList.remove('inactive');
      replInputEl.focus();

      lua_emit({ type: 'lua', payload: 'end' });
    });
}

function jumpToBottom() {
  replEl.scrollTop = replEl.scrollHeight;
}

const replEl = document.getElementById('repl');
const replFormEl = document.getElementById('repl-form');
const replInputEl = document.getElementById('repl-input');
const outputEl = document.getElementById('output');

replFormEl.addEventListener('submit', event => {
  event.preventDefault();

  const code = replInputEl.value;

  const promptEl = document.createElement('span');
  promptEl.classList.add('prompt');
  promptEl.textContent = '>> ';

  const codeEl = document.createElement('span');
  codeEl.classList.add('code');
  codeEl.textContent = code;

  const lineEl = document.createElement('div');
  lineEl.classList.add('line');
  lineEl.appendChild(promptEl);
  lineEl.appendChild(codeEl);

  outputEl.appendChild(lineEl);
  jumpToBottom();

  replFormEl.classList.add('inactive');
  replInputEl.value = '';

  repl(code);
});

lua_listen('result', event => {
  const resultPromptEl = document.createElement('span');
  resultPromptEl.classList.add('result-prompt');
  resultPromptEl.textContent = '=> ';

  const resultEl = document.createElement('span');
  resultEl.classList.add('result');
  resultEl.textContent = event.payload;

  const lineEl = document.createElement('div');
  lineEl.classList.add('line');
  lineEl.appendChild(resultPromptEl);
  lineEl.appendChild(resultEl);

  outputEl.appendChild(lineEl);
  jumpToBottom();
});

lua_listen('error', event => {
  const errorEl = document.createElement('span');
  errorEl.classList.add('error');
  errorEl.textContent = event.payload;

  const lineEl = document.createElement('div');
  lineEl.classList.add('line');
  lineEl.appendChild(errorEl);

  outputEl.appendChild(lineEl);
  jumpToBottom();
});

