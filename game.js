
    var canvas = document.getElementById("game");
    var ctx = canvas.getContext("2d");

    // This is the settings for each level, which I can change
    var levels = [
        { name: "Level 1", bg: "#0b1030", enemy: "👾", rows: 2, speed: 1, asteroidEvery: 100 },
        { name: "Level 2", bg: "#2a0d45", enemy: "👽", rows: 3, speed: 1.6, asteroidEvery: 65 },
        { name: "Level 3: BOSS", bg: "#45100d", enemy: "", rows: 0, speed: 0, asteroidEvery: 45, boss: true },
    ]

    // All the variables of my game
    var state = "menu";    var message = "";    var numPlayers = 1;
    var level = 0;    var frame = 0;    var players = [];
    var bullets = [];    var asteroids = [];    var enemies = [];
    var boss = null;    var enemyDir = 1;    var keys = {};
    var muted = false;    var audio;    var stars = [];
    
    // Keyboard input and events
    document.addEventListener("keydown", function (e) {
        var key = e.key.toLowerCase();
        keys[key] = true;
        if (key === " " || key.indexOf("arrow") === 0) {e.preventDefault(); }
        if (state === "menu") {
            if (key === "1") { startGame(1); }
            if (key === "2") { startGame(2); }
        }
        if (key === "m") { muted = !muted; }
    });
    document.addEventListener("keyup", function (e) {
    keys[e.key.toLowerCase()] = false;
    });
    function pressed(list) {
            for (var i = 0; i < list.length; i++) {
            if (keys[list[i]]) { return true; }
        }
        return false;
    }

// sound effects

function beep(freq, seconds, type, volume) {
    if (!audio || muted) { return; }
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.08;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + seconds);
}

var notes = [262, 330, 392, 330, 294, 370, 440, 370];

var noteNumber = 0;
setInterval(function () {
    if (state === "playing") { 
        beep(notes[noteNumber % notes.length], 0.25, "triangle", 0.04);
        noteNumber++;
    }
}, 300);

// The loading and starting of the game

function makePlayer(x, color, left, right, shoot) {
    return { x: x, y: 550, color: color, score: 0, lives: 3, cooldown: 0, hurt: 0,
        left: left, right: right, shoot: shoot
    };
}

function startGame(n) { 
    numPlayers = n;
    if (!audio) { audio = new (window.AudioContext || window.webkitAudioContext)(); }
    players = [ makePlayer(n === 1 ? 400 : 250, '#4cd964', ["a"], ["d"], ["w"], [" "])];
    if (n === 2) { players.push(makePlayer(550, '#ffb347', ["arrowleft"], ["arrowright"], ["arrowup"])); }
    level = 0;
    loadLevel();    
}

function loadLevel() {
    var L = levels[level];
bullets = [];
enemies = [];
asteroids = [];
boss = null;
enemyDir = 1;
frame = 0;
if (L.boss) {
    boss = { x: 400, y: 100, hp: 25, dir: 1 };
} else {
    for (var r = 0; r < L.rows; r++) {
    for (var c = 0; c < 7; c++) {
        enemies.push({ x: 150 + c * 85, y: 70 + r * 60 });
    }
    }
}
state = "playing";
}
// The functions below are responsible for moving to different parts and playing the responsible sound effects

function showMessage(text, ms, thenDo) {
    state="message";
    message = text;
    setTimeout(thenDo, ms);
}

function nextLevel() { 
    level++;
    beep(660, 0.3, "triangle");
    showMessage(level[level].name, 1500, loadLevel);
}

function gameOver() { 
    beep(880, 0.6, "triangle");
    showMessage("YOU WIN!", 4000, function () { state = "menu"; });
}

function winGame() {
    beep(880, 0.6, "triangle");
    showMessage("YOU WIN!", 4000, function () { state = "menu"; });
}
function hurtPlayer(p) {
    p.lives--;
    p.hurt = 90;                      
    beep(120, 0.4, "sawtooth");
}

function near(a, b, distance) { 
    return Math.abs(a.x - b.x) < distance && Math.abs(a.y - b.y) < distance;
}

// Actually updating the game which runs 60 times per second

function update() { 
    frame++;
    var L = levels[level];
    var i, j, p;
}

// How the players move and shoot

  for (i = 0; i < players.length; i++) {
    p = players[i];
    if (p.lives <= 0) { continue; }          // this player is out
    if (pressed(p.left) && p.x > 25)  { p.x -= 6; }
    if (pressed(p.right) && p.x < 775) { p.x += 6; }
    if (p.cooldown > 0) { p.cooldown--; }
    if (p.hurt > 0) { p.hurt--; }
    if (pressed(p.shoot) && p.cooldown === 0) {
    bullets.push({ x: p.x, y: p.y - 25, owner: p });
    p.cooldown = 15;
    beep(880, 0.08);
    }
}

// The bullet mechanism moving up and checking what they hit

for (i = bullets.length - 1; i >= 0; i--) { 
    var b = bullets[i];
    b.y -= 10;
    var used = b.y < -20;
    for (j = enemies.length - 1; j >= 0 && !used; j--) { 
        if (near(b, enemies[j], 24)) {
        enemies.splice(j, 1);
        b.owner.score += 10;
        beep(200, 0.15, "sawtooth");
        used = true;
    }
}
    if (boss && !used && near(b, boss, 45)) {
    boss.hp--;
    b.owner.score += 5;
    beep(150, 0.1, "sawtooth");
    used = true;
    }
    if (used) { bullets.splice(i, 1); }
}


