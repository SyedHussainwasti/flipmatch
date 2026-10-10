"use strict";

/* The 8 pictures used in the game. Each one appears twice (8 pairs = 16 cards). */
var EMOJI = ['🐵', '🍌', '🌟', '🚀', '🎮', '🍕', '⚽', '🎧'];

// Build a shuffled deck: double the pictures, then mix them up.
function buildDeck() {
  var d = EMOJI.concat(EMOJI), i, j, t;
  // Shuffle: walk backwards, swapping each card with a random earlier one.
  for (i = d.length - 1; i > 0; i--) {
    j = (Math.random() * (i + 1)) | 0;
    t = d[i]; d[i] = d[j]; d[j] = t;
  }
  // Turn each picture into a card object we can track.
  return d.map(function (e, k) { return { id: k, emoji: e, matched: false }; });
}

// Turn seconds into "1:05" style text for the timer.
function fmtTime(sec) {
  var m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// Grab the spots on the page where the game lives.
var board = document.getElementById('board');
var movesEl = document.getElementById('moves'), timeEl = document.getElementById('time');
var ov = document.getElementById('ov'), winStats = document.getElementById('winStats');

// The game's memory: the deck, the two flipped cards, and the score.
var deck, first, second, lock, moves, matched, startT, tInt;

// Start (or restart) a game: fresh shuffled deck, zeroed score, clean board.
function newGame() {
  deck = buildDeck();
  first = second = null; lock = false;
  moves = 0; matched = 0; startT = 0;
  clearInterval(tInt); // stop any old timer
  movesEl.textContent = '0'; timeEl.textContent = '0:00';
  ov.classList.add('hidden'); // hide the "You did it!" popup
  board.innerHTML = ''; // clear old cards
  // Build one clickable card on the page for each card in the deck.
  deck.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('aria-label', 'memory card');
    // The front face shows a question mark...
    var f = document.createElement('span'); f.className = 'face front'; f.textContent = '❔';
    // ...the back face hides the emoji.
    var bk = document.createElement('span'); bk.className = 'face back'; bk.textContent = c.emoji;
    b.appendChild(f); b.appendChild(bk);
    // When tapped, try to flip this card.
    b.addEventListener('click', function () { flip(c, b); });
    board.appendChild(b);
    c.el = b; // remember the page element for this card
  });
}

// Start the stopwatch on the very first flip.
function startTimer() {
  startT = Date.now();
  // Update the time text twice a second.
  tInt = setInterval(function () {
    timeEl.textContent = fmtTime(Math.floor((Date.now() - startT) / 1000));
  }, 500);
}

// What happens when the player taps a card.
function flip(c, el) {
  // Ignore taps while cards are flipping back, on finished cards, or the same card twice.
  if (lock || c.matched || c === first) return;
  if (!startT) startTimer(); // first flip starts the clock
  el.classList.add('up'); // show the emoji (CSS does the flip animation)
  if (!first) { first = c; return; } // this is the first card of the pair — wait for the second
  second = c;
  moves++; movesEl.textContent = moves; // count this as one move
  lock = true; // block taps until we resolve this pair
  // Do the two emojis match?
  if (first.emoji === second.emoji) {
    // Yes: after a short happy pause, mark both as done (they glow green).
    (function (a, b) {
      setTimeout(function () {
        a.el.classList.add('done'); b.el.classList.add('done');
        a.matched = b.matched = true;
        matched++;
        first = second = null; lock = false; // let the player tap again
        if (matched === 8) win(); // all 8 pairs found — you win!
      }, 450);
    })(first, second);
  } else {
    // No: after a moment to memorize, flip both back face-down.
    (function (a, b) {
      setTimeout(function () {
        a.el.classList.remove('up'); b.el.classList.remove('up');
        first = second = null; lock = false; // let the player tap again
      }, 750);
    })(first, second);
  }
}

// All pairs found: stop the clock and show the win popup with the score.
function win() {
  clearInterval(tInt);
  var secs = Math.floor((Date.now() - startT) / 1000);
  winStats.innerHTML = '<b>' + moves + '</b> moves<br><b>' + fmtTime(secs) + '</b> time';
  ov.classList.remove('hidden');
}

// Both buttons start a fresh game.
document.getElementById('restartBtn').addEventListener('click', newGame);
document.getElementById('againBtn').addEventListener('click', newGame);

// Deal the first game as soon as the page loads.
newGame();
