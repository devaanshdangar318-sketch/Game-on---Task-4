
    var canvas = document.getElementById("game");
    var ctx = canvas.getContext("2d");

    // This is the settings for each level, which I can change
    var levels = [
        { name: "Level 1", bg: "#0b1030", enemy: "👾", rows: 2, speed: 1, asteroidEvery: 100 },
        { name: "Level 2", bg: "#2a0d45", enemy: "👽", rows: 3, speed: 1.6, asteroidEvery: 65 },
        { name: "Level 3: BOSS", bg: "#45100d", enemy: "", rows: 0, speed: 0, asteroidEvery: 45, boss: true },
    ]

    // All the variables of my game
    var state = "menu";
    var message = "";
    var numPlayers = 1;
    var level = 0;
    var frame = 0;
    var players = [];
    var bullets = [];
    var asteroids = [];
    var enemies = [];
    var boss = null;
    var enemyDir = 1;
    var keys = {};
    var muted = false;
    var audio;
    var stars = [];
    
    // Keyboard inpyt and events
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

var notes = [262, ]
