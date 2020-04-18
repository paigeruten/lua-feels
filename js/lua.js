var Module = {
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = text;
    outputEl.appendChild(document.createElement('br'));
    outputEl.appendChild(lineEl);
    jumpToBottom();
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.textContent = '[ERROR] ' + text;
    outputEl.appendChild(document.createElement('br'));
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
  var cont = Module.ccall("run_lua", 'number', ['number', 'string'], [L, code], { async: true });
  Promise.resolve(cont)
    .then(() => {
      replFormEl.classList.remove('inactive');
      replInputEl.focus();

      lua_emit({ type: 'lua', payload: 'end' });
    });
}

var speed = 100;
function setSpeed(milliseconds) {
  speed = milliseconds;
  Module.ccall("set_vm_delay", 'void', ['number'], [speed]);
}

function jumpToBottom() {
  replEl.scrollTop = replEl.scrollHeight;
}

const replEl = document.getElementById('repl');
const replFormEl = document.getElementById('repl-form');
const replInputEl = document.getElementById('repl-input');
const outputEl = document.getElementById('output');

replEl.addEventListener('mousedown', event => {
  if (event.target === replEl || event.target === outputEl) {
    setTimeout(() => replInputEl.focus(), 0);
  }
});

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

  outputEl.appendChild(document.createElement('br'));
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

  outputEl.appendChild(document.createElement('br'));
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

  outputEl.appendChild(document.createElement('br'));
  outputEl.appendChild(lineEl);
  jumpToBottom();
});

// https://stackoverflow.com/a/37623959
function onRangeChange(r,f) {
  var n,c,m;
  r.addEventListener("input",function(e){n=1;c=e.target.value;if(c!=m)f(e);m=c;});
  r.addEventListener("change",function(e){if(!n)f(e);});
}

const speedInputEl = document.getElementById('speed-input');
const currentSpeedEl = document.getElementById('current-speed');

onRangeChange(speedInputEl, event => {
  var speed = parseInt(event.currentTarget.value);
  var delay = floor(1000 / speed);
  setSpeed(delay);

  currentSpeedEl.textContent = speed;
});
