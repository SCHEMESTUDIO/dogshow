/* ═══════════════════════════════════════════════
   Dog Show — app.js
   Slideshow, real-time chat via PartyKit, bone frenzy.
   Falls back to local fake chat if WebSocket fails.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── CONFIG ─────────────────────────────────────

  // PartyKit server URL — update after deploying party server
  var PARTY_HOST = 'dogshow.schemestudio.partykit.dev';
  var PARTY_ROOM = 'dogshow-live';
  var ws = null;
  var wsConnected = false;
  var myUsername = 'viewer_' + Math.floor(Math.random() * 9999);

  // Tier detection from URL
  var params = new URLSearchParams(window.location.search);
  var tier = params.get('tier') || 'free';
  var isFreeUser = (tier === 'free');

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

  // Fallback data for when WebSocket is not connected
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
    'RARE DOG RARE DOG',
    'LIFETIME MEMBER HERE. I LIVE HERE NOW.',
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
  var viewerCount = 1;
  var boneCount = 0;
  var boneTimestamps = [];
  var isFrenzy = false;
  var frenzyMulti = 0;
  var dogTimer = null;
  var dogBaseTime = 5000;
  var dogBonusTime = 0;

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

    // Intermission every 5 dogs
    if (currentIndex > 1 && currentIndex % 5 === 0) {
      startIntermission();
      setTimeout(function () {
        endIntermission();
        nextDog();
      }, 8000);
      return;
    }

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

    // Tell server about new dog (resets shared bone count)
    wsSend({ type: 'newdog' });

    // Briefly fade out, then show new dog
    dogImage.classList.remove('loaded');
    setTimeout(function () {
      showDog(url, name);
    }, 300);

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
    dogTimer = setTimeout(function () {
      if (dogBonusTime > 0) {
        var bonus = Math.min(dogBonusTime, 15000);
        dogBonusTime = 0;
        dogTimer = setTimeout(function () {
          nextDog();
          scheduleDog();
        }, bonus);
      } else {
        nextDog();
        scheduleDog();
      }
    }, dogBaseTime);
  }
  scheduleDog();

  // ─── CHAT DISPLAY ─────────────────────────────

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

    if (chatMessages.children.length > 80) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ─── SEND MESSAGES ─────────────────────────────

  function sendUserMessage() {
    var msg = chatInput.value.trim();
    if (!msg) return;

    // Show locally immediately
    addChatMessage('you', msg, { isMe: true });

    // Send to server
    wsSend({
      type: 'chat',
      user: myUsername,
      text: msg,
    });

    chatInput.value = '';
  }

  if (isFreeUser) {
    chatInput.disabled = true;
    chatInput.placeholder = '🔒 Chat is for paid members';
    chatSend.disabled = true;
    chatSend.style.opacity = '0.4';
    chatSend.style.cursor = 'not-allowed';
    chatInput.style.cursor = 'not-allowed';
  } else {
    chatSend.addEventListener('click', sendUserMessage);
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendUserMessage();
    });
  }

  // ─── VIEWER COUNT ───────────────────────────────

  viewerCountEl.textContent = viewerCount;

  // Fallback viewer count sim (only when offline)
  var fakeViewerInterval = setInterval(function () {
    if (wsConnected) return;
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

    if (bps >= 3 && !isFrenzy) {
      startFrenzy();
    } else if (bps < 1.5 && isFrenzy) {
      endFrenzy();
    }

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

  function addBone(fromRemote) {
    boneCount++;
    boneCountEl.textContent = boneCount;
    boneTimestamps.push(Date.now());
    dogBonusTime += 500;

    var rect = boneBtn.getBoundingClientRect();
    var x = rect.left + rect.width / 2 + (Math.random() * 60 - 30);
    var y = rect.top + (Math.random() * 10);
    spawnBone(x, y);

    if (isFrenzy) {
      var ex = rect.left + rect.width / 2 + (Math.random() * 100 - 50);
      var ey = rect.top + (Math.random() * 20 - 10);
      spawnBone(ex, ey);
    }

    if (!fromRemote) {
      boneBtn.style.transform = 'scale(1.25)';
      setTimeout(function () { boneBtn.style.transform = ''; }, 100);
    }

    updateStreak();
  }

  setInterval(updateStreak, 500);

  if (isFreeUser) {
    boneBtn.disabled = true;
    boneBtn.style.opacity = '0.4';
    boneBtn.style.cursor = 'not-allowed';
    boneBtn.title = 'Upgrade to give bones!';
  } else {
    boneBtn.addEventListener('click', function () {
      addBone(false);
      // Send bone to server
      wsSend({ type: 'bone', user: myUsername });
    });
  }

  // Fallback bot bones (only when offline)
  var fakeBoneInterval = setInterval(function () {
    if (wsConnected) return;
    if (isFrenzy) {
      addBone(true);
      if (Math.random() > 0.5) addBone(true);
    } else if (Math.random() > 0.4) {
      addBone(true);
    }
  }, 2000 + Math.random() * 4000);

  // ─── PARTYKIT WEBSOCKET ─────────────────────────

  function wsSend(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function connectPartyKit() {
    try {
      ws = new WebSocket('wss://' + PARTY_HOST + '/party/' + PARTY_ROOM);
    } catch (e) {
      console.log('PartyKit: connection failed, using local fallback');
      startFallbackChat();
      return;
    }

    ws.onopen = function () {
      wsConnected = true;
      console.log('PartyKit: connected');
    };

    ws.onmessage = function (event) {
      var data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (data.type === 'sync') {
        // Initial state from server
        boneCount = data.boneCount || 0;
        boneCountEl.textContent = boneCount;
        viewerCount = data.viewers || 1;
        viewerCountEl.textContent = viewerCount;

        // Load recent messages
        if (data.messages) {
          data.messages.forEach(function (m) {
            addChatMessage(m.user, m.text, {
              isVip: m.isVip,
              skin: m.skin,
            });
          });
        }
      }

      if (data.type === 'chat') {
        // Don't echo our own messages (already shown locally)
        if (data.user === myUsername) return;
        addChatMessage(data.user, data.text, {
          isVip: data.isVip,
          skin: data.skin,
        });
      }

      if (data.type === 'bone') {
        // Remote bone — animate it but don't double-count our own
        if (data.from === myUsername && !data.isBot) return;
        addBone(true);
      }

      if (data.type === 'bone_reset') {
        boneCount = 0;
        boneCountEl.textContent = '0';
      }

      if (data.type === 'viewers') {
        viewerCount = data.count;
        viewerCountEl.textContent = viewerCount;
      }
    };

    ws.onclose = function () {
      wsConnected = false;
      console.log('PartyKit: disconnected, retrying in 3s');
      setTimeout(connectPartyKit, 3000);
    };

    ws.onerror = function () {
      wsConnected = false;
      console.log('PartyKit: error, falling back to local chat');
      startFallbackChat();
    };
  }

  // ─── FALLBACK LOCAL CHAT ────────────────────────

  var fallbackStarted = false;

  function startFallbackChat() {
    if (fallbackStarted) return;
    fallbackStarted = true;

    // Simulate viewer count
    viewerCount = Math.floor(Math.random() * 40) + 12;
    viewerCountEl.textContent = viewerCount;

    // Fake chat trickle
    addFakeMessage();
    setInterval(function () {
      addFakeMessage();
    }, 2000 + Math.random() * 4000);
  }

  function addFakeMessage() {
    var user = pick(FAKE_USERS);
    var msg = pick(FAKE_MESSAGES);
    var isVip = Math.random() > 0.7;
    var skin = isVip ? pick(VIP_SKINS) : null;
    var isLt = isVip && Math.random() > 0.8;
    addChatMessage(user, msg, { isVip: isVip, skin: skin, isLifetime: isLt });
  }

  // ─── INIT ───────────────────────────────────────

  // Try to connect to PartyKit; fall back to local if it fails
  connectPartyKit();

  // If not connected after 5s, start fallback
  setTimeout(function () {
    if (!wsConnected) {
      startFallbackChat();
    }
  }, 5000);

})();
