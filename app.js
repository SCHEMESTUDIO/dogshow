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
  // 2026-05-26: bones-as-currency model. A registered user (any tier) can
  // chat + send bones; an unregistered visitor sees the register prompt on
  // first interaction. `myBones` is updated by the server via `boneBalance`
  // messages; `null` means "unknown until server tells us".
  var isRegistered = !!sessionToken;
  var myBones = null;

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
  // (frenzyMulti / streak readouts removed — frenzy is now purely visual)
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
  // BONE FRENZY text badge — toggles .active when isFrenzy is on.
  var boneFrenzyEl = document.getElementById('boneFrenzy');
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
  if (dogNameInit) dogNameInit.textContent = 'The curtain is about to rise…';

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
  var pendingDogSubmission = null; // an upload waiting on a username (see submitDogImage)

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

    // Resume an upload that was waiting on the username (see submitDogImage).
    function resumePendingUpload() {
      if (pendingDogSubmission) {
        var p = pendingDogSubmission;
        pendingDogSubmission = null;
        submitDogImage(p.dataUrl, p.dogName, p.breed, p.slotAt);
      }
    }

    // Save to server, then resume. We resume even if the save fails — the
    // upload also carries the username, so the dog still gets the right name.
    if (sessionToken) {
      fetch(API_BASE + '/set-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken, username: name }),
      }).then(resumePendingUpload, resumePendingUpload);
    } else {
      resumePendingUpload();
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

    // Show locally immediately. Use the user's actual display name (not the
    // literal "you") so the chat reads consistently — myUsername is what the
    // server broadcasts back for everyone else's view, and what shows up on
    // any echo this client receives.
    addChatMessage(myUsername, msg, { isMe: true });

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
      // Note: under the new bones-as-currency model, unregistered users hit
      // showRegisterModal('chat') first. This path is preserved as a fallback
      // for any code path that still calls showUpgradeModal('chat') — it now
      // pitches the dog entry rather than a chat-only purchase.
      upgradeIcon.innerHTML = '&#128172;';
      upgradeTitle.textContent = 'Enter your dog and chat freely.';
      upgradeSubtitle.textContent = 'Free registration includes chat and 250 bones. Pay $3.99 to enter your own dog.';
      upgradePrimary.textContent = 'Enter Your Dog — $3.99';
      upgradePrimary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      upgradeSecondary.textContent = 'Premium — 1,000 bones for $5.99';
      upgradeSecondary.onclick = function() { window.location.href = '/?scroll=pricing#pricing'; };
      if (upgradeHint) upgradeHint.textContent = 'Includes a permanent dog page and 250 bones to give.';
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

  // 2026-05-26: chat and bones are no longer paid-tier gated. They require
  // *registration* (free + email). Unregistered visitors hit a register modal
  // on first chat/bone interaction; after that, they're in.
  if (!isRegistered) {
    chatInput.placeholder = 'Sign up to chat — free';
    chatInput.style.cursor = 'pointer';
    chatSend.style.cursor = 'pointer';
    chatInput.addEventListener('click', function () { showRegisterModal('chat'); });
    chatSend.addEventListener('click', function () { showRegisterModal('chat'); });
  } else {
    chatSend.addEventListener('click', sendUserMessage);
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendUserMessage();
    });
  }

  // ─── REGISTRATION (BONES MODEL) ─────────────────
  // Inline registration for unregistered visitors who try to chat/bone. No
  // magic-link round-trip — name + email → instant 250 bones → unlock UI.

  var PARTY_API = 'https://' + PARTY_HOST + '/party/' + PARTY_ROOM;
  var registerOverlay = document.getElementById('registerOverlay');
  var registerTitle = document.getElementById('registerTitle');
  var registerSubtitle = document.getElementById('registerSubtitle');
  var registerName = document.getElementById('registerName');
  var registerEmail = document.getElementById('registerEmail');
  var registerSubmit = document.getElementById('registerSubmit');
  var registerCancel = document.getElementById('registerCancel');
  var registerError = document.getElementById('registerError');
  var myBonesPill = document.getElementById('myBonesPill');
  var myBonesPillCount = document.getElementById('myBonesPillCount');

  function showRegisterModal(context) {
    if (!registerOverlay) {
      // Fall back to the old upgrade modal if the registration modal isn't
      // present in the DOM (e.g., during a partial deploy).
      showUpgradeModal(context);
      return;
    }
    if (context === 'bone') {
      registerTitle.textContent = 'Sign up to send bones';
      registerSubtitle.textContent = "It's free. You'll get 250 bones to spend right away.";
    } else {
      registerTitle.textContent = 'Sign up to chat';
      registerSubtitle.textContent = "It's free. You'll get 250 bones too.";
    }
    if (registerError) registerError.textContent = '';
    registerOverlay.classList.add('active');
    setTimeout(function () { if (registerName) registerName.focus(); }, 100);
  }

  function hideRegisterModal() {
    if (registerOverlay) registerOverlay.classList.remove('active');
  }

  function submitRegistration() {
    var name = (registerName && registerName.value || '').trim();
    var email = (registerEmail && registerEmail.value || '').trim();
    if (!name) {
      if (registerError) registerError.textContent = 'Pick a display name.';
      return;
    }
    if (!email || email.indexOf('@') === -1) {
      if (registerError) registerError.textContent = "That email doesn't look right.";
      return;
    }
    if (registerSubmit) {
      registerSubmit.disabled = true;
      registerSubmit.textContent = 'Joining…';
    }
    fetch(PARTY_API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, tier: 'free' }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.body || !res.body.ok) {
          var err = (res.body && res.body.error) || 'Something went wrong. Try again.';
          if (registerError) registerError.textContent = err;
          if (registerSubmit) {
            registerSubmit.disabled = false;
            registerSubmit.textContent = 'Get 250 bones';
          }
          return;
        }
        // Persist credentials. Email is stored so in-show top-up checkout can
        // call /create-checkout without re-prompting (the top-up modal needs
        // it server-side; we already have it from the form).
        sessionToken = res.body.token;
        localStorage.setItem('dogshow_token', sessionToken);
        localStorage.setItem('dogshow_email', email);
        myUsername = name;
        localStorage.setItem('dogshow_username', name);
        hasPickedUsername = true;
        isRegistered = true;
        myBones = (res.body.user && typeof res.body.user.bones === 'number')
          ? res.body.user.bones : 250;
        // Tell the server about our chosen display name (best-effort).
        fetch(PARTY_API + '/set-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sessionToken, username: name }),
        }).catch(function () {});
        updateMyBonesDisplay();
        hideRegisterModal();
        // Reconnect the WebSocket so the server picks up our token and
        // starts treating us as an authenticated user.
        try { if (ws) ws.close(); } catch (e) {}
        connectPartyKit();
        // Rebind chat/bone handlers to the registered-user paths. The
        // simplest reliable way is a page reload — handlers were attached
        // at load and route to showRegisterModal. A full reload also lets
        // any tier-conditional UI elsewhere on the page re-evaluate.
        setTimeout(function () { window.location.reload(); }, 200);
      })
      .catch(function (e) {
        if (registerError) registerError.textContent = 'Network error. Try again.';
        if (registerSubmit) {
          registerSubmit.disabled = false;
          registerSubmit.textContent = 'Get 250 bones';
        }
      });
  }

  if (registerSubmit) registerSubmit.addEventListener('click', submitRegistration);
  if (registerCancel) registerCancel.addEventListener('click', hideRegisterModal);
  if (registerOverlay) {
    registerOverlay.addEventListener('click', function (e) {
      if (e.target === registerOverlay) hideRegisterModal();
    });
  }
  if (registerName) {
    registerName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && registerEmail) registerEmail.focus();
    });
  }
  if (registerEmail) {
    registerEmail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitRegistration();
    });
  }

  // Top-up modal: reuse the existing upgrade overlay, pointed at the $1.99
  // bones-pack SKU. Stripe checkout is triggered directly from here — no
  // landing-page redirect (the landing page's pricing grid no longer shows
  // the bones-pack tier, by design).
  function startBonesPackCheckout() {
    var email = localStorage.getItem('dogshow_email');
    if (!email) {
      // No stored email — should not happen for an authenticated user since
      // /register persists it now, but be defensive: bounce to landing page
      // where the user can re-enter the funnel.
      window.location.href = '/?scroll=pricing#pricing';
      return;
    }
    if (upgradePrimary) {
      upgradePrimary.disabled = true;
      upgradePrimary.textContent = 'Opening checkout…';
    }
    // Forward Faurya cookies as Stripe metadata so Faurya can attribute this
    // in-show top-up to the visitor's session/source (parity with the landing-
    // page checkout in index.html). Without these, Faurya sees the revenue
    // but cannot link it to a marketing channel.
    function readCookie(name) {
      var parts = document.cookie ? document.cookie.split(';') : [];
      for (var i = 0; i < parts.length; i++) {
        var c = parts[i].replace(/^\s+/, '');
        if (c.indexOf(name + '=') === 0) return c.substring(name.length + 1);
      }
      return null;
    }
    fetch(PARTY_API + '/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: 'general',
        email: email,
        faurya_visitor_id: readCookie('faurya_visitor_id') || undefined,
        faurya_session_id: readCookie('faurya_session_id') || undefined,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.url) {
          window.location.href = data.url;
        } else {
          if (upgradeHint) upgradeHint.textContent = (data && data.error) || 'Checkout failed. Try again.';
          if (upgradePrimary) {
            upgradePrimary.disabled = false;
            upgradePrimary.textContent = 'Top up — $1.99';
          }
        }
      })
      .catch(function () {
        if (upgradeHint) upgradeHint.textContent = 'Network error. Try again.';
        if (upgradePrimary) {
          upgradePrimary.disabled = false;
          upgradePrimary.textContent = 'Top up — $1.99';
        }
      });
  }

  function showTopUpModal() {
    if (!upgradeOverlay) return;
    upgradeIcon.innerHTML = '&#129460;';
    upgradeTitle.textContent = "You're out of bones.";
    upgradeSubtitle.textContent = 'Grab 250 more for $1.99.';
    upgradePrimary.textContent = 'Top up — $1.99';
    upgradePrimary.disabled = false;
    upgradePrimary.onclick = startBonesPackCheckout;
    if (upgradeSecondary) {
      upgradeSecondary.textContent = 'Premium — 1,000 bones for $5.99';
      upgradeSecondary.onclick = function () { window.location.href = '/?scroll=pricing#pricing'; };
      upgradeSecondary.hidden = false;
    }
    if (upgradeHint) upgradeHint.textContent = 'Bones support the dogs you love.';
    upgradeOverlay.classList.add('active');
  }

  function updateMyBonesDisplay() {
    if (!myBonesPill || !myBonesPillCount) return;
    if (myBones === null || !isRegistered) {
      myBonesPill.hidden = true;
      return;
    }
    myBonesPill.hidden = false;
    myBonesPillCount.textContent = myBones;
    myBonesPill.classList.toggle('low', myBones > 0 && myBones <= 25);
    myBonesPill.classList.toggle('empty', myBones === 0);
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

  // Detect "lots of bones flying" and toggle a CSS class on the dog frame +
  // dock so the visuals respond. No numerical readout, no multiplier — the
  // sensory cue is the point. The threshold hysteresis (3 → on, 1.5 → off)
  // keeps the visual from flickering at the boundary.
  function updateStreak() {
    var bps = getBonesPerSecond();
    if (bps >= 3 && !isFrenzy) {
      startFrenzy();
    } else if (bps < 1.5 && isFrenzy) {
      endFrenzy();
    }
  }

  function startFrenzy() {
    isFrenzy = true;
    dogFrame.classList.add('frenzy');
    if (dockBar) dockBar.classList.add('frenzy');
    if (boneFrenzyEl) boneFrenzyEl.classList.add('active');
    playFrenzyVoice();
  }

  function endFrenzy() {
    isFrenzy = false;
    dogFrame.classList.remove('frenzy');
    if (dockBar) dockBar.classList.remove('frenzy');
    if (boneFrenzyEl) boneFrenzyEl.classList.remove('active');
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
      playBoneClick();
    }

    updateStreak();
  }

  setInterval(updateStreak, 500);

  // ─── SOUND EFFECTS ───────────────────────────────
  // Bone click: a short, percussive "coin-grab" pop synthesized via Web Audio.
  // No external asset needed; works offline, no preload delay. AudioContext
  // is lazily created on first user gesture so autoplay policies are happy.
  var _audioCtx = null;
  function getAudioCtx() {
    if (_audioCtx) return _audioCtx;
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
    return _audioCtx;
  }
  function playBoneClick() {
    var ctx = getAudioCtx();
    if (!ctx) return;
    try {
      var t = ctx.currentTime;
      // Quick rising blip — like grabbing a coin in a game.
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(640, t);
      osc.frequency.exponentialRampToValueAtTime(960, t + 0.06);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  // Bone frenzy voice: real recording at /sounds/bone-frenzy.m4a. Falls back
  // to browser speech synthesis only if the file fails to load (defensive —
  // shouldn't happen in normal operation).
  var _frenzyAudio = null;
  var _frenzyAudioFailed = false;
  function playFrenzyVoice() {
    // Prefer the asset; cache the Audio object so we don't reload on every
    // frenzy trigger.
    if (!_frenzyAudioFailed) {
      if (!_frenzyAudio) {
        _frenzyAudio = new Audio('/sounds/bone-frenzy.m4a');
        _frenzyAudio.volume = 0.85;
        _frenzyAudio.addEventListener('error', function () {
          _frenzyAudioFailed = true;
        });
      }
      try {
        _frenzyAudio.currentTime = 0;
        var p = _frenzyAudio.play();
        // play() returns a promise on modern browsers; on failure fall
        // through to speech synth.
        if (p && typeof p.then === 'function') {
          p.catch(function () {
            _frenzyAudioFailed = true;
            speakFrenzy();
          });
          return;
        }
        return;
      } catch (e) {
        _frenzyAudioFailed = true;
      }
    }
    speakFrenzy();
  }
  function speakFrenzy() {
    try {
      if (!('speechSynthesis' in window)) return;
      var u = new SpeechSynthesisUtterance('Bone Frenzy!');
      u.rate = 1.05;
      u.pitch = 0.85;
      u.volume = 0.9;
      window.speechSynthesis.cancel();  // cut any in-flight utterance
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  if (!isRegistered) {
    boneBtn.style.cursor = 'pointer';
    boneBtn.addEventListener('click', function () { showRegisterModal('bone'); });
  } else {
    boneBtn.addEventListener('click', function () {
      // Server enforces balance — it'll send `needTopUp` if we're empty and
      // refuse to broadcast. We still animate optimistically; the server's
      // bone broadcast is what other clients see.
      addBone(false);
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
      // Register as unique fan. If we have a session token, send it so the
      // server can identify us — that unlocks bone-balance enforcement
      // (server tracks our balance and tells us when we're empty).
      wsSend({ type: 'join', fanId: myFanId, token: sessionToken || undefined });
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
          nameplate.innerHTML = '<div class="dog-nameplate-label">Now presenting</div><div class="dog-nameplate-name">' + data.currentDog.name + '</div><span class="community-badge">submitted by ' + data.currentDog.submittedBy + '</span>';
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
          nameplate.innerHTML = '<div class="dog-nameplate-label">Now presenting</div><div class="dog-nameplate-name">' + data.dog.name + '</div><span class="community-badge">submitted by ' + data.dog.submittedBy + '</span>';
        } else {
          nameplate.classList.remove('community');
          var dogNameEl = document.getElementById('dogName');
          if (dogNameEl) {
            dogNameEl.textContent = data.dog ? data.dog.name : '...';
          } else {
            nameplate.innerHTML = '<div class="dog-nameplate-label">Now presenting</div><div class="dog-nameplate-name" id="dogName">' + (data.dog ? data.dog.name : '...') + '</div>';
          }
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

      if (data.type === 'boneBalance') {
        // Server is telling us our authoritative bone balance. Mirror it
        // locally and update the UI pill (if rendered).
        myBones = typeof data.bones === 'number' ? data.bones : myBones;
        updateMyBonesDisplay();
      }

      if (data.type === 'needTopUp') {
        // Server rejected a bone because we're out. Show the top-up modal.
        myBones = 0;
        updateMyBonesDisplay();
        if (typeof showTopUpModal === 'function') {
          showTopUpModal();
        }
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

  // Clean dogshow.lol URL — was previously a PartyKit endpoint that served
  // dynamic OG HTML, but exposed schemestudio.partykit.dev in social previews.
  // OG/Twitter tags now live in show.html directly; static og-image.png at /.
  var shareUrl = 'https://dogshow.lol/show.html';
  var shareText = "I'm watching The Dog Show — a live dog-viewing experience. Come watch dogs with me!";
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  function buildShareRail() {
    if (!showShareButtons) return;
    showShareButtons.innerHTML = '';

    var hasNativeShare = isMobile && navigator.share;

    // Native share (mobile) — if available, show this + copy only
    if (hasNativeShare) {
      var nBtn = document.createElement('button');
      nBtn.className = 's-native';
      nBtn.textContent = 'Share...';
      nBtn.addEventListener('click', function() {
        navigator.share({ title: 'The Dog Show', text: shareText, url: shareUrl }).catch(function(){});
      });
      showShareButtons.appendChild(nBtn);
    }

    // On mobile with native share, skip individual buttons — just show Share + Copy
    if (!hasNativeShare) {
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

      // Instagram
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
    }

    // Copy — always shown
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
  var dockError = document.getElementById('dockError');
  var dockErrorText = document.getElementById('dockErrorText');
  var dockErrorRetry = document.getElementById('dockErrorRetry');
  var uploadModalOverlay = document.getElementById('uploadModalOverlay');
  var uploadDogName = document.getElementById('uploadDogName');
  var uploadDogBreed = document.getElementById('uploadDogBreed');
  var uploadModalError = document.getElementById('uploadModalError');
  var uploadModalCancel = document.getElementById('uploadModalCancel');
  var uploadModalSubmit = document.getElementById('uploadModalSubmit');
  var pendingUploadFile = null;
  if (window.populateBreedSelect) window.populateBreedSelect(uploadDogBreed);

  // ── Paid-user row: upload prompt, or a link to the user's dog ──
  // Free + general tiers don't see an upload button here (the $3.99 CTA lives
  // in the house rotator below). Premium buyers see either the upload prompt
  // or — once they have a dog — a persistent link to that dog's certificate.
  var bottomDock = document.getElementById('bottomDock');

  // Admin-key passthrough: lets the site owner's own test uploads bypass the
  // one-dog-per-account limit. Supplied once via ?admin=KEY, then remembered.
  var adminKey = params.get('admin');
  if (adminKey) localStorage.setItem('dogshow_admin_key', adminKey);
  adminKey = adminKey || localStorage.getItem('dogshow_admin_key') || null;

  // Render the "dog is in the show" state with a link to its certificate page.
  function showDogCertificate(slug, id, pending) {
    if (communityUpload) communityUpload.hidden = true;
    clearUploadError();
    if (dockStatus) dockStatus.hidden = false;
    if (dockStatusDot) dockStatusDot.className = 'dock-status-dot' + (pending ? ' pending' : '');
    if (dockStatusText) {
      dockStatusText.textContent = pending ? 'Submitted — waiting to appear'
                                           : 'Your dog is in the show';
    }
    if (dockDogLink && (slug || id)) {
      dockDogLink.href = 'https://dogshow.lol/d/' + (slug || id);
      dockDogLink.hidden = false;
    }
    if (dockPatience) dockPatience.hidden = !pending;
  }

  // Render the upload prompt for a premium user who has no dog yet.
  function showUploadPrompt() {
    if (communityUpload) communityUpload.hidden = false;
    if (dockStatus) dockStatus.hidden = true;
    if (uploadBtn) {
      uploadBtn.textContent = '📸 Upload your dog now';
      uploadBtn.className = 'dock-enter-btn paid-user-upload-btn';
      uploadBtn.disabled = false;
    }
  }

  // Consume a pre-purchase photo stashed in localStorage — but only if it is
  // fresh. A stale photo (from an earlier, abandoned checkout) is discarded,
  // never submitted, so it can't surface as the wrong dog (audit: stale
  // localStorage handoff). The original drop-on-entry fix is audit #37.
  // Clear the stashed pre-purchase dog from localStorage. Called ONLY once the
  // server has confirmed the dog (upload ok / already_have_dog) or when the
  // stash is junk/stale — never before a successful upload. This is what makes
  // abandoning the username modal non-destructive: the stash survives so the
  // dog can be re-submitted on the next visit (audit M3).
  function clearPendingDog() {
    localStorage.removeItem('dogshow_pending_dog_image');
    localStorage.removeItem('dogshow_pending_dog_name');
    localStorage.removeItem('dogshow_pending_dog_breed');
    localStorage.removeItem('dogshow_pending_dog_slot');
    localStorage.removeItem('dogshow_pending_dog_ts');
  }

  function autoSubmitPendingDog() {
    var pendingImage = localStorage.getItem('dogshow_pending_dog_image');
    var pendingName = localStorage.getItem('dogshow_pending_dog_name');
    var pendingBreed = localStorage.getItem('dogshow_pending_dog_breed');
    var pendingSlot = localStorage.getItem('dogshow_pending_dog_slot');
    var pendingTs = parseInt(localStorage.getItem('dogshow_pending_dog_ts') || '0', 10);
    // Junk or stale handoff — discard it (nothing worth keeping or retrying).
    if (!pendingImage || pendingImage.indexOf('data:image/') !== 0) { clearPendingDog(); return; }
    // A real checkout takes minutes; anything older than 45 min is leftover.
    if (!pendingTs || (Date.now() - pendingTs) > 45 * 60 * 1000) { clearPendingDog(); return; }
    // Parse the optional slot timestamp. Server validates; we just hand it on.
    var slotAt = null;
    if (pendingSlot) {
      var n = Number(pendingSlot);
      if (Number.isFinite(n) && n > Date.now()) slotAt = n;
    }
    // NB: we deliberately do NOT clear the stash here. submitDogImage clears it
    // only after the server confirms the dog. If the buyer abandons the
    // username modal, the stash remains and is retried next visit (audit M3).
    // Double-submit-safe: PartyKit serializes the room's requests and enforces
    // one-dog-per-account (409 already_have_dog, handled below), and the
    // /my-dog check clears the stash when a dog already exists.
    submitDogImage(pendingImage, pendingName || 'A Good Dog', pendingBreed || '', slotAt);
  }

  if (tier === 'premium' && sessionToken) {
    // Ask the server for the real tier + any existing dog before deciding what
    // to show. The ?tier= URL param alone is not trusted (a refunded account
    // still arrives with tier=premium in the link). Falls back to the upload
    // prompt if the lookup fails.
    fetch(API_BASE + '/my-dog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok && data.tier !== 'premium') {
          // Account isn't actually premium (e.g. refunded) — no upload UI.
          if (bottomDock) bottomDock.hidden = true;
          return;
        }
        if (bottomDock) bottomDock.hidden = false;
        if (data && data.ok && data.dog) {
          // Already has a dog — show the certificate link and drop any
          // leftover pending photo so it can't be re-submitted.
          clearPendingDog();
          showDogCertificate(data.dog.slug, data.dog.id, false);
          return;
        }
        // Premium, no dog yet — show the prompt, then auto-submit a fresh
        // pre-purchase photo if one is waiting.
        showUploadPrompt();
        autoSubmitPendingDog();
      })
      .catch(function () {
        // Lookup failed — show the prompt and still try the pending photo. A
        // duplicate upload is caught server-side ('already_have_dog').
        if (bottomDock) bottomDock.hidden = false;
        showUploadPrompt();
        autoSubmitPendingDog();
      });
  }
  // For free + general, leave bottomDock + communityUpload hidden.

  if (uploadBtn) {
    uploadBtn.addEventListener('click', function () {
      uploadInput.click();
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      clearUploadError();

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        showUploadStatus('Please upload a JPEG, PNG, or WebP image.', true, 'bad_file_type');
        return;
      }

      // Validate size (max 5MB before resize)
      if (file.size > 5 * 1024 * 1024) {
        showUploadStatus('Image too large (max 5MB).', true, 'file_too_large');
        return;
      }

      // Photo is valid — collect name + breed in the modal, then upload.
      pendingUploadFile = file;
      openUploadModal();
    });
  }

  function resizeAndUpload(file, dogName, breed) {
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

        // Convert to JPEG at 0.7 quality, then hand off to the shared submitter.
        var dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        submitDogImage(dataUrl, dogName, breed);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // POST a prepared image data URL to the server. Shared by the in-show upload
  // (after resizing a picked file) and by the pre-purchase auto-submit above.
  function submitDogImage(dataUrl, dogName, breed, slotAt) {
    // A dog must never be created as "Anonymous". If the uploader hasn't
    // picked a display name yet, stash this submission, prompt for the name,
    // and resume once it's set (see submitUsername).
    if (!hasPickedUsername) {
      pendingDogSubmission = { dataUrl: dataUrl, dogName: dogName, breed: breed, slotAt: slotAt };
      showUsernameModal();
      return;
    }
    clearUploadError();
    if (uploadBtn) {
      uploadBtn.textContent = 'Uploading...';
      uploadBtn.disabled = true;
    }

    fetch(API_BASE + '/upload-dog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: sessionToken,
        imageData: dataUrl,
        dogName: dogName,
        breed: breed || '',
        username: myUsername,
        adminKey: adminKey || undefined,
        slotAt: slotAt || undefined,  // Phase 3: optional scheduled slot
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          // Server confirmed the dog exists — now it's safe to drop the stash
          // (audit M3: never clear before this point).
          clearPendingDog();
          showDogCertificate(data.slug, data.id, true);
          // After a bit, switch from "waiting" to "live".
          setTimeout(function () {
            if (dockStatusDot) dockStatusDot.className = 'dock-status-dot';
            if (dockStatusText) dockStatusText.textContent = 'Your dog is live';
            if (dockPatience) dockPatience.hidden = true;
          }, 60000);
        } else if (data.code === 'already_have_dog') {
          // Not a failure — they already have a dog. Show its certificate link
          // instead of a dead-end error (audit: returning-user upload flow).
          clearPendingDog();
          showDogCertificate(data.slug, data.id, false);
        } else {
          showUploadStatus(data.error || 'Upload failed.', true, data.code || 'server_rejected');
          if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '📸 Upload your dog now';
          }
          if (uploadInput) uploadInput.value = '';  // Reset so they can try again
        }
      })
      .catch(function () {
        showUploadStatus('Upload failed. Try again.', true, 'network');
        if (uploadBtn) {
          uploadBtn.disabled = false;
          uploadBtn.textContent = '📸 Upload your dog now';
        }
      });
  }

  function clearUploadError() {
    if (dockError) dockError.hidden = true;
  }

  function showUploadStatus(msg, isError, code) {
    if (!isError) return;
    // Persistent inline error — replaces the old alert() that mobile users
    // routinely missed (platform audit Critical-4 / the Emily incident).
    if (dockError && dockErrorText) {
      dockErrorText.textContent = msg;
      dockError.hidden = false;
    } else if (typeof alert === 'function') {
      alert(msg); // defensive fallback if the markup is missing
    }
    // Emit a specific, queryable error label so upload failures are observable.
    var label = 'upload_error_' + (code || 'unknown');
    try {
      if (window.gtag) {
        window.gtag('event', label, { event_category: 'upload', event_label: code || 'unknown' });
      }
    } catch (e) {}
    try {
      if (window.uetq) {
        window.uetq.push('event', label, { event_category: 'upload' });
      }
    } catch (e) {}
  }

  if (dockErrorRetry) {
    dockErrorRetry.addEventListener('click', function () {
      clearUploadError();
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '📸 Upload your dog now';
      }
      if (uploadInput) {
        uploadInput.value = '';
        uploadInput.click();
      }
    });
  }

  // ─── DOG DETAILS MODAL (#48 — name + breed picker) ───
  function openUploadModal() {
    if (!uploadModalOverlay) return;
    if (uploadDogName) uploadDogName.value = '';
    if (uploadDogBreed) uploadDogBreed.value = '';
    if (uploadModalError) uploadModalError.textContent = '';
    if (uploadModalSubmit) {
      uploadModalSubmit.disabled = false;
      uploadModalSubmit.textContent = 'Add to the show';
    }
    uploadModalOverlay.classList.add('active');
    setTimeout(function () { if (uploadDogName) uploadDogName.focus(); }, 100);
  }

  function closeUploadModal() {
    if (uploadModalOverlay) uploadModalOverlay.classList.remove('active');
  }

  function cancelUploadModal() {
    closeUploadModal();
    pendingUploadFile = null;
    if (uploadInput) uploadInput.value = '';
  }

  if (uploadModalSubmit) {
    uploadModalSubmit.addEventListener('click', function () {
      var name = ((uploadDogName && uploadDogName.value) || '').trim();
      var breed = ((uploadDogBreed && uploadDogBreed.value) || '').trim();
      if (!name) {
        if (uploadModalError) uploadModalError.textContent = "Please enter your dog's name.";
        return;
      }
      if (!pendingUploadFile) {
        if (uploadModalError) uploadModalError.textContent = 'Something went wrong — please pick the photo again.';
        return;
      }
      closeUploadModal();
      var file = pendingUploadFile;
      pendingUploadFile = null;
      resizeAndUpload(file, name, breed);
    });
  }
  if (uploadModalCancel) {
    uploadModalCancel.addEventListener('click', cancelUploadModal);
  }
  if (uploadModalOverlay) {
    uploadModalOverlay.addEventListener('click', function (e) {
      if (e.target === uploadModalOverlay) cancelUploadModal();
    });
  }

  // ─── HOUSE ROTATOR (mobile layout — real CTA + fake-door cards) ───
  // Replaces the old fixed "Enter Your Dog" dock button. Rotates 5 messages
  // every 15 seconds. The $3.99 entry message is a real CTA → upgrade modal.
  // Premium tier users have it filtered out (they already paid). The other 4
  // messages are fake doors that open an interest-capture modal.

  var ROTATOR_INTERVAL_MS = 15000;
  var ROTATOR_FADE_MS = 200;

  var rotatorMessages = [
    {
      eyebrow: 'Tonight',
      title: 'Put your dog in the show — $3.99',
      cta: 'Enter →',
      action: 'real_entry',
      excludeForTiers: ['premium'],
    },
    {
      eyebrow: 'New feature',
      title: 'Custom stage frames for your dog',
      cta: 'Get notified →',
      action: 'interest',
      feature: 'stage_frames',
      modalIcon: '🎭',
      modalTitle: 'Custom stage frames',
      modalSubtitle: "Coming Soon! Pick a frame that matches your dog — gilded, bone-themed, beach bum, royal velvet. We'll email you when frames launch.",
    },
    {
      // Was a fake door; the $1.99 bones pack is real now. Click goes
      // straight to Stripe checkout. Hidden from unregistered users because
      // the offer doesn't make sense without an account to attach it to —
      // they'd just hit the register modal and never see the actual $1.99
      // purchase they clicked for.
      eyebrow: 'Top up',
      title: '250 more bones for $1.99',
      cta: 'Buy bones →',
      action: 'bones_topup',
      feature: 'bone_packs',
      requiresRegistered: true,
    },
    {
      eyebrow: 'New feature',
      title: "Boost your dog's frequency",
      cta: 'Get notified →',
      action: 'interest',
      feature: 'frequency_boost',
      modalIcon: '⚡',
      modalTitle: "Boost your dog's frequency",
      modalSubtitle: "Coming Soon! Get your dog on stage every 4 hours, every hour, or every 15 minutes. We'll email you when boost packs launch.",
    },
    {
      eyebrow: 'New feature',
      title: 'A funny music video starring your dog',
      cta: 'Get notified →',
      action: 'interest',
      feature: 'funny_video',
      modalIcon: '🎬',
      modalTitle: 'A funny video of your dog',
      modalSubtitle: "Coming Soon! We'll turn your dog's photo into a shareable little video — dancing, singing, the works. Drop your email and we'll let you know when it launches.",
    },
    {
      eyebrow: 'Get involved!',
      title: 'Helping dogs in need',
      cta: 'Learn more →',
      action: 'interest',
      feature: 'rescue_donation',
      modalIcon: '💝',
      modalTitle: 'Helping dogs in need',
      modalSubtitle: 'Coming Soon! Every month we donate to a dog rescue near the dog with the most bones. Drop your email and we will share our plans first.',
    },
  ];

  // Filter out messages excluded for this tier (e.g. premium doesn't see the
  // $3.99 entry CTA) and messages that require a registered account (e.g. the
  // $1.99 bones top-up — pointless to show before the user has an account to
  // attach the purchase to).
  var activeRotatorMessages = rotatorMessages.filter(function (m) {
    if (m.excludeForTiers && m.excludeForTiers.indexOf(tier) !== -1) return false;
    if (m.requiresRegistered && !isRegistered) return false;
    return true;
  });

  var rotatorContainer = document.getElementById('houseRotator');
  var rotatorCard = document.getElementById('houseRotatorCard');
  var rotatorEyebrow = document.getElementById('houseRotatorEyebrow');
  var rotatorTitle = document.getElementById('houseRotatorTitle');
  var rotatorCta = document.getElementById('houseRotatorCta');
  var rotatorDots = document.getElementById('houseRotatorDots');

  var rotatorIndex = 0;
  var rotatorTimer = null;

  function renderRotatorMessage(index) {
    var msg = activeRotatorMessages[index];
    if (!msg || !rotatorTitle) return;
    if (rotatorEyebrow) rotatorEyebrow.textContent = msg.eyebrow || '';
    rotatorTitle.textContent = msg.title;
    if (rotatorCta) rotatorCta.textContent = msg.cta || 'Learn more →';
    if (rotatorDots) {
      Array.prototype.forEach.call(rotatorDots.children, function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }
  }

  function buildRotatorDots() {
    if (!rotatorDots) return;
    rotatorDots.innerHTML = '';
    activeRotatorMessages.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'house-rotator-dot';
      dot.setAttribute('aria-label', 'Show message ' + (i + 1));
      dot.addEventListener('click', function () {
        rotatorIndex = i;
        renderRotatorMessage(i);
        restartRotatorTimer();
      });
      rotatorDots.appendChild(dot);
    });
  }

  function advanceRotator() {
    if (activeRotatorMessages.length < 2) return;
    if (rotatorContainer) rotatorContainer.classList.add('fading');
    setTimeout(function () {
      rotatorIndex = (rotatorIndex + 1) % activeRotatorMessages.length;
      renderRotatorMessage(rotatorIndex);
      if (rotatorContainer) rotatorContainer.classList.remove('fading');
    }, ROTATOR_FADE_MS);
  }

  function restartRotatorTimer() {
    if (rotatorTimer) clearInterval(rotatorTimer);
    if (activeRotatorMessages.length >= 2) {
      rotatorTimer = setInterval(advanceRotator, ROTATOR_INTERVAL_MS);
    }
  }

  function handleRotatorClick() {
    var msg = activeRotatorMessages[rotatorIndex];
    if (!msg) return;
    var label = msg.feature || msg.action;
    try {
      if (window.gtag) {
        window.gtag('event', 'house_rotator_click', {
          event_category: 'engagement',
          event_label: label,
        });
      }
    } catch (e) {}
    try {
      if (window.uetq) {
        window.uetq.push('event', 'house_rotator_click', {
          event_category: 'engagement',
          event_label: label,
        });
      }
    } catch (e) {}

    if (msg.action === 'real_entry') {
      if (typeof showUpgradeModal === 'function') {
        showUpgradeModal('upload');
      } else {
        window.location.href = '/?scroll=pricing#pricing';
      }
    } else if (msg.action === 'bones_topup') {
      // Real product (no longer a fake door). Registered users go straight
      // to Stripe checkout via startBonesPackCheckout; unregistered users
      // hit the inline register modal first — they get 250 free bones on
      // signup, which is the more valuable first conversion anyway.
      if (isRegistered && typeof startBonesPackCheckout === 'function') {
        startBonesPackCheckout();
      } else if (typeof showRegisterModal === 'function') {
        showRegisterModal('bone');
      } else {
        window.location.href = '/?scroll=pricing#pricing';
      }
    } else if (msg.action === 'interest') {
      openInterestModal(msg);
    }
  }

  if (rotatorCard) {
    rotatorCard.addEventListener('click', handleRotatorClick);
  }

  if (activeRotatorMessages.length > 0 && rotatorTitle) {
    buildRotatorDots();
    renderRotatorMessage(0);
    restartRotatorTimer();
  }

  // ─── INTEREST (FAKE-DOOR) MODAL ───
  // Opens when a fake-door card is clicked. Captures email and posts to
  // /register with tier='interest_<feature>' so leads land in the existing
  // user store. Also fires UET + GA4 events for analytics.

  var interestOverlay = document.getElementById('interestOverlay');
  var interestIconEl = document.getElementById('interestIcon');
  var interestTitleEl = document.getElementById('interestTitle');
  var interestSubtitleEl = document.getElementById('interestSubtitle');
  var interestInput = document.getElementById('interestInput');
  var interestError = document.getElementById('interestError');
  var interestCancel = document.getElementById('interestCancel');
  var interestSubmit = document.getElementById('interestSubmit');
  var interestThanks = document.getElementById('interestThanks');
  var interestActions = interestOverlay ? interestOverlay.querySelector('.interest-modal-actions') : null;
  var currentInterestFeature = null;

  function openInterestModal(msg) {
    if (!interestOverlay) return;
    currentInterestFeature = msg.feature || 'unknown';
    if (interestIconEl) interestIconEl.textContent = msg.modalIcon || '✨';
    if (interestTitleEl) interestTitleEl.textContent = msg.modalTitle || msg.title || 'Coming soon';
    if (interestSubtitleEl) {
      interestSubtitleEl.textContent = msg.modalSubtitle || "We'll let you know when this launches.";
      interestSubtitleEl.hidden = false;
    }
    if (interestInput) {
      interestInput.value = '';
      interestInput.classList.remove('error');
      interestInput.hidden = false;
    }
    if (interestError) interestError.textContent = '';
    if (interestSubmit) {
      interestSubmit.disabled = false;
      interestSubmit.textContent = 'Notify me';
    }
    if (interestActions) interestActions.hidden = false;
    if (interestThanks) interestThanks.hidden = true;
    interestOverlay.classList.add('active');
    setTimeout(function () { if (interestInput) interestInput.focus(); }, 100);
  }

  function closeInterestModal() {
    if (interestOverlay) interestOverlay.classList.remove('active');
    currentInterestFeature = null;
  }

  function showInterestThanks() {
    if (interestSubtitleEl) interestSubtitleEl.hidden = true;
    if (interestInput) interestInput.hidden = true;
    if (interestActions) interestActions.hidden = true;
    if (interestThanks) interestThanks.hidden = false;
    setTimeout(closeInterestModal, 1800);
  }

  function submitInterest() {
    if (!interestInput) return;
    var email = (interestInput.value || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      if (interestError) interestError.textContent = 'Please enter a valid email address.';
      interestInput.classList.add('error');
      return;
    }
    if (interestError) interestError.textContent = '';
    interestInput.classList.remove('error');
    if (interestSubmit) {
      interestSubmit.disabled = true;
      interestSubmit.textContent = 'Saving...';
    }

    var featureLabel = currentInterestFeature || 'unknown';
    try {
      if (window.gtag) {
        window.gtag('event', 'fake_door_email_capture', {
          event_category: 'lead',
          event_label: featureLabel,
        });
      }
    } catch (e) {}
    try {
      if (window.uetq) {
        window.uetq.push('event', 'fake_door_email_capture', {
          event_category: 'lead',
          event_label: featureLabel,
        });
      }
    } catch (e) {}

    fetch('https://dogshow.schemestudio.partykit.dev/party/dogshow-live/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        tier: 'interest_' + featureLabel,
      }),
    }).then(showInterestThanks).catch(showInterestThanks);
    // Note: success-path UI regardless of server response. Fake doors are
    // about intent capture; don't trap users on backend errors.
  }

  if (interestCancel) interestCancel.addEventListener('click', closeInterestModal);
  if (interestSubmit) interestSubmit.addEventListener('click', submitInterest);
  if (interestInput) {
    interestInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitInterest();
      if (e.key === 'Escape') closeInterestModal();
    });
  }
  if (interestOverlay) {
    interestOverlay.addEventListener('click', function (e) {
      if (e.target === interestOverlay) closeInterestModal();
    });
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
