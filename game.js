
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
    var muted = false;    var audio;   
    var stars = [];
for (var s = 0; s < 60; s++) {
  stars.push({ x: Math.random() * 800, y: Math.random() * 600, size: Math.random() * 2 + 1 });
}
    
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

// Enemies movement; sideways and go down when they reach a wall

var atWall = false;
for (i = 0; i < enemies.length; i++) {
    enemies[i].x += L.speed * enemyDir;
    if (enemies[i].x > 770 || enemies[i].x < 30) { atWall = true; }
}

if (atWall) { 
    enemyDir = -enemyDir;
    for (i = 0; i < enemies.length; i++) { 
        enemies[i].y += 20;
    }
    enemies = enemies.filter(function (e) { return e.y < 600; });
}

// The BOSS movement and fireball system

if (boss) { 
    boss.x += 3 * boss.dir;
    if (boss.x > 720 || boss.x < 80) { boss.dir = -boss.dir; }
    if (frame % 50 === 0) {
        asteroids.push({ x: boss.x, y: boss.y + 40, speed: 5, icon: "🔥" });
    }
}

// Asteroids movement and checking if they hit a player

if (frame % L.asteroidEvery === 0) { 
    asteroids.push({ x: Math.random() * 760 + 20, y: -20, speed: 3, icon: "☄️" });
}
for (i = asteroids.length - 1; i >= 0; i--) { 
    asteroids[i].y += asteroids[i].speed;
    if (asteroids[i].y > 620) { asteroids.splice(i, 1); }
}

for (i = 0; i < players.length; i++) { 
    p = players[i];
    if (p.lives <= 0 || p.hurt > 0) { continue; }
    for (j = 0; j < asteroids.length; j++) {
        if(near(p, asteroids[j], 26)) {
            hurtPlayer(p); asteroids.splice(j, 1); break; }
    }
    for (j = 0; j < enemies.length && p.hurt === 0; j++) { 
        if(near(p, enemies[j], 30)) { hurtPlayer(p); enemies.splice(j, 1); break; }
    }
}

// level beaten and ending

if (boss && boss.hp <= 0) { winGame(); return; }
if (!boss && enemies.length === 0) { nextLevel(); return; }
var alive = 0;
for (i = 0; i < players.length; i++) { if (players[i].lives > 0) { alive++; } 
}
if (alive === 0) {gameOver(); }

function emoji(symbol, x, y, size) {
    ctx.font = size + "px Arial";
    ctx.fillText(symbol, x, y);
}

function drawShip(p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 22);
    ctx.lineTo(p.x - 20, p.y + 16);
    ctx.lineTo(p.x + 20, p.y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x - 4, p.y - 2, 8, 12); 
}

function hearts(n) {
    return n > 0 ? "❤️".repeat(n) : "OUT";
}

function drawHUD() {
    ctx.font = "18px Arial";
    ctx.fillStyle = players[0].color;
    ctx.textAlign = "left";
    ctx.fillText("P1  Score: " + players[0].score + "   " + hearts(players[0].lives), 15, 20);
    if (players.length === 2) {
    ctx.fillStyle = players[1].color;
    ctx.textAlign = "right";
    ctx.fillText("P2  Score: " + players[1].score + "   " + hearts(players[1].lives), 785, 20);
    }
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(levels[level].name, 400, 20);
}

function drawMenu() {
    ctx.fillStyle = "#fff";
    ctx.font = "56px Arial";
    ctx.fillText("SPACE INVADERS", 400, 190);
    ctx.font = "24px Arial";
    ctx.fillText("Press 1 for ONE player", 400, 300);
    ctx.fillText("Press 2 for TWO players", 400, 340);
    ctx.font = "16px Arial";
    ctx.fillText("Shoot the aliens, dodge the asteroids, beat the boss!", 400, 430);
}

function draw() {
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = state === "menu" ? levels[0].bg : levels[level].bg;
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = "#fff";
    for (var i = 0; i < stars.length; i++) {
    ctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size);
}    

if (state === "menu") { drawMenu(); return;}

// flashing the player when hurt mechanism

for (i = 0; i < players.length; i++) {
    if (players[i].lives > 0 && players[i].hurt % 10 < 5) { drawShip(players[i]); }
}
}
