/* ═══════════════════════════════════════════════
   Dog Show — app.js
   Slideshow, fake chat, intermissions, sponsor banners.
   Phase 2 will replace fake chat with PartyKit.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── SEED DATA ──────────────────────────────────

  var SEED_DOGS = [
    'https://images.dog.ceo/breeds/retriever-golden/n02099601_1722.jpg',
    'https://images.dog.ceo/breeds/poodle-standard/n02113799_2280.jpg',
    'https://images.dog.ceo/breeds/husky/n02110185_10047.jpg',
    'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_10475.jpg',
    'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg',
    'https://images.dog.ceo/breeds/dalmatian/n02110341_4527.jpg',
    'https://images.dog.ceo/breeds/shihtzu/n02086240_7588.jpg',
    'https://images.dog.ceo/breeds/germanshepherd/n02106662_20536.jpg',
    'https://images.dog.ceo/breeds/samoyed/n02111889_10206.jpg',
    'https://images.dog.ceo/breeds/bulldog-french/n02108915_5765.jpg',
  ];

  var DOG_NAMES = [
    'Sir Barkington III', 'Princess Fluffernutter', 'Captain Wiggles',
    'Duke of Snootsville', 'Lady Woofsworth', 'Baron von Fetchington',
    'Countess Pawdington', 'Lord Droolsbury', 'Empress Belly Rubs',
    'The Honorable Mr. Sniffs', 'Brigadier Boop', 'Dame Floofington',
    'Chancellor Chomps', 'Viscount Waggles', 'Archduke Zoomies',
    'Madame Snugglesworth', 'General Good Boy', 'Professor Borkenstein',
    'Queen Pawlina', 'Sir Licksalot', 'The Grand Poobah of Paws',
  ];

  var FAKE_USERS = [
    'doglover99', 'barkfan', 'woofwatcher', 'puppyperson', 'snootboop',
    'goodboy_greg', 'fetchqueen', 'pawsitive_vibes', 'treatseeker', 'zoomies4life',
  ];

  var FAKE_MESSAGES = [
    'omg look at this one',
    '10/10 good dog',
    "I paid $1.99 for this and I'm not even mad",
    'THIS IS THE BEST $1.99 I EVER SPENT',
    'wait is this actually just dogs',
    'yes. yes it is.',
    'legendary',
    'that dog looks like my boss',
    'someone tell this dog I love them',
    "I've been here for 40 minutes",
    'the curtain really got me',
    'worth every penny',
    'is this what the internet was made for',
    "I'm showing this to everyone at work",
    'this dog has more charisma than me',
    'ok but the chat is actually the best part',
    'who else is watching at 2am',
    "I can't leave",
    'dogs.',
    'this is art',
    'my therapist is going to hear about this',
    'just venmo\'d my friend $1.99 to join lol',
    'the old timey music during intermission killed me',
    'RARE DOG RARE DOG',
    'LIFETIME MEMBER HERE. I LIVE HERE NOW.',
    'the jingle is stuck in my head',
  ];

  var INTERMISSION_MESSAGES = [
    'here comes the jingle',
    'NOT THE JINGLE AGAIN',
    'I love the jingle actually',
    'intermission gang rise up',
    'the dogs... where did they go',
    'I can still hear the jingle in my dreams',
    "who's sponsoring this one",
    'please stand by lmaooo',
    'the curtain is CLOSED',
    '3 2 1... dogs incoming',
  ];

  var SPONSOR_MESSAGES = [
    'This Dog Show brought to you by Kevin from Ohio',
    'Sponsored by: my crippling inability to close browser tabs',
    "This moment of dogs powered by Sarah's birthday fund",
    'Corporate sponsor: Jeff (he is not a corporation)',
    'Brought to you by the letter W (for Woof)',
  ];

  var VIP_SKINS = [
    { name: 'Amethyst', color: '#BB86FC', bg: 'rgba(187,134,252,0.12)', border: '#BB86FC' },
    { name: 'Electric Violet', color: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', border: '#7C4DFF' },
    { name: 'Hot Pink', color: '#FF1493', bg: 'rgba(255,20,147,0.12)', border: '#FF1493' },
    { name: 'Neon Green', color: '#39FF14', bg: 'rgba(57,255,20,0.10)', border: '#39FF14' },
    { name: 'Ice Blue', color: '#00D4FF', bg: 'rgba(0,212,255,0.12)', border: '#00D4FF' },
    { name: 'Sunset Orange', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', border: '#FF6B35' },
  ];

  // ─── STATE ──────────────────────────────────────

  var dogQueue = SEED_DOGS.slice();
  var currentIndex = 0;
  var nameIndex = 0;
  var isIntermission = false;
  var viewerCount = Math.floor(Math.random() * 40) + 12;
  var boneCount = 0;
  var boneTimestamps = [];    // tracks recent bone times for streak calc
  var isFrenzy = false;
  var frenzyMulti = 0;
  var dogTimer = null;
  var dogBaseTime = 5000;     // 5s default
  var dogBonusTime = 0;       // accumulated from bones
  var dogTimeRemaining = 0;

  // ─── DOM REFS ───────────────────────────────────

  var dogImage = document.getElementById('dogImage');
  var dogName = document.getElementById('dogName');
  var chatMessages = document.getElementById('chatMessages');
  var chatInput = document.getElementById('chatInput');
  var chatSend = document.getElementById('chatSend');
  var viewerCountEl = document.getElementById('viewerCount');
  var sponsorBanner = document.getElementById('sponsorBanner');
  var intermission = document.getElementById('intermission');
  var intermissionTitle = document.getElementById('intermissionTitle');
  var chatIntermissionLabel = document.getElementById('chatIntermissionLabel');
  var boneBtn = document.getElementById('boneBtn');
  var boneCountEl = document.getElementById('boneCount');
  var boneRain = document.getElementById('boneRain');
  var boneStreakEl = document.getElementById('boneStreak');
  var boneFrenzyEl = document.getElementById('boneFrenzy');
  var boneFrenzyMultiEl = document.getElementById('boneFrenzyMulti');
  var dogFrame = document.querySelector('.dog-frame');

  // ─── UTILITIES ──────────────────────────────────

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getNextName() {
    var name = DOG_NAMES[nameIndex % DOG_NAMES.length];
    nameIndex++;
    return name;
  }

  // ─── DOG SLIDESHOW ──────────────────────────────

  function fetchMoreDogs() {
    fetch('https://dog.ceo/api/breeds/image/random/5')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.status === 'success') {
          dogQueue = dogQueue.concat(data.message);
        }
      })
      .catch(function () {
        // Recycle seeds if API fails
        dogQueue = dogQueue.concat(SEED_DOGS);
      });
  }

  function showDog(url, name) {
    dogImage.classList.remove('loaded');
    dogImage.onload = function () {
      dogImage.classList.add('loaded');
    };
    dogImage.src = url;
    dogName.textContent = name;
  }

  function nextDog() {
    if (isIntermission) return;

    currentIndex++;
    var idx = currentIndex % Math.max(dogQueue.length, 1);
    var url = dogQueue[idx] || SEED_DOGS[0];
    var name = getNextName();

    // Reset bone count and frenzy for new dog
    boneCount = 0;
    boneCountEl.textContent = '0';
    boneTimestamps = [];
    if (isFrenzy) endFrenzy();
    boneStreakEl.textContent = '';
    boneStreakEl.className = 'bone-streak';

    // Briefly fade out, then show new dog
    dogImage.classList.remove('loaded');
    setTimeout(function () {
      showDog(url, name);
    }, 300);

    // Fetch more when running low
    if (currentIndex > dogQueue.length - 5) {
      fetchMoreDogs();
    }
  }

  // Initialize first dog
  fetchMoreDogs();
  showDog(SEED_DOGS[0], DOG_NAMES[0]);
  nameIndex = 1;

  // Dynamic dog timer — bones extend screen time
  function scheduleDog() {
    dogBonusTime = 0;
    var totalTime = dogBaseTime;
    dogTimer = setTimeout(function () {
      // If bonus time was added, wait that too
      if (dogBonusTime > 0) {
        var bonus = Math.min(dogBonusTime, 15000); // cap at 15s bonus
        dogBonusTime = 0;
        dogTimer = setTimeout(function () {
          nextDog();
          scheduleDog();
        }, bonus);
      } else {
        nextDog();
        scheduleDog();
      }
    }, totalTime);
  }
  scheduleDog();

  // ─── FAKE CHAT ──────────────────────────────────

  function addChatMessage(user, msg, opts) {
    opts = opts || {};
    var div = document.createElement('div');
    div.className = 'chat-msg';

    var isVip = opts.isVip || false;
    var skin = opts.skin || null;
    var isLifetime = opts.isLifetime || false;
    var isMe = opts.isMe || false;

    if (isVip && skin) {
      div.classList.add('vip');
      div.style.background = skin.bg;
      div.style.borderLeft = '2px solid ' + skin.border;
    }
    if (isLifetime) {
      div.style.background = 'rgba(123,104,238,0.08)';
      div.style.borderLeft = '2px solid #7B68EE';
    }

    var userSpan = document.createElement('span');
    userSpan.className = 'chat-msg-user';
    if (isMe) userSpan.classList.add('me');

    if (isLifetime) {
      userSpan.style.color = '#7B68EE';
      userSpan.textContent = '🏆 ' + user;
    } else if (isVip && skin) {
      userSpan.style.color = skin.color;
      userSpan.textContent = '✳ ' + user;
    } else {
      userSpan.style.color = isMe ? '#BB86FC' : '#9B8FD0';
      userSpan.textContent = user;
    }

    var textSpan = document.createElement('span');
    textSpan.className = 'chat-msg-text';
    textSpan.textContent = ': ' + msg;

    div.appendChild(userSpan);
    div.appendChild(textSpan);

    chatMessages.appendChild(div);

    // Keep chat scrolled and trim old messages
    if (chatMessages.children.length > 80) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addFakeMessage() {
    var user = pick(FAKE_USERS);
    var pool = isIntermission ? INTERMISSION_MESSAGES : FAKE_MESSAGES;
    var msg = pick(pool);
    var isVip = Math.random() > 0.7;
    var skin = isVip ? pick(VIP_SKINS) : null;
    var isLt = isVip && Math.random() > 0.8;

    addChatMessage(user, msg, { isVip: isVip, skin: skin, isLifetime: isLt });
  }

  // Send user messages
  function sendUserMessage() {
    var msg = chatInput.value.trim();
    if (!msg) return;
    addChatMessage('you', msg, { isMe: true });
    chatInput.value = '';
  }

  chatSend.addEventListener('click', sendUserMessage);
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendUserMessage();
  });

  // Fake chat trickle
  addFakeMessage();
  setInterval(function () {
    addFakeMessage();
  }, 2000 + Math.random() * 4000);

  // ─── VIEWER COUNT ───────────────────────────────

  viewerCountEl.textContent = viewerCount;
  setInterval(function () {
    viewerCount = Math.max(5, viewerCount + Math.floor(Math.random() * 7) - 3);
    viewerCountEl.textContent = viewerCount;
  }, 8000);

  // ─── INTERMISSION ───────────────────────────────

  var dots = '';
  var dotsInterval;

  function startIntermission() {
    isIntermission = true;
    intermission.classList.add('active');
    chatIntermissionLabel.classList.add('active');

    dots = '';
    dotsInterval = setInterval(function () {
      dots = dots.length >= 3 ? '' : dots + '.';
      intermissionTitle.textContent = 'Please Stand By' + dots;
    }, 600);
  }

  function endIntermission() {
    isIntermission = false;
    intermission.classList.remove('active');
    chatIntermissionLabel.classList.remove('active');
    clearInterval(dotsInterval);
    intermissionTitle.textContent = 'Please Stand By';
  }

  // Intermission disabled for now — will re-enable later
  // setInterval(function () {
  //   startIntermission();
  //   setTimeout(endIntermission, 12000);
  // }, 45000);

  // Sponsor banners disabled for now
  // setInterval(function () {
  //   if (Math.random() > 0.4) {
  //     sponsorBanner.textContent = '✳ ' + pick(SPONSOR_MESSAGES) + ' ✳';
  //     sponsorBanner.classList.add('visible');
  //     setTimeout(function () {
  //       sponsorBanner.classList.remove('visible');
  //     }, 8000);
  //   }
  // }, 15000);

  // ─── BONE REACTIONS ─────────────────────────────

  function spawnBone(x, y) {
    var el = document.createElement('span');
    el.className = 'bone-float';
    el.textContent = '🦴';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    boneRain.appendChild(el);
    setTimeout(function () { el.remove(); }, 1300);
  }

  function getBonesPerSecond() {
    var now = Date.now();
    // Keep only bones from the last 5 seconds
    boneTimestamps = boneTimestamps.filter(function (t) { return now - t < 5000; });
    return boneTimestamps.length / 5;
  }

  function updateStreak() {
    var bps = getBonesPerSecond();
    var rounded = Math.round(bps * 10) / 10;

    if (rounded < 0.5) {
      boneStreakEl.textContent = '';
      boneStreakEl.className = 'bone-streak';
    } else if (rounded < 2) {
      boneStreakEl.textContent = rounded + '/sec';
      boneStreakEl.className = 'bone-streak';
    } else if (rounded < 4) {
      boneStreakEl.textContent = rounded + '/sec';
      boneStreakEl.className = 'bone-streak hot';
    } else {
      boneStreakEl.textContent = rounded + '/sec';
      boneStreakEl.className = 'bone-streak fire';
    }

    // Frenzy threshold: 3+ bones per second
    if (bps >= 3 && !isFrenzy) {
      startFrenzy();
    } else if (bps < 1.5 && isFrenzy) {
      endFrenzy();
    }

    // Update frenzy multiplier while active
    if (isFrenzy) {
      frenzyMulti = Math.floor(bps * 2);
      boneFrenzyMultiEl.textContent = 'x' + frenzyMulti;
    }
  }

  function startFrenzy() {
    isFrenzy = true;
    frenzyMulti = 1;
    boneFrenzyEl.classList.add('active');
    dogFrame.classList.add('frenzy');
  }

  function endFrenzy() {
    isFrenzy = false;
    frenzyMulti = 0;
    boneFrenzyEl.classList.remove('active');
    dogFrame.classList.remove('frenzy');
  }

  function addBone(fromBot) {
    boneCount++;
    boneCountEl.textContent = boneCount;
    boneTimestamps.push(Date.now());

    // Each bone extends dog screen time by 0.5s
    dogBonusTime += 500;

    // Spawn floating bone near the button area
    var rect = boneBtn.getBoundingClientRect();
    var x = rect.left + rect.width / 2 + (Math.random() * 60 - 30);
    var y = rect.top + (Math.random() * 10);
    spawnBone(x, y);

    // During frenzy, spawn extra bones for visual intensity
    if (isFrenzy) {
      var ex = rect.left + rect.width / 2 + (Math.random() * 100 - 50);
      var ey = rect.top + (Math.random() * 20 - 10);
      spawnBone(ex, ey);
    }

    // Bounce the button
    if (!fromBot) {
      boneBtn.style.transform = 'scale(1.25)';
      setTimeout(function () { boneBtn.style.transform = ''; }, 100);
    }

    updateStreak();
  }

  // Update streak display regularly (so it decays when bones stop)
  setInterval(updateStreak, 500);

  boneBtn.addEventListener('click', function () {
    addBone(false);
  });

  // Fake bot bone spam — bots react every 2-6s, faster during frenzy
  setInterval(function () {
    if (isFrenzy) {
      // Bots get excited during frenzy
      addBone(true);
      if (Math.random() > 0.5) addBone(true);
    } else if (Math.random() > 0.4) {
      addBone(true);
    }
  }, 2000 + Math.random() * 4000);

})();
