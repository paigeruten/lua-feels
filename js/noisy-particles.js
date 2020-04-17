let system, osc, env;

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

lua_listen('lua', function (event) {
  if (event.payload == 'start') {
    base_note = 48;
  }
});

lua_listen('opcode', function (event) {
  let opcode = OPCODES[event.payload];
  let opcodeCat = categorizeOpcode(opcode);
  let midiValue = opcodeToNote(opcode) + base_note;
  let freq = midiToFreq(midiValue);
  osc.freq(freq);
  env.play(osc, 0, 0.01);

  system.addParticle(opcode, opcodeToColor(opcode));

  if ((opcodeCat === 'call' && opcode !== 'TAILCALL') || opcode === 'VARARGPREP') {
    base_note += 5;
  } else if (opcodeCat === 'return') {
    base_note -= 5;
  }
});

function setCanvasSize() {
  var p5El = document.getElementById('p5');
  resizeCanvas(p5El.clientWidth, p5El.clientHeight);
}

function windowResized() {
  setCanvasSize();
}

function setup() {
  var canvas = createCanvas(720, 400);
  canvas.parent('p5');
  setCanvasSize();

  system = new ParticleSystem(createVector(width / 2, 50));

  osc = new p5.SinOsc();
  osc.amp(0);
  osc.start();

  env = new p5.Env();
  env.setADSR(0.001, 0.5, 0.01, 0.5);
  env.setRange(1, 0);
}

function draw() {
  background(51);
  system.run();
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
  strokeWeight(2);
  fill(this.color.r, this.color.g, this.color.b, this.lifespan);
  ellipse(this.position.x, this.position.y, 12, 12);

  noStroke();
  fill(200, this.lifespan);
  textSize(10);
  text(this.label, this.position.x + 10, this.position.y + 4);
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
