let lastOutputType = null;

var Module = {
  print: function(text) {
    outputEl.innerHTML = '';
    lastOutputType = 'print';

    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.classList.add('line');
    lineEl.classList.add('fade-out');
    lineEl.textContent = text;
    outputEl.appendChild(lineEl);

    outputParentEl.classList.add('print-flash');
    setTimeout(() => {
      outputParentEl.classList.remove('print-flash');
    }, speed);
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

    const lineEl = document.createElement('div');
    lineEl.classList.add('line');
    lineEl.textContent = '[ERROR] ' + text;
    outputEl.appendChild(lineEl);
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
  if (matches = event.match(/^opcode (\d+)$/)) {
    lua_emit({ type: 'opcode', payload: { opcode: parseInt(matches[1]) } });
  } else if (matches = event.match(/^opcode (\d+) (\d+)$/)) {
    lua_emit({ type: 'opcode', payload: { opcode: parseInt(matches[1]), args: [parseInt(matches[2])] } });
  } else if (matches = event.match(/^opcode (\d+) (\d+) (\d+)$/)) {
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

let currentCode = '';
let lastParsableCode = '';
let isLooping = false;
let hadParseError = false;
let hadError = false;

function runLuaScript() {
  if (currentCode == '') {
    isLooping = false;
    lastParsableCode = '';
    outputEl.innerHTML = '';
    lastOutputType = null;
    return;
  }

  hadParseError = false;
  hadError = false;
  const code = currentCode;

  lua_emit({ type: 'lua', payload: 'start' });
  var L = Module.ccall("init_lua", 'number', [], []);
  var cont = Module.ccall("run_lua", 'number', ['number', 'string'], [L, code], { async: true });
  Promise.resolve(cont)
    .then(() => {
      lua_emit({ type: 'lua', payload: 'end' });
      Module.ccall("free_lua", 'void', ['number'], [L]);

      if (!hadError && lastOutputType == 'error') {
        outputEl.innerHTML = '';
        lastOutputType = null;
      }

      if (hadParseError) {
        if (lastOutputType == 'error') {
          lastOutputType = 'parse_error';
        }
        currentCode = lastParsableCode;
        setTimeout(runLuaScript, 0);
      } else {
        lastParsableCode = code;
        setTimeout(runLuaScript, speed);
      }
    });
}

lua_listen('parse_error', () => { hadParseError = true; });

var speed = 100;
function setSpeed(milliseconds) {
  speed = milliseconds;
  Module.ccall("set_vm_delay", 'void', ['number'], [speed]);
  lua_emit({ type: 'change_speed', payload: speed });
}

const noisyCodeEl = document.getElementById('livecode-noisy');
const outputEl = document.getElementById('livecode-output');
const outputParentEl = document.getElementById('output');

noisyCodeEl.addEventListener('keyup', event => {
  currentCode = noisyCodeEl.value;

  if (!isLooping) {
    isLooping = true;
    runLuaScript();
  }
});

lua_listen('error', event => {
  outputEl.innerHTML = '';
  lastOutputType = 'error';
  hadError = true;

  const errorEl = document.createElement('span');
  errorEl.classList.add('error');
  errorEl.textContent = event.payload;

  const lineEl = document.createElement('div');
  lineEl.classList.add('line');
  lineEl.appendChild(errorEl);

  outputEl.appendChild(lineEl);
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
