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
  var API_BASE = 'https://' + PARTY_HOST + '/party/' + PARTY_ROOM;
  var ws = null;
  var wsConnected = false;

  // Load saved username or generate temporary one
  var myUsername = localStorage.getItem('dogshow_username') || 'viewer_' + Math.floor(Math.random() * 9999);
  var hasPickedUsername = !!localStorage.getItem('dogshow_username');
  var sessionToken = localStorage.getItem('dogshow_token') || null;

  // Unique fan ID (persists across sessions to avoid double-counting)
  var myFanId = localStorage.getItem('dogshow_fan_id');
  if (!myFanId) {
    myFanId = 'fan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('dogshow_fan_id', myFanId);
  }

  // Tier detection: URL param takes priority, then localStorage
  var params = new URLSearchParams(window.location.search);
  var tier = params.get('tier') || localStorage.getItem('dogshow_tier') || 'free';
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


  // ─── STATE ──────────────────────────────────────

  var isIntermission = false;
  var viewerCount = 1;
  var boneCount = 0;
  var boneTimestamps = [];
  var isFrenzy = false;
  var frenzyMulti = 0;
  var dogBonusTime = 0;

  // ─── DOM REFS ───────────────────────────────────

  var dogImage = document.getElementById('dogImage');
  var dogName = document.getElementById('dogName');
  var chatMessages = document.getElementById('chatMessages');
  var chatInput = document.getElementById('chatInput');
  var chatSend = document.getElementById('chatSend');
  var viewerCountEl = document.getElementById('viewerCount');
  var totalFansCountEl = document.getElementById('totalFansCount');
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

  // ─── DOG SLIDESHOW (server-synced) ───────────────

  function showDog(url, name) {
    dogImage.classList.remove('loaded');
    dogImage.onload = function () {
      dogImage.classList.add('loaded');
    };
    dogImage.onerror = function () {
      var el = document.getElementById('dogName');
      if (el) el.textContent = name + ' (shy dog, hiding!)';
    };
    dogImage.src = url;
    var el = document.getElementById('dogName');
    if (el) el.textContent = name;
  }

  function handleNewDog(dog) {
    if (!dog || !dog.url) return;

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
      showDog(dog.url, dog.name);
    }, 300);

    // Show breed fact
    showBreedFact(dog.breed);
  }

  // Show a loading state until server sends the first dog
  var dogNameInit = document.getElementById('dogName');
  if (dogNameInit) dogNameInit.textContent = 'Waiting for the show to start...';

  // ─── CHAT DISPLAY ─────────────────────────────

  function addChatMessage(user, msg, opts) {
    opts = opts || {};
    var div = document.createElement('div');
    div.className = 'chat-msg';

    var isMe = opts.isMe || false;

    var userSpan = document.createElement('span');
    userSpan.className = 'chat-msg-user';
    if (isMe) userSpan.classList.add('me');
    userSpan.style.color = isMe ? '#BB86FC' : '#9B8FD0';
    userSpan.textContent = user;

    var textSpan = document.createElement('span');
    textSpan.className = 'chat-msg-text';
    // Make URLs clickable in chat messages
    var msgWithLinks = (': ' + msg).replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" style="color:#FF8C42;">$1</a>'
    );
    textSpan.innerHTML = msgWithLinks;

    div.appendChild(userSpan);
    div.appendChild(textSpan);
    chatMessages.appendChild(div);

    if (chatMessages.children.length > 80) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ─── USERNAME MODAL ─────────────────────────────

  var usernameModal = document.getElementById('usernameModal');
  var usernameInput = document.getElementById('usernameInput');
  var usernameSubmit = document.getElementById('usernameSubmit');

  function showUsernameModal() {
    if (usernameModal) {
      usernameModal.classList.add('active');
      setTimeout(function () { usernameInput.focus(); }, 100);
    }
  }

  function submitUsername() {
    var name = usernameInput.value.trim().slice(0, 20);
    if (!name) return;
    myUsername = name;
    hasPickedUsername = true;
    localStorage.setItem('dogshow_username', name);
    usernameModal.classList.remove('active');

    // Save to server if logged in
    if (sessionToken) {
      fetch(API_BASE + '/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken, username: name }),
      }).catch(function () {});
    }
  }

  if (usernameSubmit) {
    usernameSubmit.addEventListener('click', submitUsername);
  }
  if (usernameInput) {
    usernameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitUsername();
    });
  }

  // Show modal for paid users who haven't picked a username
  if (!isFreeUser && !hasPickedUsername) {
    showUsernameModal();
  }

  // ─── SEND MESSAGES ─────────────────────────────

  function sendUserMessage() {
    var msg = chatInput.value.trim();
    if (!msg) return;

    // If somehow they haven't picked a username, show modal
    if (!hasPickedUsername) {
      showUsernameModal();
      return;
    }

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

  // ─── UPGRADE MODAL LOGIC ─────────────────────────
  var upgradeOverlay = document.getElementById('upgradeOverlay');
  var upgradeIcon = document.getElementById('upgradeIcon');
  var upgradeTitle = document.getElementById('upgradeTitle');
  var upgradeSubtitle = document.getElementById('upgradeSubtitle');
  var upgradePrimary = document.getElementById('upgradePrimary');
  var upgradeSecondary = document.getElementById('upgradeSecondary');
  var upgradeDismiss = document.getElementById('upgradeDismiss');
  var upgradeHint = document.getElementById('upgradeHint');

  function showUpgradeModal(context) {
    if (!upgradeOverlay) return;
    if (upgradeHint) upgradeHint.textContent = '';
    if (context === 'bone') {
      upgradeIcon.innerHTML = '&#129460;';
      upgradeTitle.textContent = 'Bones are for ticket holders.';
      upgradeSubtitle.textContent = 'Upgrade once and give bones forever.';
      upgradePrimary.textContent = 'Unlock Bones — $1.99';
      upgradePrimary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      upgradeSecondary.textContent = 'Enter Your Dog Instead — $3.99';
      upgradeSecondary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      if (upgradeHint) upgradeHint.textContent = 'Includes bones, chat, and a permanent dog page.';
    } else if (context === 'chat') {
      upgradeIcon.innerHTML = '&#128172;';
      upgradeTitle.textContent = 'Chat is for General Admission and up.';
      upgradeSubtitle.textContent = 'Join the conversation. One payment, lifetime access.';
      upgradePrimary.textContent = 'Join the Crowd — $1.99';
      upgradePrimary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      upgradeSecondary.textContent = 'Enter Your Dog Instead — $3.99';
      upgradeSecondary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      if (upgradeHint) upgradeHint.textContent = 'Includes chat, bones, and a permanent dog page.';
    } else if (context === 'upload') {
      upgradeIcon.innerHTML = '&#128248;';
      upgradeTitle.textContent = 'Your dog needs a ticket to the show.';
      upgradeSubtitle.textContent = 'Enter your dog, get a permanent page, and start collecting bones.';
      upgradePrimary.textContent = 'Enter Your Dog — $3.99';
      upgradePrimary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      upgradeSecondary.hidden = true;
      if (upgradeHint) upgradeHint.textContent = 'Includes chat, unlimited bones, and a permanent certificate page for your dog.';
    }
    upgradeOverlay.classList.add('active');
  }

  if (upgradeDismiss) {
    upgradeDismiss.addEventListener('click', function() {
      upgradeOverlay.classList.remove('active');
      if (upgradeSecondary) upgradeSecondary.hidden = false;
    });
  }
  if (upgradeOverlay) {
    upgradeOverlay.addEventListener('click', function(e) {
      if (e.target === upgradeOverlay) {
        upgradeOverlay.classList.remove('active');
        if (upgradeSecondary) upgradeSecondary.hidden = false;
      }
    });
  }

  if (isFreeUser) {
    chatInput.placeholder = 'Chat is for paid members...';
    chatInput.style.cursor = 'pointer';
    chatSend.style.cursor = 'pointer';
    chatInput.addEventListener('click', function () { showUpgradeModal('chat'); });
    chatSend.addEventListener('click', function () { showUpgradeModal('chat'); });
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
    if (dockBar) dockBar.classList.add('frenzy');
  }

  function endFrenzy() {
    isFrenzy = false;
    frenzyMulti = 0;
    boneFrenzyEl.classList.remove('active');
    dogFrame.classList.remove('frenzy');
    if (dockBar) dockBar.classList.remove('frenzy');
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
      boneBtn.style.transform = 'scale(1.1)';
      setTimeout(function () { boneBtn.style.transform = ''; }, 100);
    }

    updateStreak();
  }

  setInterval(updateStreak, 500);

  if (isFreeUser) {
    boneBtn.style.cursor = 'pointer';
    boneBtn.addEventListener('click', function () { showUpgradeModal('bone'); });
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
      // Register as unique fan
      wsSend({ type: 'join', fanId: myFanId });
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

        // Total fans
        if (data.totalFans) {
          totalFansCountEl.textContent = data.totalFans;
        }

        // Show current dog from server
        if (data.currentDog) {
          showDog(data.currentDog.url, data.currentDog.name);
          showBreedFact(data.currentDog.breed);
        }

        // Community count
        if (data.communityCount) {
          communityNumEl.textContent = data.communityCount;
          communityPluralEl.textContent = data.communityCount === 1 ? '' : 's';
        }

        // Show community dog frame if current dog is community
        if (data.currentDog && data.currentDog.isCommunity) {
          var nameplate = document.getElementById('dogNameplate');
          nameplate.classList.add('community');
          nameplate.innerHTML = '📸 <strong>' + data.currentDog.name + '</strong> <span class="community-badge">submitted by ' + data.currentDog.submittedBy + '</span>';
        }

        // Show intermission if server is in intermission
        if (data.isIntermission) {
          startIntermission();
        }

        // Load recent messages
        if (data.messages) {
          data.messages.forEach(function (m) {
            addChatMessage(m.user, m.text);
          });
        }
      }

      if (data.type === 'totalFans') {
        totalFansCountEl.textContent = data.count;
      }

      if (data.type === 'newdog') {
        // Server sent a new dog — everyone sees the same one
        handleNewDog(data.dog);

        // Show/hide community dog frame
        var nameplate = document.getElementById('dogNameplate');
        if (data.dog && data.dog.isCommunity) {
          nameplate.classList.add('community');
          nameplate.innerHTML = '📸 <strong>' + data.dog.name + '</strong> <span class="community-badge">submitted by ' + data.dog.submittedBy + '</span>';
        } else {
          nameplate.classList.remove('community');
          nameplate.innerHTML = 'Now presenting: <strong id="dogName">' + (data.dog ? data.dog.name : '...') + '</strong>';
        }
      }

      if (data.type === 'communityCount') {
        communityNumEl.textContent = data.count;
        communityPluralEl.textContent = data.count === 1 ? '' : 's';
      }

      if (data.type === 'intermission') {
        if (data.active) {
          startIntermission();
        } else {
          endIntermission();
        }
      }

      if (data.type === 'chat') {
        // Don't echo our own messages (already shown locally)
        if (data.user === myUsername) return;
        addChatMessage(data.user, data.text);
      }

      if (data.type === 'bone') {
        // Remote bone — animate it but don't double-count our own
        if (data.from === myUsername && !data.isBot) return;
        addBone(true);
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
    addChatMessage(user, msg);
  }

  // ─── BREED FACTS / TRIVIA ───────────────────────

  var breedFactEl = document.getElementById('breedFact');
  var breedFactTextEl = document.getElementById('breedFactText');

  var BREED_FACTS = {
    'retriever golden': [
      'Golden Retrievers were originally bred in Scotland in the mid-1800s for retrieving waterfowl.',
      'Goldens have water-repellent double coats that shed heavily twice a year.',
      'A Golden Retriever named Augie held 5 tennis balls in her mouth at once — a world record.',
      'Golden Retrievers are the 3rd most popular dog breed in America.',
    ],
    'labrador retriever': [
      'Labrador Retrievers have been the most popular dog breed in the US for over 30 years.',
      'Labs were originally from Newfoundland, not Labrador — the name stuck anyway.',
      'Labs have webbed toes, making them excellent swimmers.',
      'A Lab\'s coat is so water-resistant it acts almost like a wetsuit.',
    ],
    'german shepherd': [
      'German Shepherds can learn a new command in as few as 5 repetitions.',
      'The first seeing-eye dog in America was a German Shepherd named Buddy.',
      'GSDs have a bite force of about 238 pounds — one of the strongest of any breed.',
      'Rin Tin Tin, a GSD rescued from a WWI battlefield, starred in 27 Hollywood films.',
    ],
    'poodle': [
      'Poodles are the 2nd smartest dog breed, after Border Collies.',
      'That fancy poodle haircut was originally designed to help them swim — puffs of fur protect joints and organs.',
      'Poodles come from Germany, not France. The name comes from the German "pudelin" (to splash).',
      'Elvis Presley loved poodles and gave them as gifts to women he dated.',
    ],
    'bulldog': [
      'Bulldogs can\'t swim. Their heavy heads and short legs make them sink like rocks.',
      'The Bulldog is the mascot of more universities than any other breed.',
      'English Bulldogs were originally bred for bull-baiting in the 1200s.',
      '80% of Bulldog litters are delivered by caesarean section due to their large heads.',
    ],
    'beagle': [
      'Beagles have about 220 million scent receptors — humans have about 5 million.',
      'The USDA employs a "Beagle Brigade" to sniff out contraband food at airports.',
      'Snoopy, the world\'s most famous beagle, debuted in the Peanuts comic strip in 1950.',
      'Beagles are one of the most vocal breeds — they have three distinct vocalizations.',
    ],
    'husky': [
      'Huskies can run up to 100 miles per day at speeds of 10-12 mph.',
      'Their double coat keeps them warm at temperatures as low as -75°F (-60°C).',
      'Huskies have a special membrane behind their retinas that helps them see in low light.',
      'In 1925, a relay of Husky sled dog teams carried diphtheria antitoxin 674 miles across Alaska.',
    ],
    'corgi': [
      'Welsh legend says corgis were ridden by fairy warriors into battle.',
      'Queen Elizabeth II owned more than 30 corgis during her reign.',
      'Despite their short legs, corgis can run up to 25 mph.',
      'Corgi means "dwarf dog" in Welsh.',
    ],
    'dachshund': [
      'Dachshunds were originally bred to hunt badgers — their name literally means "badger dog" in German.',
      'A dachshund named Waldi was the first official Olympic mascot (Munich 1972).',
      'Dachshunds come in over 15 color combinations and 3 coat types.',
      'Hot dogs were originally called "dachshund sausages" — the bun was modeled after the dog.',
    ],
    'pug': [
      'Pugs are one of the oldest breeds, dating back to 400 BC in China.',
      'A group of pugs is called a "grumble."',
      'Pugs were once used by the military — the Dutch credited a pug with saving the Prince of Orange\'s life.',
      'Pugs have 3 times more scent glands than most breeds despite their flat noses.',
    ],
    'rottweiler': [
      'Rottweilers were originally bred to herd cattle and pull carts for butchers.',
      'They are one of the oldest herding breeds, dating back to the Roman Empire.',
      'Rottweilers have one of the strongest bite forces of any domestic dog — about 328 PSI.',
      'Despite their tough reputation, Rottweilers are known to be "leaners" who press against their owners for affection.',
    ],
    'boxer': [
      'Boxers get their name from their tendency to stand on hind legs and "box" with front paws during play.',
      'A Boxer named Brandy holds the Guinness record for the longest tongue on a dog — 17 inches.',
      'Boxers are one of the last breeds to mature — they\'re not considered fully adult until age 3.',
      'Boxers were among the first breeds trained as police dogs in Germany.',
    ],
    'samoyed': [
      'Samoyeds were bred by the Samoyede people of Siberia to herd reindeer and pull sleds.',
      'Their famous "Sammy smile" isn\'t just cute — the upturned mouth prevents drooling, which would freeze into icicles.',
      'Samoyed fur is sometimes spun into yarn — it\'s hypoallergenic and warm as cashmere.',
      'They were essential to polar expeditions — Roald Amundsen used Samoyeds to reach the South Pole.',
    ],
  };

  var GENERAL_FACTS = [
    'Dogs can understand up to 250 words and gestures — about the same as a two-year-old human.',
    'A dog\'s nose print is unique, just like a human fingerprint.',
    'Dogs can smell about 10,000 to 100,000 times better than humans.',
    'The tallest dog ever recorded was a Great Dane named Zeus, standing 44 inches at the shoulder.',
    'Dogs dream just like humans — small dogs dream more frequently than large ones.',
    'Greyhounds can reach speeds of 45 mph, making them the fastest dog breed.',
    'Three dogs survived the sinking of the Titanic — two Pomeranians and one Pekingese.',
    'Dogs have three eyelids — the third one helps keep their eyes moist.',
    'A one-year-old dog is roughly as physically mature as a 15-year-old human.',
    'Dogs curl up when sleeping to protect their organs — a holdover from their wild ancestors.',
    'Puppies are born deaf and blind. They begin to hear and see at around 2 weeks old.',
    'Dogs have about 1,700 taste buds — humans have about 9,000.',
    'The Basenji is the only breed that doesn\'t bark — it yodels instead.',
    'Dogs can be trained to detect certain cancers and low blood sugar in humans.',
    'The Norwegian Lundehund has 6 toes on each foot, an adaptation for climbing cliffs.',
    'Dogs wag their tails to the right when happy and to the left when nervous.',
    'The oldest known dog breed is the Saluki, dating back to ancient Egypt around 329 BC.',
    'A dog\'s sense of smell is so powerful it can detect a teaspoon of sugar in a million gallons of water.',
  ];

  function showBreedFact(breed) {
    if (!breedFactEl || !breedFactTextEl) return;

    var fact = null;

    if (breed) {
      var breedKey = breed.toLowerCase().replace(/_/g, ' ');
      // Try exact match
      if (BREED_FACTS[breedKey]) {
        fact = pick(BREED_FACTS[breedKey]);
      } else {
        // Try partial match
        for (var key in BREED_FACTS) {
          if (breedKey.indexOf(key) !== -1 || key.indexOf(breedKey) !== -1) {
            fact = pick(BREED_FACTS[key]);
            break;
          }
        }
      }
    }

    // Fall back to general fact
    if (!fact) {
      fact = pick(GENERAL_FACTS);
    }

    breedFactTextEl.textContent = fact;
    breedFactEl.hidden = false;
    // Re-trigger animation
    breedFactEl.style.animation = 'none';
    breedFactEl.offsetHeight;
    breedFactEl.style.animation = '';
  }

  // ─── LEADERBOARD ───────────────────────────────

  var leaderboardEl = document.getElementById('leaderboard');
  var leaderboardTopEl = document.getElementById('leaderboardTop');
  var leaderboardRecentEl = document.getElementById('leaderboardRecent');

  function loadLeaderboard() {
    fetch(API_BASE + '/leaderboard')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) return;

        if (data.topDogs && data.topDogs.length > 0) {
          leaderboardEl.hidden = false;
          leaderboardTopEl.innerHTML = '';
          data.topDogs.forEach(function (dog, i) {
            var href = dog.slug ? '/d/' + dog.slug : (dog.id ? 'dog.html?id=' + dog.id : '#');
            var entry = document.createElement('a');
            entry.className = 'leaderboard-entry';
            entry.href = href;
            if (href !== '#') entry.target = '_blank';
            var thumbHtml = dog.imageUrl
              ? '<img class="leaderboard-thumb" src="' + dog.imageUrl + '" alt="' + dog.dogName + '">'
              : '<div class="leaderboard-thumb" style="display:flex;align-items:center;justify-content:center;font-size:24px;">🐕</div>';
            entry.innerHTML =
              thumbHtml +
              '<span class="leaderboard-rank">' + (i + 1) + '</span>' +
              '<div class="leaderboard-info">' +
                '<div class="leaderboard-name">' + dog.dogName + '</div>' +
                '<div class="leaderboard-meta">' + dog.breed + ' &middot; by ' + dog.username + '</div>' +
              '</div>' +
              '<span class="leaderboard-bones">🦴 ' + dog.totalBones + '</span>';
            leaderboardTopEl.appendChild(entry);
          });
        }

        if (data.recentDogs && data.recentDogs.length > 0) {
          leaderboardRecentEl.innerHTML = '';
          data.recentDogs.forEach(function (dog) {
            var href = dog.slug ? '/d/' + dog.slug : (dog.id ? 'dog.html?id=' + dog.id : '#');
            var entry = document.createElement('a');
            entry.className = 'leaderboard-entry';
            entry.href = href;
            if (href !== '#') entry.target = '_blank';
            var thumbHtml = dog.imageUrl
              ? '<img class="leaderboard-thumb" src="' + dog.imageUrl + '" alt="' + dog.dogName + '">'
              : '<div class="leaderboard-thumb" style="display:flex;align-items:center;justify-content:center;font-size:24px;">🐕</div>';
            entry.innerHTML =
              thumbHtml +
              '<span class="leaderboard-rank" style="color: var(--text-faint);">NEW</span>' +
              '<div class="leaderboard-info">' +
                '<div class="leaderboard-name">' + dog.dogName + '</div>' +
                '<div class="leaderboard-meta">' + dog.breed + ' &middot; by ' + dog.username + '</div>' +
              '</div>';
            leaderboardRecentEl.appendChild(entry);
          });
        }
      })
      .catch(function () {});
  }

  // Load leaderboard on page load
  loadLeaderboard();
  // Refresh every 2 minutes
  setInterval(loadLeaderboard, 120000);

  // ─── SHARE RAIL (inline below dock) ─────────────

  var showShareButtons = document.getElementById('showShareButtons');
  var showShareCopied = document.getElementById('showShareCopied');

  var shareUrl = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live/show-meta';
  var shareText = "I'm watching The Dog Show — a live dog-viewing experience. Come watch dogs with me!";
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  function buildShareRail() {
    if (!showShareButtons) return;
    showShareButtons.innerHTML = '';

    // Native share (mobile)
    if (isMobile && navigator.share) {
      var nBtn = document.createElement('button');
      nBtn.className = 's-native';
      nBtn.textContent = 'Share...';
      nBtn.addEventListener('click', function() {
        navigator.share({ title: 'The Dog Show', text: shareText, url: shareUrl }).catch(function(){});
      });
      showShareButtons.appendChild(nBtn);
    }

    // Facebook
    var fbLink = document.createElement('a');
    fbLink.className = 's-facebook';
    fbLink.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl) + '&quote=' + encodeURIComponent(shareText);
    fbLink.target = '_blank';
    fbLink.rel = 'noopener';
    fbLink.textContent = 'Facebook';
    showShareButtons.appendChild(fbLink);

    // X / Twitter
    var twLink = document.createElement('a');
    twLink.className = 's-twitter';
    twLink.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl) + '&hashtags=DogShow';
    twLink.target = '_blank';
    twLink.rel = 'noopener';
    twLink.textContent = 'X';
    showShareButtons.appendChild(twLink);

    // WhatsApp
    var waLink = document.createElement('a');
    waLink.className = 's-whatsapp';
    waLink.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText + '\n' + shareUrl);
    waLink.target = '_blank';
    waLink.rel = 'noopener';
    waLink.textContent = 'WhatsApp';
    showShareButtons.appendChild(waLink);

    // Instagram (opens app / story share on mobile)
    var igLink = document.createElement('a');
    igLink.className = 's-instagram';
    igLink.href = 'https://www.instagram.com/';
    igLink.target = '_blank';
    igLink.rel = 'noopener';
    igLink.textContent = 'Instagram';
    showShareButtons.appendChild(igLink);

    // SMS
    var smsDelim = isIOS ? '&' : '?';
    var smsLink = document.createElement('a');
    smsLink.className = 's-sms';
    smsLink.href = 'sms:' + smsDelim + 'body=' + encodeURIComponent(shareText + ' ' + shareUrl);
    smsLink.textContent = 'SMS';
    showShareButtons.appendChild(smsLink);

    // Copy
    var copyBtn = document.createElement('button');
    copyBtn.className = 's-copy';
    copyBtn.textContent = 'Copy Link';
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(shareUrl).catch(function() {
        var ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
      showShareCopied.classList.add('show');
      setTimeout(function() { showShareCopied.classList.remove('show'); }, 2500);
    });
    showShareButtons.appendChild(copyBtn);
  }

  buildShareRail();

  // ─── COMMUNITY DOG UPLOAD (Premium only) ────────

  var communityUpload = document.getElementById('communityUpload');
  var uploadBtn = document.getElementById('uploadBtn');
  var uploadInput = document.getElementById('uploadInput');
  var communityNumEl = document.getElementById('communityNum');
  var communityPluralEl = document.getElementById('communityPlural');
  var dockStatus = document.getElementById('dockStatus');
  var dockStatusDot = document.getElementById('dockStatusDot');
  var dockStatusText = document.getElementById('dockStatusText');
  var dockDogLink = document.getElementById('dockDogLink');
  var dockPatience = document.getElementById('dockPatience');
  var dockBar = document.getElementById('dockBar');

  // For free users: show upload button but trigger upgrade modal
  var dockRow2 = document.getElementById('dockRow2');
  if (isFreeUser && dockRow2) {
    communityUpload.hidden = false;
    uploadBtn.textContent = '📸 Enter Your Dog';
    uploadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      showUpgradeModal('upload');
    });
  }

  // Show upload button for premium users
  if (tier === 'premium' && sessionToken) {
    communityUpload.hidden = false;
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', function () {
      uploadInput.click();
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        showUploadStatus('Please upload a JPEG, PNG, or WebP image.', true);
        return;
      }

      // Validate size (max 5MB before resize)
      if (file.size > 5 * 1024 * 1024) {
        showUploadStatus('Image too large (max 5MB).', true);
        return;
      }

      // Ask for dog name
      var dogName = prompt("What's your dog's name?") || 'A Good Dog';

      // Resize and upload
      resizeAndUpload(file, dogName);
    });
  }

  function resizeAndUpload(file, dogName) {
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        // Resize to max 600px wide, maintain aspect ratio
        var canvas = document.createElement('canvas');
        var maxWidth = 600;
        var scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG at 0.7 quality
        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Send to server
        fetch(API_BASE + '/upload-dog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: sessionToken,
            imageData: dataUrl,
            dogName: dogName,
          }),
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.ok) {
              var slug = data.slug || data.id;
              var dogPageUrl = 'https://dogshow.lol/d/' + slug;

              // Update dock UI
              communityUpload.hidden = true;
              dockStatus.hidden = false;
              dockStatusDot.className = 'dock-status-dot pending';
              dockStatusText.textContent = 'Submitted — waiting to appear';
              dockDogLink.href = dogPageUrl;
              dockDogLink.hidden = false;
              dockPatience.hidden = false;

              // After a bit, switch to "live" status
              setTimeout(function () {
                dockStatusDot.className = 'dock-status-dot';
                dockStatusText.textContent = 'Your dog is live';
                dockPatience.hidden = true;
              }, 60000);
            } else {
              showUploadStatus(data.error || 'Upload failed.', true);
              uploadBtn.disabled = false;
              uploadInput.value = '';  // Reset so they can try again
            }
          })
          .catch(function () {
            showUploadStatus('Upload failed. Try again.', true);
            uploadBtn.disabled = false;
          });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function showUploadStatus(msg, isError) {
    // Show error as a brief alert since we removed the status element
    if (isError) {
      alert(msg);
    }
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
