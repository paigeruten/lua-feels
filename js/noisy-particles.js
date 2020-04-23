let system, osc, env, noise, noiseEnv;

const OPCODES = [
  'MOVE',
  'LOADI',
  'LOADF',
  'LOADK',
  'LOADKX',
  'LOADBOOL',
  'LOADNIL',
  'GETUPVAL',
  'SETUPVAL',
  'GETTABUP',
  'GETTABLE',
  'GETI',
  'GETFIELD',
  'SETTABUP',
  'SETTABLE',
  'SETI',
  'SETFIELD',
  'NEWTABLE',
  'SELF',
  'ADDI',
  'ADDK',
  'SUBK',
  'MULK',
  'MODK',
  'POWK',
  'DIVK',
  'IDIVK',
  'BANDK',
  'BORK',
  'BXORK',
  'SHRI',
  'SHLI',
  'ADD',
  'SUB',
  'MUL',
  'MOD',
  'POW',
  'DIV',
  'IDIV',
  'BAND',
  'BOR',
  'BXOR',
  'SHL',
  'SHR',
  'MMBIN',
  'MMBINI',
  'MMBINK',
  'UNM',
  'BNOT',
  'NOT',
  'LEN',
  'CONCAT',
  'CLOSE',
  'TBC',
  'JMP',
  'EQ',
  'LT',
  'LE',
  'EQK',
  'EQI',
  'LTI',
  'LEI',
  'GTI',
  'GEI',
  'TEST',
  'TESTSET',
  'CALL',
  'TAILCALL',
  'RETURN',
  'RETURN0',
  'RETURN1',
  'FORLOOP',
  'FORPREP',
  'TFORPREP',
  'TFORCALL',
  'TFORLOOP',
  'SETLIST',
  'CLOSURE',
  'VARARG',
  'VARARGPREP',
  'EXTRAARG'
];

// Categorizes the opcode as one of:
//   literal, get, set, operator, test, jump, call, return, misc
function categorizeOpcode(opcode) {
  switch (opcode) {
    case 'LOADI':
    case 'LOADF':
    case 'LOADK':
    case 'LOADKX':
    case 'LOADBOOL':
    case 'LOADNIL':
    case 'NEWTABLE':
      return 'literal';

    case 'GETUPVAL':
    case 'GETTABUP':
    case 'GETTABLE':
    case 'GETI':
    case 'GETFIELD':
    case 'SELF':
      return 'get';

    case 'SETUPVAL':
    case 'SETTABUP':
    case 'SETTABLE':
    case 'SETI':
    case 'SETFIELD':
    case 'SETLIST':
      return 'set';

    case 'ADDI':
    case 'ADDK':
    case 'SUBK':
    case 'MULK':
    case 'MODK':
    case 'POWK':
    case 'DIVK':
    case 'IDIVK':
    case 'BANDK':
    case 'BORK':
    case 'BXORK':
    case 'SHRI':
    case 'SHLI':
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'MOD':
    case 'POW':
    case 'DIV':
    case 'IDIV':
    case 'BAND':
    case 'BOR':
    case 'BXOR':
    case 'SHL':
    case 'SHR':
    case 'UNM':
    case 'BNOT':
    case 'NOT':
    case 'LEN':
    case 'CONCAT':
      return 'operator';

    case 'EQ':
    case 'LT':
    case 'LE':
    case 'EQK':
    case 'EQI':
    case 'LTI':
    case 'LEI':
    case 'GTI':
    case 'GEI':
    case 'TEST':
    case 'TESTSET':
      return 'test';

    case 'JMP':
    case 'FORLOOP':
    case 'TFORLOOP':
      return 'jump';

    case 'MMBIN':
    case 'MMBINI':
    case 'MMBINK':
    case 'CALL':
    case 'TAILCALL':
    case 'TFORCALL':
      return 'call';

    case 'RETURN':
    case 'RETURN0':
    case 'RETURN1':
      return 'return';

    case 'MOVE':
    case 'CLOSE':
    case 'TBC':
    case 'FORPREP':
    case 'TFORPREP':
    case 'CLOSURE':
    case 'VARARG':
    case 'VARARGPREP':
    case 'EXTRAARG':
      return 'misc';
  }

  throw 'unreachable';
}

function opcodeToNote(opcode) {
  switch (categorizeOpcode(opcode)) {
    case 'literal':  return 5;
    case 'get':      return 4;
    case 'set':      return 6;
    case 'operator': return 2;
    case 'test':     return 11;
    case 'jump':     return 9;
    case 'call':     return 7;
    case 'return':   return 0;
    case 'misc':     return 10;
  }

  throw 'unreachable';
}

function opcodeToColor(opcode) {
  switch (categorizeOpcode(opcode)) {
    case 'literal':  return {r: 0, g: 0, b: 0};
    case 'get':      return {r: 0, g: 127, b: 0};
    case 'set':      return {r: 0, g: 0, b: 127};
    case 'operator': return {r: 127, g: 127, b: 0};
    case 'test':     return {r: 127, g: 63, b: 0};
    case 'jump':     return {r: 127, g: 0, b: 127};
    case 'call':     return {r: 0, g: 127, b: 127};
    case 'return':   return {r: 127, g: 0, b: 0};
    case 'misc':     return {r: 127, g: 127, b: 127};
  }

  throw 'unreachable';
}

let base_note = 48;
let recursionGoUp = 0;
let opcode_tally = {};

lua_listen('lua', function (event) {
  if (event.payload == 'start') {
    startAudio();
    base_note = recursionGoUp ? 48 : 60;
    opcode_tally = {};
  }
});

lua_listen('opcode', function (event) {
  let opcode = OPCODES[event.payload.opcode];

  if (opcode_tally[opcode] === undefined) {
    opcode_tally[opcode] = 0;
  }
  opcode_tally[opcode]++;

  let opcodeCat = categorizeOpcode(opcode);
  let midiValue = opcodeToNote(opcode) + base_note;
  let freq = midiToFreq(midiValue);
  osc.freq(freq);
  env.play(osc, 0, 0.01);

  if (opcodeCat === 'jump') {
    if (loopDrum) noiseEnv.play(noise);
  }

  let label = opcode;
  if (event.payload.args) {
    label += ' ' + event.payload.args[0] + ' + ' + event.payload.args[1];
  }

  system.addParticle(label, opcodeToColor(opcode));
});

let initiallyEntered = false;
lua_listen('lua', (event) => {
  if (event.payload === 'start') {
    initiallyEntered = false;
  }
});
lua_listen('enter', () => {
  if (initiallyEntered) {
    if (callDrum) noiseEnv.play(noise);
  } else {
    initiallyEntered = true;
  }
  base_note += recursionGoUp;
});
lua_listen('leave', () => base_note -= recursionGoUp);

const recursionGoUpInputEl = document.getElementById('recursion-go-up');
const recursionGoUpValueEl = document.getElementById('recursion-go-up-value');

onRangeChange(recursionGoUpInputEl, event => {
  recursionGoUp = parseInt(event.currentTarget.value);

  if (recursionGoUp == 0) {
    recursionGoUpValueEl.textContent = 'Off';
  } else if (recursionGoUp == 1) {
    recursionGoUpValueEl.textContent = '1 note'
  } else if (recursionGoUp == 12) {
    recursionGoUpValueEl.textContent = '1 octave'
  } else {
    recursionGoUpValueEl.textContent = recursionGoUp + ' notes';
  }
});

let loopDrum = true;
let callDrum = true;

document.getElementById('loop-drum').addEventListener('change', event => {
  loopDrum = event.currentTarget.checked;
});
document.getElementById('call-drum').addEventListener('change', event => {
  callDrum = event.currentTarget.checked;
});

function setCanvasSize() {
  var p5El = document.getElementById('p5');
  resizeCanvas(p5El.clientWidth, p5El.clientHeight);
}

function windowResized() {
  setCanvasSize();
}

var audioStarted = false;
function startAudio() {
  if (!audioStarted) {
    userStartAudio();
    osc.start();

    audioStarted = true;
  }
}

var reverb, delay;
function setup() {
  var canvas = createCanvas(720, 400);
  canvas.parent('p5');
  setCanvasSize();

  system = new ParticleSystem(createVector(width / 2, 50));

  osc = new p5.SawOsc();
  osc.amp(0);
  osc.start();

  env = new p5.Env();
  env.setADSR(0.001, 0.3, 0.01, 0.5);
  env.setRange(1, 0);

  noise = new p5.Noise();
  noise.amp(0);
  noise.start();

  noiseEnv = new p5.Env();
  noiseEnv.setADSR(0.001, 0.1, 0.2, 0.1);
  noiseEnv.setRange(1, 0);

  reverb = new p5.Reverb();
  reverb.process(osc, 0.1, 0.3);
  reverb.process(noise, 0.1, 0.3);
  reverb.amp(4);
  reverb.disconnect();

  delay = new p5.Delay();
  delay.process(reverb, 0.5, 0.7, 3000);
  delay.disconnect();
}

function echoOn() {
  osc.disconnect();
  noise.disconnect();

  osc.connect(reverb);
  noise.connect(reverb);

  delay.connect(soundOut);
}

function echoOff() {
  delay.disconnect();

  osc.connect(soundOut);
  noise.connect(soundOut);
}

let  = true;

document.getElementById('echo').addEventListener('change', event => {
  if (event.currentTarget.checked) {
    echoOn();
  } else {
    echoOff();
  }
});

function draw() {
  background(51);
  system.run();

  let tally_y = 23;
  Object.entries(opcode_tally)
    .forEach(entry => {
      const opcode = entry[0];
      const count = entry[1];
      const opcodeCat = categorizeOpcode(opcode);
      const color = opcodeToColor(opcode);

      stroke(200);
      strokeWeight(2.5);
      fill(color.r, color.g, color.b);
      ellipse(20, tally_y, 15, 15);

      noStroke();
      fill(200);
      textSize(12);
      text(opcode + ' (x' + count + ')', 32, tally_y + 4);

      tally_y += 23;
    });
}

// mostly copied from https://p5js.org/examples/simulate-particle-system.html
let Particle = function(position, label, color) {
  this.acceleration = createVector(0, 0.05);
  this.velocity = createVector(random(-1, 1), random(-1, 0));
  this.position = position.copy();
  this.lifespan = 255;
  this.label = label;
  this.color = color;
};

Particle.prototype.run = function() {
  this.update();
  this.display();
};

// Method to update position
Particle.prototype.update = function(){
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
  this.lifespan -= 1.5;
};

// Method to display
Particle.prototype.display = function() {
  stroke(200, this.lifespan);
  strokeWeight(3);
  fill(this.color.r, this.color.g, this.color.b, this.lifespan);
  ellipse(this.position.x, this.position.y, 18, 18);

  noStroke();
  fill(200, this.lifespan);
  textSize(14);
  text(this.label, this.position.x + 16, this.position.y + 5);
};

// Is the particle still useful?
Particle.prototype.isDead = function(){
  return this.lifespan < 0;
};

let ParticleSystem = function(position) {
  this.origin = position.copy();
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function(label, color) {
  this.particles.push(new Particle(this.origin, label, color));
};

ParticleSystem.prototype.run = function() {
  for (let i = this.particles.length-1; i >= 0; i--) {
    let p = this.particles[i];
    p.run();
    if (p.isDead()) {
      this.particles.splice(i, 1);
    }
  }
};
