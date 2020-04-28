let system, synth, drum, inst;
let note_length = 0.06;

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
    case 'TFORCALL':
      return 'jump';

    case 'MMBIN':
    case 'MMBINI':
    case 'MMBINK':
    case 'CALL':
    case 'TAILCALL':
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
    base_note = recursionGoUp ? 36 : 60;
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
  inst.triggerAttackRelease(Tone.Midi(midiValue), note_length);

  if (opcodeCat === 'jump') {
    if (loopDrum) drum.triggerAttackRelease('C2', note_length)
  }

  let label = opcode;
  if (opcode === 'RETURN') {
    if (event.payload.args[0] > 0 && event.payload.args.length == 2) {
      label += ': ' + event.payload.args[1];
      if (event.payload.args[0] > 1) {
        label += ', ...';
      }
    }
  } else if (event.payload.args) {
    label += ': ' + event.payload.args[0];

    if (event.payload.args.length == 2) {
      const sym = {ADD: '+', SUB: '-', MUL: '*'}[opcode];
      label += ' ' + sym + ' ' + event.payload.args[1];
    }
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
    if (callDrum) drum.triggerAttackRelease('C2', note_length)
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

lua_listen('change_speed', event => { note_length = Math.max(0.01, event.payload / 1000 * 0.75); });

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
    Tone.start();
    audioStarted = true;
  }
}

var piano;
function setup() {
  var canvas = createCanvas(720, 400);
  canvas.parent('p5');
  setCanvasSize();

  system = new ParticleSystem(createVector(width / 2, 50));

  drum = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 10,
    envelope: {
      attack: 0.001,
      decay: 0.3,
      sustain: 0.001,
      release: 0.4
    }
  }).toMaster();
  drum.volume.value = -10;

  synth = new Tone.Synth({
    oscillator: {
      type: "fatsawtooth",
      detune: 30,
      count: 1
    },
    envelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0.5,
      release: 0.4
    }//,
    //portamento: 0.03
  });
  synth.volume.value = -10;

  var freeverb = new Tone.Freeverb(0.6);
  var filter = new Tone.Filter(200, "highpass");

  synth.chain(
    //filter,
    //freeverb,
    Tone.Master
  );

  piano = new Tone.Sampler({
    "A0" : "A0.mp3",
    "C1" : "C1.mp3",
    "D#1" : "Ds1.mp3",
    "F#1" : "Fs1.mp3",
    "A1" : "A1.mp3",
    "C2" : "C2.mp3",
    "D#2" : "Ds2.mp3",
    "F#2" : "Fs2.mp3",
    "A2" : "A2.mp3",
    "C3" : "C3.mp3",
    "D#3" : "Ds3.mp3",
    "F#3" : "Fs3.mp3",
    "A3" : "A3.mp3",
    "C4" : "C4.mp3",
    "D#4" : "Ds4.mp3",
    "F#4" : "Fs4.mp3",
    "A4" : "A4.mp3",
    "C5" : "C5.mp3",
    "D#5" : "Ds5.mp3",
    "F#5" : "Fs5.mp3",
    "A5" : "A5.mp3",
    "C6" : "C6.mp3",
    "D#6" : "Ds6.mp3",
    "F#6" : "Fs6.mp3",
    "A6" : "A6.mp3",
    "C7" : "C7.mp3",
    "D#7" : "Ds7.mp3",
    "F#7" : "Fs7.mp3",
    "A7" : "A7.mp3",
    "C8" : "C8.mp3"
  }, {
    "release" : 1,
    "baseUrl" : "./audio/salamander/"
  }).toMaster();

  inst = synth;
}

function pianoOn() {
  inst = piano;
}

function pianoOff() {
  inst = synth;
}

document.getElementById('piano').addEventListener('change', event => {
  if (event.currentTarget.checked) {
    pianoOn();
  } else {
    pianoOff();
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
