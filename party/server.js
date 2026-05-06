// ═══════════════════════════════════════════════
// Dog Show — PartyKit Server
// Real-time chat, shared bone counts, bot seeding,
// user auth (magic link via Resend).
// ═══════════════════════════════════════════════

const SITE_URL = 'https://dogshow.lol';

// Bot pool — each has a personality and message style
const BOTS = [
  { name: 'doglover99', msgs: ['omg look at this one', 'I LOVE THIS DOG', 'ok this might be my favorite', 'my heart', 'NO STOP TOO CUTE', 'i will die for this dog'] },
  { name: 'barkfan', msgs: ['10/10 good dog', 'solid 8/10', 'easy 10', 'hmmm 7/10 but still good', 'ELEVEN OUT OF TEN', 'rating: immaculate'] },
  { name: 'woofwatcher', msgs: ['wait is this actually just dogs', 'yes. yes it is.', "I've been here for 40 minutes", "I can't leave", 'how do i leave', 'still here'] },
  { name: 'puppyperson', msgs: ['someone tell this dog I love them', 'i want to pet this one so bad', 'LOOK AT THE EARS', 'the paws!!!', 'i need this dog in my life'] },
  { name: 'snootboop', msgs: ['boop', 'BOOP', 'would boop 10/10', 'snoot: booped', 'that snoot needs booping', 'boop boop boop'] },
  { name: 'goodboy_greg', msgs: ['THIS IS THE BEST $1.99 I EVER SPENT', 'worth every penny', "I'm showing this to everyone at work", 'legendary', 'money well spent'] },
  { name: 'fetchqueen', msgs: ['ok but the chat is actually the best part', 'who else is watching at 2am', 'this is art', 'dogs.', 'i told my friends about this and they think im weird'] },
  { name: 'pawsitive_vibes', msgs: ['this dog has more charisma than me', 'that dog looks like my boss', 'my therapist is going to hear about this', 'this is better than therapy honestly'] },
  { name: 'treatseeker', msgs: ["I paid $1.99 for this and I'm not even mad", 'is this what the internet was made for', 'take my money', 'best purchase of 2026'] },
  { name: 'zoomies4life', msgs: ['RARE DOG RARE DOG', 'BONE BONE BONE', 'LETS GOOOOO', 'ZOOMIES', 'AHHHHHH', '*throws bones aggressively*'] },
  { name: 'sir_barks_alot', msgs: ['a distinguished gentleman', 'quite refined', 'exquisite specimen', 'rather dashing', 'impeccable floof'] },
  { name: 'the_dog_critic', msgs: ['interesting composition', 'the lighting is superb', 'a bold choice of pose', 'the fur texture tells a story', 'derivative but charming'] },
  { name: 'midnight_howler', msgs: ['its 3am and here i am', 'cant sleep, watching dogs', 'this is what insomnia looks like', 'night crew represent'] },
  { name: 'belly_rub_bandit', msgs: ['THAT BELLY NEEDS RUBS', 'give the belly rub NOW', 'look at that belly', 'flipped for belly rub access'] },
  { name: 'floof_inspector', msgs: ['floof level: maximum', 'floof certified', 'inspecting... yes, very floofy', 'official floof rating: S tier'] },
];


const DOG_NAMES = [
  'Sir Barkington III', 'Princess Fluffernutter', 'Captain Wiggles',
  'Duke of Snootsville', 'Lady Woofsworth', 'Baron von Fetchington',
  'Countess Pawdington', 'Lord Droolsbury', 'Empress Belly Rubs',
  'The Honorable Mr. Sniffs', 'Brigadier Boop', 'Dame Floofington',
  'Chancellor Chomps', 'Viscount Waggles', 'Archduke Zoomies',
  'Madame Snugglesworth', 'General Good Boy', 'Professor Borkenstein',
  'Queen Pawlina', 'Sir Licksalot', 'The Grand Poobah of Paws',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default class DogShowServer {
  constructor(room) {
    this.room = room;
    this.boneCount = 0;
    this.messages = [];       // last 100 messages
    this.botInterval = null;
    this.botJoinLeaveInterval = null;
    this.activeBots = [];          // bots currently "in the room"
    this.totalFans = 0;
    this.fanIds = new Set();

    // Dog slideshow state
    this.currentDog = null;       // { url, name, isCommunity?, submittedBy? }
    this.dogCount = 0;
    this.dogInterval = null;
    this.isIntermission = false;
    this.dogQueue = [];
    this.nameIndex = 0;

    // Community dogs
    this.communityDogs = [];      // [{ id, imageKey, username, uploadedAt }]
    this.communityIndex = 0;
  }

  async onStart() {
    // Load persisted fan count from storage
    this.totalFans = (await this.room.storage.get('totalFans')) || 0;
    const storedIds = (await this.room.storage.get('fanIds')) || [];
    this.fanIds = new Set(storedIds);

    // Load community dogs list
    this.communityDogs = (await this.room.storage.get('communityDogs')) || [];

    // Pre-fetch initial dogs
    await this.fetchDogs();
    this.advanceDog();
  }

  async onConnect(conn, ctx) {
    // Send current state to new connection (including current dog)
    conn.send(JSON.stringify({
      type: 'sync',
      boneCount: this.boneCount,
      messages: this.messages.slice(-50),
      viewers: ([...this.room.getConnections()].length + this.activeBots.length) || 1,
      totalFans: this.totalFans,
      currentDog: this.currentDog,
      isIntermission: this.isIntermission,
      communityCount: this.communityDogs.length,
    }));

    // Broadcast updated viewer count
    this.broadcastViewers();

    // Start bot and dog slideshow if not already running
    if (!this.botInterval) {
      this.startBot();
    }
    if (!this.dogInterval && !this.isIntermission) {
      this.advanceDog();
    }
  }

  onClose(conn) {
    this.broadcastViewers();

    // Stop bot and dog slideshow if no one is connected
    const count = [...this.room.getConnections()].length;
    if (count === 0) {
      if (this.botInterval) {
        clearTimeout(this.botInterval);
        this.botInterval = null;
      }
      if (this.botJoinLeaveInterval) {
        clearInterval(this.botJoinLeaveInterval);
        this.botJoinLeaveInterval = null;
      }
      this.activeBots = [];
      if (this.dogInterval) {
        clearTimeout(this.dogInterval);
        this.dogInterval = null;
      }
    }
  }

  async onMessage(message, sender) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    if (data.type === 'join') {
      const fanId = this.sanitize(data.fanId || '').slice(0, 64);
      if (fanId && !this.fanIds.has(fanId)) {
        this.fanIds.add(fanId);
        this.totalFans++;
        await this.room.storage.put('totalFans', this.totalFans);
        // Persist fan IDs (keep last 50000 to avoid unbounded growth)
        const ids = [...this.fanIds].slice(-50000);
        await this.room.storage.put('fanIds', ids);
        // Broadcast new total
        this.room.broadcast(JSON.stringify({
          type: 'totalFans',
          count: this.totalFans,
        }));
      }
      return;
    }

    if (data.type === 'chat') {
      const msg = {
        type: 'chat',
        user: this.sanitize(data.user || 'anon').slice(0, 20),
        text: this.sanitize(data.text || '').slice(0, 200),
        isVip: !!data.isVip,
        skin: data.skin || null,
        isMe: false,
        ts: Date.now(),
      };
      this.addMessage(msg);
      this.room.broadcast(JSON.stringify(msg));
    }

    if (data.type === 'bone') {
      this.boneCount++;
      // Each bone extends current dog's screen time by 500ms (max 15s total bonus)
      this.dogBonusTime = Math.min((this.dogBonusTime || 0) + 500, 15000);
      this.room.broadcast(JSON.stringify({
        type: 'bone',
        count: this.boneCount,
        from: this.sanitize(data.user || 'anon').slice(0, 20),
      }));
    }

  }

  addMessage(msg) {
    this.messages.push(msg);
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
  }

  // ─── DOG SLIDESHOW (server-controlled) ──────────

  async fetchDogs() {
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random/10');
      const data = await res.json();
      if (data.status === 'success') {
        this.dogQueue = this.dogQueue.concat(data.message);
      }
    } catch (e) {
      // Fallback seed dogs
      this.dogQueue = this.dogQueue.concat([
        'https://images.dog.ceo/breeds/retriever-golden/n02099601_1722.jpg',
        'https://images.dog.ceo/breeds/husky/n02110185_10047.jpg',
        'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_10475.jpg',
        'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg',
        'https://images.dog.ceo/breeds/samoyed/n02111889_10206.jpg',
      ]);
    }
  }

  getNextName() {
    const name = DOG_NAMES[this.nameIndex % DOG_NAMES.length];
    this.nameIndex++;
    return name;
  }

  advanceDog() {
    if (this.isIntermission) return;

    // ─── Record stats for the community dog that just finished ───
    if (this.currentDog && this.currentDog.isCommunity && this.currentDog._communityId) {
      this.recordCommunityDogStats(this.currentDog._communityId);
    }

    this.dogCount++;

    // Intermission every 15 dogs
    if (this.dogCount > 1 && this.dogCount % 15 === 0) {
      this.startIntermission();
      return; // Stats already recorded at top of advanceDog()
    }

    // Every 5th dog, show a community dog (if any exist)
    if (this.communityDogs.length > 0 && this.dogCount % 5 === 0) {
      const communityDog = this.communityDogs[this.communityIndex % this.communityDogs.length];
      this.communityIndex++;
      this.currentDog = {
        url: `https://dogshow.schemestudio.partykit.dev/party/dogshow-live/community-image?id=${communityDog.id}`,
        name: communityDog.dogName || 'A Good Dog',
        breed: communityDog.breed || null,
        isCommunity: true,
        submittedBy: communityDog.username,
        _communityId: communityDog.id,
        _communityUserId: communityDog.userId,
        _appearedAt: Date.now(),
      };
    } else {
      // Pick next dog from queue
      const url = this.dogQueue.shift();
      if (!url) {
        // Queue empty — fetch more and retry
        this.fetchDogs().then(() => this.advanceDog());
        return;
      }
      const name = this.getNextName();
      // Extract breed from dog.ceo URL (e.g., /breeds/retriever-golden/...)
      const breedMatch = url.match(/\/breeds\/([^/]+)\//);
      const breed = breedMatch ? breedMatch[1].replace(/-/g, ' ') : null;
      this.currentDog = { url, name, isCommunity: false, breed };
    }

    // Reset bone count and bonus time
    this.boneCount = 0;
    this.dogBonusTime = 0;

    // Broadcast new dog + bone reset to all clients
    this.room.broadcast(JSON.stringify({
      type: 'newdog',
      dog: {
        url: this.currentDog.url,
        name: this.currentDog.name,
        breed: this.currentDog.breed || null,
        isCommunity: this.currentDog.isCommunity || false,
        submittedBy: this.currentDog.submittedBy || null,
        id: this.currentDog._communityId || null,
      },
      boneCount: 0,
    }));

    // Pre-fetch more dogs when queue is low
    if (this.dogQueue.length < 5) {
      this.fetchDogs();
    }

    // Schedule next dog (8s base + community dogs get 10s for extra visibility)
    const baseTime = this.currentDog.isCommunity ? 10000 : 8000;
    this.dogInterval = setTimeout(() => {
      const bonus = this.dogBonusTime || 0;
      if (bonus > 0) {
        this.dogBonusTime = 0;
        this.dogInterval = setTimeout(() => this.advanceDog(), bonus);
      } else {
        this.advanceDog();
      }
    }, baseTime);
  }

  async recordCommunityDogStats(dogId) {
    const idx = this.communityDogs.findIndex(d => d.id === dogId);
    if (idx === -1) return;

    const dog = this.communityDogs[idx];
    const viewers = [...this.room.getConnections()].length + this.activeBots.length;
    const screenTime = Date.now() - (this.currentDog._appearedAt || Date.now());

    dog.stats = dog.stats || {
      totalAppearances: 0, totalBones: 0, totalViewers: 0,
      totalScreenTime: 0, peakViewers: 0, firstAppearance: null, lastAppearance: null,
    };

    dog.stats.totalAppearances++;
    dog.stats.totalBones += this.boneCount;
    dog.stats.totalViewers += viewers;
    dog.stats.totalScreenTime += screenTime;
    dog.stats.peakViewers = Math.max(dog.stats.peakViewers, viewers);
    dog.stats.lastAppearance = Date.now();
    if (!dog.stats.firstAppearance) {
      dog.stats.firstAppearance = this.currentDog._appearedAt || Date.now();
    }

    this.communityDogs[idx] = dog;
    await this.room.storage.put('communityDogs', this.communityDogs);

    // Build clean page URL
    const pageUrl = dog.slug ? `${SITE_URL}/d/${dog.slug}` : `${SITE_URL}/dog.html?id=${dogId}`;

    // Notify chat on first appearance only (not every rotation)
    if (dog.stats.totalAppearances === 1) {
      const notifyMsg = {
        type: 'chat',
        user: '🏆 Dog Show',
        text: `${dog.dogName} just appeared! View their page: ${pageUrl}`,
        isSystem: true,
        ts: Date.now(),
      };
      this.addMessage(notifyMsg);
      this.room.broadcast(JSON.stringify(notifyMsg));
    }

    // Email the owner (max once per day per dog)
    const lastEmailKey = `lastEmail:${dogId}`;
    const lastEmail = await this.room.storage.get(lastEmailKey);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (!lastEmail || lastEmail < oneDayAgo) {
      await this.room.storage.put(lastEmailKey, Date.now());
      // Look up user's email
      const user = await this.room.storage.get(`user:${dog.userId}`);
      if (user && user.email) {
        this.sendAppearanceEmail(user.email, dog, pageUrl, this.boneCount, viewers, screenTime);
      }
    }
  }

  async sendAppearanceEmail(email, dog, pageUrl, bones, viewers, screenTimeMs) {
    const screenTimeSec = Math.round(screenTimeMs / 1000);
    const screenTimeStr = screenTimeSec >= 60
      ? Math.floor(screenTimeSec / 60) + 'm ' + (screenTimeSec % 60) + 's'
      : screenTimeSec + 's';

    if (!this.room.env.RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY env var is not set, skipping appearance email');
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.room.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Dog Show <noreply@dogshow.lol>',
          to: [email],
          subject: `🐕 ${dog.dogName} just appeared on The Dog Show!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background: #1a1035; color: #e0d8f0;">
              <h1 style="color: #FF8C42; font-size: 28px; margin-bottom: 4px; text-align: center;">The Dog Show</h1>
              <p style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.4); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">Appearance Report</p>

              <div style="background: #241a45; border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px;">
                <h2 style="color: #e0d8f0; font-size: 22px; margin-bottom: 4px; text-align: center;">${dog.dogName}</h2>
                <p style="text-align: center; font-size: 13px; color: #FF8C42; margin-bottom: 16px;">${dog.breed || 'Mystery Breed'}</p>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.06);">
                      <div style="font-size: 24px; font-weight: 700; color: #FF8C42;">🦴 ${bones}</div>
                      <div style="font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Bones</div>
                    </td>
                    <td style="padding: 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.06);">
                      <div style="font-size: 24px; font-weight: 700; color: #FF8C42;">👀 ${viewers}</div>
                      <div style="font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Viewers</div>
                    </td>
                    <td style="padding: 10px; text-align: center;">
                      <div style="font-size: 24px; font-weight: 700; color: #FF8C42;">⏱️ ${screenTimeStr}</div>
                      <div style="font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Screen Time</div>
                    </td>
                  </tr>
                </table>

                <p style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 12px;">
                  Total appearances: ${dog.stats.totalAppearances} · All-time bones: ${dog.stats.totalBones}
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${pageUrl}" style="display: inline-block; background: #FF8C42; color: #1a1035; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">View ${dog.dogName}'s Certificate</a>
              </div>

              <p style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.3);">
                Share your dog's page with friends:<br>
                <a href="${pageUrl}" style="color: #FF8C42;">${pageUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0;">

              <p style="text-align: center; font-size: 11px; color: rgba(255,255,255,0.2);">
                You're receiving this because ${dog.dogName} appeared on <a href="https://dogshow.lol" style="color: #FF8C42;">The Dog Show</a>.<br>
                You'll get at most one email per day per dog.
              </p>
            </div>
          `,
        }),
      });
    } catch (e) {
      console.error('[Email] Failed to send appearance email:', e.message);
    }
  }

  startIntermission() {
    this.isIntermission = true;
    this.room.broadcast(JSON.stringify({ type: 'intermission', active: true }));

    // End intermission after 8 seconds
    setTimeout(() => {
      this.isIntermission = false;
      this.room.broadcast(JSON.stringify({ type: 'intermission', active: false }));
      this.advanceDog();
    }, 8000);
  }

  broadcastViewers() {
    const realCount = [...this.room.getConnections()].length;
    const totalCount = realCount + this.activeBots.length;
    this.room.broadcast(JSON.stringify({
      type: 'viewers',
      count: Math.max(totalCount, 1),
    }));
  }

  startBot() {
    // Track recent messages to prevent repetition
    this.botLastMsg = {};       // { botName: lastMessageText }
    this.lastBotSpeaker = null; // prevent same bot speaking twice in a row
    this.recentBotMessages = []; // last 10 messages across all bots

    // Seed initial bots — stagger joins over the first 60 seconds
    const initialCount = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...BOTS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < initialCount && i < shuffled.length; i++) {
      const delay = i * (8000 + Math.floor(Math.random() * 7000)); // 8-15s apart
      setTimeout(() => this.botJoin(shuffled[i]), delay);
    }

    // Bots chat at varying intervals (schedule next after each message)
    this.scheduleBotChat();

    // Bots join and leave periodically
    this.botJoinLeaveInterval = setInterval(() => {
      const connections = [...this.room.getConnections()];
      if (connections.length === 0) return;

      const roll = Math.random();

      if (roll < 0.4 && this.activeBots.length < 10) {
        // Try to add a bot that's not already active
        const available = BOTS.filter(b => !this.activeBots.includes(b));
        if (available.length > 0) {
          this.botJoin(pick(available));
        }
      } else if (roll > 0.7 && this.activeBots.length > 2) {
        // Remove a random bot
        this.botLeave(pick(this.activeBots));
      }
    }, 10000 + Math.random() * 15000);
  }

  scheduleBotChat() {
    // Variable delay: 4-10 seconds between bot messages
    const delay = 4000 + Math.random() * 6000;
    this.botInterval = setTimeout(() => {
      this.doBotChat();
      this.scheduleBotChat(); // schedule next
    }, delay);
  }

  doBotChat() {
    if (this.activeBots.length === 0) return;
    const connections = [...this.room.getConnections()];
    if (connections.length === 0) return;

    // Pick a bot that didn't just speak
    let candidates = this.activeBots.filter(b => b.name !== this.lastBotSpeaker);
    if (candidates.length === 0) candidates = this.activeBots;
    const bot = pick(candidates);

    // Pick a message that wasn't this bot's last, and isn't in recent global messages
    let msgText = null;
    const attempts = bot.msgs.length;
    for (let i = 0; i < attempts; i++) {
      const candidate = bot.msgs[Math.floor(Math.random() * bot.msgs.length)];
      if (candidate !== this.botLastMsg[bot.name] && !this.recentBotMessages.includes(candidate)) {
        msgText = candidate;
        break;
      }
    }
    // Fallback: pick any message that's not the same as last
    if (!msgText) {
      const pool = bot.msgs.filter(m => m !== this.botLastMsg[bot.name]);
      msgText = pool.length > 0 ? pick(pool) : pick(bot.msgs);
    }

    // Track state
    this.botLastMsg[bot.name] = msgText;
    this.lastBotSpeaker = bot.name;
    this.recentBotMessages.push(msgText);
    if (this.recentBotMessages.length > 10) this.recentBotMessages.shift();

    const msg = {
      type: 'chat',
      user: bot.name,
      text: msgText,
      isBot: true,
      ts: Date.now(),
    };
    this.addMessage(msg);
    this.room.broadcast(JSON.stringify(msg));

    // Bots also throw bones sometimes
    if (Math.random() > 0.65) {
      this.boneCount++;
      this.dogBonusTime = Math.min((this.dogBonusTime || 0) + 500, 15000);
      this.room.broadcast(JSON.stringify({
        type: 'bone',
        count: this.boneCount,
        from: bot.name,
        isBot: true,
      }));
    }
  }

  botJoin(bot) {
    this.activeBots.push(bot);
    this.broadcastViewers();
  }

  botLeave(bot) {
    this.activeBots = this.activeBots.filter(b => b !== bot);
    this.broadcastViewers();
  }

  sanitize(str) {
    return str.replace(/[<>&"']/g, '');
  }

  // ═══════════════════════════════════════════════
  // HTTP Auth Endpoints (onRequest)
  // ═══════════════════════════════════════════════

  async onRequest(req) {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop(); // last segment
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    try {
      if (path === 'register' && req.method === 'POST') {
        return await this.handleRegister(req, headers);
      }
      if (path === 'login' && req.method === 'POST') {
        return await this.handleLogin(req, headers);
      }
      if (path === 'verify' && req.method === 'POST') {
        return await this.handleVerify(req, headers);
      }
      if (path === 'set-username' && req.method === 'POST') {
        return await this.handleSetUsername(req, headers);
      }
      if (path === 'get-user' && req.method === 'POST') {
        return await this.handleGetUser(req, headers);
      }
      if (path === 'create-checkout' && req.method === 'POST') {
        return await this.handleCreateCheckout(req, headers);
      }
      if (path === 'upload-dog' && req.method === 'POST') {
        return await this.handleUploadDog(req, headers);
      }
      if (path === 'community-image' && req.method === 'GET') {
        return await this.handleCommunityImage(req, headers);
      }
      if (path === 'community-count' && req.method === 'GET') {
        return new Response(JSON.stringify({ count: this.communityDogs.length }), { headers });
      }
      if (path === 'dog-stats' && req.method === 'GET') {
        return await this.handleGetDogStats(req, headers);
      }
      if (path === 'dog-meta' && req.method === 'GET') {
        return await this.handleDogMeta(req);
      }
      if (path === 'all-dogs' && req.method === 'GET') {
        return await this.handleGetAllDogs(req, headers);
      }
      if (path === 'resolve-slug' && req.method === 'GET') {
        return await this.handleResolveSlug(req, headers);
      }
      if (path === 'landing-stats' && req.method === 'GET') {
        const totalBones = this.communityDogs.reduce((sum, d) => sum + ((d.stats && d.stats.totalBones) || 0), 0) + this.boneCount;
        const watching = [...this.room.getConnections()].length + this.activeBots.length;
        return new Response(JSON.stringify({
          ok: true,
          totalFans: this.totalFans,
          totalBones: totalBones,
          totalDogs: this.communityDogs.length + (this.dogQueue ? this.dogQueue.length : 0),
          watching: watching,
        }), { headers });
      }
      if (path === 'leaderboard' && req.method === 'GET') {
        const imgBase = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live/community-image?id=';
        // Seed dogs for early days — replaced as real dogs accumulate bones
        const seedDogs = [
          { dogName: 'Biscuit', breed: 'Golden Retriever', username: 'sarahk', totalBones: 64, imageUrl: 'https://images.dog.ceo/breeds/retriever-golden/n02099601_7771.jpg' },
          { dogName: 'Mochi', breed: 'Shiba Inu', username: 'yuki_tanaka', totalBones: 51, imageUrl: 'https://images.dog.ceo/breeds/shiba/shiba-11.jpg' },
          { dogName: 'Rufus', breed: 'Beagle', username: 'dogdad_mike', totalBones: 47, imageUrl: 'https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg' },
          { dogName: 'Luna', breed: 'German Shepherd', username: 'emmawalks', totalBones: 38, imageUrl: 'https://images.dog.ceo/breeds/germanshepherd/n02106662_18405.jpg' },
          { dogName: 'Churro', breed: 'Chihuahua', username: 'carlos_mx', totalBones: 29, imageUrl: 'https://images.dog.ceo/breeds/chihuahua/n02085620_5093.jpg' },
          { dogName: 'Peggy', breed: 'Pug', username: 'annab', totalBones: 22, imageUrl: 'https://images.dog.ceo/breeds/pug/n02110958_15307.jpg' },
          { dogName: 'Björn', breed: 'Samoyed', username: 'nordichound', totalBones: 11, imageUrl: 'https://images.dog.ceo/breeds/samoyed/n02111889_4564.jpg' },
        ];
        const realDogs = this.communityDogs
          .filter(d => d.stats && d.stats.totalBones > 0)
          .map(d => ({
            id: d.id,
            slug: d.slug || null,
            dogName: d.dogName,
            breed: d.breed || 'Mystery Breed',
            username: d.username,
            totalBones: d.stats.totalBones || 0,
            totalAppearances: d.stats.totalAppearances || 0,
            peakViewers: d.stats.peakViewers || 0,
            imageUrl: imgBase + d.id,
          }));
        // Merge real + seed, real dogs take priority, sort by bones, cap at 10
        const allDogs = [...realDogs, ...seedDogs]
          .sort((a, b) => b.totalBones - a.totalBones)
          .slice(0, 10);
        const recent = this.communityDogs
          .slice()
          .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0))
          .slice(0, 5)
          .map(d => ({
            id: d.id,
            slug: d.slug || null,
            dogName: d.dogName,
            breed: d.breed || 'Mystery Breed',
            username: d.username,
            uploadedAt: d.uploadedAt,
            imageUrl: imgBase + d.id,
          }));
        return new Response(JSON.stringify({
          ok: true,
          topDogs: allDogs,
          recentDogs: recent,
          totalCommunityDogs: this.communityDogs.length,
        }), { headers });
      }
    } catch (e) {
      console.error(`[Server] Unhandled error on ${path}:`, e.message, e.stack?.slice(0, 300));
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });
  }

  // Register a new user after Stripe payment
  async handleRegister(req, headers) {
    const { email, tier, stripeCustomerId } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userId = 'user_' + this.hashEmail(normalizedEmail);

    // Check if already registered
    const existing = await this.room.storage.get(`user:${userId}`);
    if (existing) {
      // Update tier if upgrading
      existing.tier = tier || existing.tier;
      existing.stripeCustomerId = stripeCustomerId || existing.stripeCustomerId;
      await this.room.storage.put(`user:${userId}`, existing);
      const token = this.generateToken(userId);
      await this.room.storage.put(`token:${token}`, { userId, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 });
      return new Response(JSON.stringify({ ok: true, token, user: existing }), { headers });
    }

    // Create new user
    const user = {
      id: userId,
      email: normalizedEmail,
      tier: tier || 'general',
      stripeCustomerId: stripeCustomerId || null,
      username: null,
      createdAt: Date.now(),
    };
    await this.room.storage.put(`user:${userId}`, user);
    await this.room.storage.put(`email:${normalizedEmail}`, userId);

    // Generate session token
    const token = this.generateToken(userId);
    await this.room.storage.put(`token:${token}`, { userId, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    return new Response(JSON.stringify({ ok: true, token, user }), { headers });
  }

  // Request a magic login link
  async handleLogin(req, headers) {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userId = await this.room.storage.get(`email:${normalizedEmail}`);

    if (!userId) {
      // Don't reveal whether email exists — still say "sent"
      return new Response(JSON.stringify({ ok: true, message: 'If that email is registered, a login link has been sent.' }), { headers });
    }

    // Generate magic link token (valid 15 minutes)
    const magicToken = this.generateToken('magic');
    await this.room.storage.put(`magic:${magicToken}`, { userId, expires: Date.now() + 15 * 60 * 1000 });

    // Send email via Resend
    const loginUrl = `${SITE_URL}/login.html?token=${magicToken}`;
    await this.sendMagicLinkEmail(normalizedEmail, loginUrl);

    return new Response(JSON.stringify({ ok: true, message: 'If that email is registered, a login link has been sent.' }), { headers });
  }

  // Verify a magic link token
  async handleVerify(req, headers) {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'token required' }), { status: 400, headers });
    }

    const magicData = await this.room.storage.get(`magic:${token}`);
    if (!magicData || magicData.expires < Date.now()) {
      return new Response(JSON.stringify({ error: 'invalid or expired link' }), { status: 401, headers });
    }

    // Magic token is single-use
    await this.room.storage.delete(`magic:${token}`);

    // Get user and issue session token
    const user = await this.room.storage.get(`user:${magicData.userId}`);
    if (!user) {
      return new Response(JSON.stringify({ error: 'user not found' }), { status: 404, headers });
    }

    const sessionToken = this.generateToken(magicData.userId);
    await this.room.storage.put(`token:${sessionToken}`, { userId: magicData.userId, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    return new Response(JSON.stringify({ ok: true, token: sessionToken, user }), { headers });
  }

  // Set username for a user
  async handleSetUsername(req, headers) {
    const { token, username } = await req.json();
    if (!token || !username) {
      return new Response(JSON.stringify({ error: 'token and username required' }), { status: 400, headers });
    }

    const session = await this.room.storage.get(`token:${token}`);
    if (!session || session.expires < Date.now()) {
      return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers });
    }

    const user = await this.room.storage.get(`user:${session.userId}`);
    if (!user) {
      return new Response(JSON.stringify({ error: 'user not found' }), { status: 404, headers });
    }

    user.username = this.sanitize(username).slice(0, 20);
    await this.room.storage.put(`user:${session.userId}`, user);

    return new Response(JSON.stringify({ ok: true, user }), { headers });
  }

  // Get user by session token
  async handleGetUser(req, headers) {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'token required' }), { status: 400, headers });
    }

    const session = await this.room.storage.get(`token:${token}`);
    if (!session || session.expires < Date.now()) {
      return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers });
    }

    const user = await this.room.storage.get(`user:${session.userId}`);
    if (!user) {
      return new Response(JSON.stringify({ error: 'user not found' }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ ok: true, user }), { headers });
  }

  // Create a Stripe Checkout Session (server-side)
  async handleCreateCheckout(req, headers) {
    const { tier, email, faurya_visitor_id, faurya_session_id } = await req.json();
    if (!tier || !email) {
      return new Response(JSON.stringify({ error: 'tier and email required' }), { status: 400, headers });
    }

    // Free tier is handled via /register, not Stripe
    if (tier === 'free') {
      return new Response(JSON.stringify({ error: 'free tier does not require checkout' }), { status: 400, headers });
    }

    const priceMap = {
      general: 'price_1TTMssBOUqMOkBpQVQR3zFdr',
      premium: 'price_1TTMtiBOUqMOkBpQvxnJMu3e',
    };
    const priceId = priceMap[tier];
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'invalid tier' }), { status: 400, headers });
    }

    if (!this.room.env.STRIPE_SK) {
      console.error('[Stripe] STRIPE_SK env var is not set');
      return new Response(JSON.stringify({ error: 'payment system misconfigured' }), { status: 500, headers });
    }

    const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('mode', 'payment');
    params.append('customer_email', email.toLowerCase().trim());
    params.append('success_url', `${SITE_URL}/success.html?tier=${tier}&email=${encodedEmail}`);
    params.append('cancel_url', `${SITE_URL}/`);

    // Faurya analytics attribution
    if (faurya_visitor_id) params.append('metadata[faurya_visitor_id]', faurya_visitor_id);
    if (faurya_session_id) params.append('metadata[faurya_session_id]', faurya_session_id);

    try {
      const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.room.env.STRIPE_SK}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const session = await res.json();
      if (session.error) {
        console.error('[Stripe] Checkout error:', session.error.type, session.error.message);
        return new Response(JSON.stringify({ error: session.error.message }), { status: 400, headers });
      }

      if (!session.url) {
        console.error('[Stripe] No checkout URL in response:', JSON.stringify(session).slice(0, 200));
        return new Response(JSON.stringify({ error: 'checkout session created but no URL returned' }), { status: 500, headers });
      }

      return new Response(JSON.stringify({ url: session.url }), { headers });
    } catch (e) {
      console.error('[Stripe] Network/fetch error:', e.message);
      return new Response(JSON.stringify({ error: 'payment service unavailable' }), { status: 502, headers });
    }
  }

  // Upload a community dog (premium only, AI-verified)
  async handleUploadDog(req, headers) {
    const { token, imageData, dogName } = await req.json();
    if (!token || !imageData) {
      return new Response(JSON.stringify({ error: 'token and imageData required' }), { status: 400, headers });
    }

    // Verify session
    const session = await this.room.storage.get(`token:${token}`);
    if (!session || session.expires < Date.now()) {
      return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers });
    }

    // Get user and verify premium tier
    const user = await this.room.storage.get(`user:${session.userId}`);
    if (!user) {
      return new Response(JSON.stringify({ error: 'user not found' }), { status: 404, headers });
    }
    if (user.tier !== 'premium') {
      return new Response(JSON.stringify({ error: 'premium tier required' }), { status: 403, headers });
    }

    // Check if user already uploaded (limit 1 per user for now)
    const existingUpload = this.communityDogs.find(d => d.userId === session.userId);
    if (existingUpload) {
      return new Response(JSON.stringify({ error: 'you already have a dog in the show! (1 per member)' }), { status: 400, headers });
    }

    // Validate image data (must be a data URL, max ~500KB base64)
    if (!imageData.startsWith('data:image/') || imageData.length > 700000) {
      return new Response(JSON.stringify({ error: 'invalid image (max 500KB, JPEG/PNG only)' }), { status: 400, headers });
    }

    // ─── AI Dog Detection ───────────────────────────
    const classification = await this.classifyDogImage(imageData);
    if (!classification.isDog) {
      return new Response(JSON.stringify({
        error: "We can't tell if that's a picture of a dog. Can you try another pic?"
      }), { status: 400, headers });
    }

    // Store image
    const id = 'cdog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    await this.room.storage.put(`img:${id}`, imageData);

    // Generate clean URL slug
    const cleanName = this.sanitize(dogName || 'A Good Dog').slice(0, 30);
    const slug = await this.getUniqueSlug(cleanName);
    await this.room.storage.put(`slug:${slug}`, id);

    // Add to community dogs list
    const entry = {
      id,
      slug,
      userId: session.userId,
      username: user.username || 'Anonymous',
      dogName: cleanName,
      breed: classification.breed || 'Mystery Breed',
      breedConfidence: classification.confidence || 0,
      uploadedAt: Date.now(),
      // Stats — populated when dog appears in slideshow
      stats: {
        totalAppearances: 0,
        totalBones: 0,
        totalViewers: 0,
        totalScreenTime: 0,
        peakViewers: 0,
        firstAppearance: null,
        lastAppearance: null,
      },
    };
    this.communityDogs.push(entry);
    await this.room.storage.put('communityDogs', this.communityDogs);

    // Broadcast updated community count
    this.room.broadcast(JSON.stringify({
      type: 'communityCount',
      count: this.communityDogs.length,
    }));

    return new Response(JSON.stringify({ ok: true, id, slug, message: 'Your dog is now in the show!' }), { headers });
  }

  // Serve a community dog image
  async handleCommunityImage(req, headers) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response('not found', { status: 404 });
    }

    const imageData = await this.room.storage.get(`img:${id}`);
    if (!imageData) {
      return new Response('not found', { status: 404 });
    }

    // Convert data URL to binary response
    const [meta, base64] = imageData.split(',');
    const mimeMatch = meta.match(/data:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    return new Response(binary, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Serve OG meta tags as HTML for social crawlers
  async handleDogMeta(req) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response('not found', { status: 404 });

    const dog = this.communityDogs.find(d => d.id === id);
    if (!dog) return new Response('not found', { status: 404 });

    const imageUrl = `https://dogshow.schemestudio.partykit.dev/party/dogshow-live/community-image?id=${dog.id}`;
    const pageUrl = dog.slug ? `${SITE_URL}/d/${dog.slug}` : `${SITE_URL}/dog.html?id=${dog.id}`;
    const bones = (dog.stats && dog.stats.totalBones) || 0;
    const desc = `${dog.dogName} appeared on The Dog Show! ${dog.breed && dog.breed !== 'Mystery Breed' ? 'Breed: ' + dog.breed + '. ' : ''}${bones} bones received. View their certificate.`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${dog.dogName} — The Dog Show Certificate</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="${dog.dogName} — The Dog Show">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:url" content="${pageUrl}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${dog.dogName} — The Dog Show">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${imageUrl}">
<meta http-equiv="refresh" content="0;url=${pageUrl}">
</head>
<body><p>Redirecting to <a href="${pageUrl}">${dog.dogName}'s certificate</a>...</p></body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Get stats for a specific community dog
  async handleGetDogStats(req, headers) {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
    }

    const dog = this.communityDogs.find(d => d.id === id);
    if (!dog) {
      return new Response(JSON.stringify({ error: 'dog not found' }), { status: 404, headers });
    }

    // Return all data needed for the certificate page
    return new Response(JSON.stringify({
      ok: true,
      dog: {
        id: dog.id,
        slug: dog.slug || null,
        dogName: dog.dogName,
        username: dog.username,
        breed: dog.breed || 'Mystery Breed',
        breedConfidence: dog.breedConfidence || 0,
        uploadedAt: dog.uploadedAt,
        imageUrl: `https://dogshow.schemestudio.partykit.dev/party/dogshow-live/community-image?id=${dog.id}`,
        stats: dog.stats || {
          totalAppearances: 0, totalBones: 0, totalViewers: 0,
          totalScreenTime: 0, peakViewers: 0, firstAppearance: null, lastAppearance: null,
        },
      },
      // Include other community dogs for "More dogs" section (SEO internal links)
      otherDogs: this.communityDogs
        .filter(d => d.id !== id)
        .slice(0, 12)
        .map(d => ({ id: d.id, slug: d.slug || null, dogName: d.dogName, breed: d.breed, username: d.username })),
      totalCommunityDogs: this.communityDogs.length,
    }), { headers });
  }

  // Get all community dogs (for directory/SEO pages)
  async handleGetAllDogs(req, headers) {
    return new Response(JSON.stringify({
      ok: true,
      dogs: this.communityDogs.map(d => ({
        id: d.id,
        slug: d.slug || null,
        dogName: d.dogName,
        username: d.username,
        breed: d.breed || 'Mystery Breed',
        uploadedAt: d.uploadedAt,
        stats: d.stats || {},
      })),
    }), { headers });
  }

  // Resolve a slug to a dog ID
  async handleResolveSlug(req, headers) {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    if (!slug) {
      return new Response(JSON.stringify({ error: 'slug required' }), { status: 400, headers });
    }

    // Try slug lookup first
    const id = await this.room.storage.get(`slug:${slug}`);
    if (id) {
      return new Response(JSON.stringify({ ok: true, id }), { headers });
    }

    // Fallback: search community dogs by slug field
    const dog = this.communityDogs.find(d => d.slug === slug);
    if (dog) {
      return new Response(JSON.stringify({ ok: true, id: dog.id }), { headers });
    }

    return new Response(JSON.stringify({ error: 'dog not found' }), { status: 404, headers });
  }

  // ─── AI Classification ──────────────────────────

  async classifyDogImage(imageData) {
    try {
      // Convert data URL to binary array
      const [meta, base64] = imageData.split(',');
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Run image classification via Cloudflare Workers AI
      const ai = this.room.context.ai;
      const result = await ai.run('@cf/microsoft/resnet-50', {
        image: [...binary],
      });

      if (!result || !Array.isArray(result)) {
        // If AI is unavailable, fail open
        return { isDog: true, breed: 'Mystery Breed', confidence: 0 };
      }

      // Dog-related keywords matching ImageNet dog breed classes
      const DOG_KEYWORDS = [
        'dog', 'puppy', 'hound', 'terrier', 'retriever', 'spaniel', 'collie',
        'shepherd', 'poodle', 'bulldog', 'beagle', 'corgi', 'husky', 'labrador',
        'dachshund', 'chihuahua', 'rottweiler', 'boxer', 'dalmatian', 'pug',
        'schnauzer', 'mastiff', 'greyhound', 'whippet', 'samoyed', 'malamute',
        'pointer', 'setter', 'wolfhound', 'sheepdog', 'doberman', 'pinscher',
        'weimaraner', 'vizsla', 'ridgeback', 'basenji', 'akita', 'shiba',
        'papillon', 'maltese', 'havanese', 'bichon', 'lhasa', 'shih-tzu',
        'pekinese', 'pomeranian', 'keeshond', 'chow', 'newfoundland',
        'bernese', 'great dane', 'saint bernard', 'bloodhound', 'basset',
        'coonhound', 'foxhound', 'otterhound', 'deerhound', 'borzoi',
        'afghan', 'saluki', 'komondor', 'kuvasz', 'briard', 'bouvier',
        'malinois', 'tervuren', 'groenendael', 'kelpie', 'cattledog',
        'Australian', 'cur', 'heeler', 'dingo', 'canine', 'canis',
      ];

      // Check top 5 predictions for dog-related labels
      const topResults = result.slice(0, 5);
      for (const item of topResults) {
        const label = (item.label || '').toLowerCase();
        const score = item.score || 0;

        for (const keyword of DOG_KEYWORDS) {
          if (label.includes(keyword) && score > 0.05) {
            // Format breed name nicely from ImageNet label
            const breed = this.formatBreedName(item.label);
            return { isDog: true, breed, confidence: score };
          }
        }
      }

      // No dog detected
      return { isDog: false, breed: null, confidence: 0 };
    } catch (e) {
      console.log('AI classification error:', e.message);
      return { isDog: true, breed: 'Mystery Breed', confidence: 0 };
    }
  }

  formatBreedName(label) {
    if (!label) return 'Mystery Breed';
    // ImageNet labels look like "golden_retriever" or "German shepherd, German shepherd dog"
    let name = label.split(',')[0]; // Take first part before comma
    name = name.replace(/_/g, ' '); // Underscores to spaces
    // Title case
    name = name.replace(/\b\w/g, c => c.toUpperCase());
    return name.trim();
  }

  // ─── Helpers ────────────────────────────────────

  generateToken(prefix) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix + '_';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  slugify(name) {
    let slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    if (!slug) slug = 'good-dog';
    return slug;
  }

  async getUniqueSlug(name) {
    const base = this.slugify(name);
    let slug = base;
    let existing = await this.room.storage.get(`slug:${slug}`);
    let counter = 2;
    while (existing) {
      slug = base + '-' + counter;
      existing = await this.room.storage.get(`slug:${slug}`);
      counter++;
    }
    return slug;
  }

  hashEmail(email) {
    // Simple deterministic hash for email → userId mapping
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit int
    }
    return Math.abs(hash).toString(36);
  }

  async sendMagicLinkEmail(email, loginUrl) {
    if (!this.room.env.RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY env var is not set, skipping magic link email');
      return false;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.room.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Dog Show <noreply@dogshow.lol>',
          to: [email],
          subject: '🐕 Your Dog Show Login Link',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #FF8C42; font-size: 28px;">The Dog Show</h1>
              <p style="font-size: 16px; color: #333;">Click below to enter the show:</p>
              <a href="${loginUrl}" style="display: inline-block; background: #FF8C42; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0;">Enter The Dog Show</a>
              <p style="font-size: 13px; color: #888; margin-top: 30px;">This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
          `,
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error('[Email] Magic link send failed:', res.status, errBody.slice(0, 200));
      }
      return res.ok;
    } catch (e) {
      console.error('[Email] Magic link network error:', e.message);
      return false;
    }
  }
}
