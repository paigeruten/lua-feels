var Module = {
  print: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.classList.add('line');
    lineEl.textContent = text;
    outputEl.appendChild(document.createElement('br'));
    outputEl.appendChild(lineEl);
    jumpToBottom();
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.classList.add('line');
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
  parse_error: [],
  opcode: [],
  enter: [],
  leave: [],
  change_speed: []
};

function lua_listen(event_type, handler) {
  lua_listeners[event_type].push(handler);
}

function lua_emit(event) {
  lua_listeners[event.type].forEach(handler => handler(event));
}

function lua_event(event) {
  var matches;
  if (matches = event.match(/^opcode (-?\d+)$/)) {
    lua_emit({ type: 'opcode', payload: { opcode: parseInt(matches[1]) } });
  } else if (matches = event.match(/^opcode (-?\d+) (-?\d+)$/)) {
    lua_emit({ type: 'opcode', payload: { opcode: parseInt(matches[1]), args: [parseInt(matches[2])] } });
  } else if (matches = event.match(/^opcode (-?\d+) (-?\d+) (-?\d+)$/)) {
    lua_emit({ type: 'opcode', payload: { opcode: parseInt(matches[1]), args: [parseInt(matches[2]), parseInt(matches[3])] } });
  } else if (matches = event.match(/^result ([\s\S]*)$/)) {
    lua_emit({ type: 'result', payload: matches[1] });
  } else if (matches = event.match(/^error ([\s\S]*)$/)) {
    lua_emit({ type: 'error', payload: matches[1] });
  } else if (matches = event.match(/^parse_error$/)) {
    lua_emit({ type: 'parse_error', payload: null });
  } else if (matches = event.match(/^enter$/)) {
    lua_emit({ type: 'enter', payload: null });
  } else if (matches = event.match(/^leave$/)) {
    lua_emit({ type: 'leave', payload: null });
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
  lua_emit({ type: 'change_speed', payload: speed });
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

let luaRunning = false;
lua_listen('lua', event => {
  if (event.payload === 'start') {
    luaRunning = true;
  } else if (event.payload === 'end') {
    luaRunning = false;
  }
});

replFormEl.addEventListener('submit', event => {
  event.preventDefault();

  if (luaRunning) {
    console.warn('tried to submit repl form while code is running');
    return;
  }

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

  replHistory.push(code);
  replHistoryIndex = replHistory.length;

  repl(code);
});

var replHistory = [];
var replHistoryIndex = 0;

replInputEl.addEventListener('keydown', event => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();

    if (event.key === 'ArrowUp') {
      replHistoryIndex--;
    } else {
      replHistoryIndex++;
    }

    if (replHistoryIndex < 0) {
      replHistoryIndex = 0;
    } else if (replHistoryIndex >= replHistory.length) {
      replHistoryIndex = replHistory.length;
      replInputEl.value = '';
    } else {
      replInputEl.value = replHistory[replHistoryIndex];
    }
  }
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

  if (speed == 21) {
    setSpeed(0);
    currentSpeedEl.textContent = '∞';
  } else {
    var delay = floor(1000 / speed);
    setSpeed(delay);

    currentSpeedEl.textContent = speed;
  }
});

const exampleClickHandler = event => {
  replInputEl.value = event.currentTarget.dataset.code;
  setTimeout(() => replInputEl.focus(), 0);
};

const examplesEl = document.getElementById('examples');
const exampleElements = examplesEl.getElementsByClassName('example');
Array.prototype.forEach.call(exampleElements, example => {
  example.addEventListener('click', exampleClickHandler);
});
