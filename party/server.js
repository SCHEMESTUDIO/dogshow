// ═══════════════════════════════════════════════
// Dog Show — PartyKit Server
// Real-time chat, shared bone counts, bot seeding,
// user auth (magic link via Resend).
// ═══════════════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_SK = process.env.STRIPE_SK;
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
    this.currentDog = null;       // { url, name }
    this.dogCount = 0;
    this.dogInterval = null;
    this.isIntermission = false;
    this.dogQueue = [];
    this.nameIndex = 0;
  }

  async onStart() {
    // Load persisted fan count from storage
    this.totalFans = (await this.room.storage.get('totalFans')) || 0;
    const storedIds = (await this.room.storage.get('fanIds')) || [];
    this.fanIds = new Set(storedIds);

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
        clearInterval(this.botInterval);
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

    this.dogCount++;

    // Intermission every 5 dogs
    if (this.dogCount > 1 && this.dogCount % 15 === 0) {
      this.startIntermission();
      return;
    }

    // Pick next dog from queue
    const url = this.dogQueue.shift();
    if (!url) {
      // Queue empty — fetch more and retry
      this.fetchDogs().then(() => this.advanceDog());
      return;
    }
    const name = this.getNextName();
    this.currentDog = { url, name };

    // Reset bone count and bonus time
    this.boneCount = 0;
    this.dogBonusTime = 0;

    // Broadcast new dog + bone reset to all clients
    this.room.broadcast(JSON.stringify({
      type: 'newdog',
      dog: this.currentDog,
      boneCount: 0,
    }));

    // Pre-fetch more dogs when queue is low
    if (this.dogQueue.length < 5) {
      this.fetchDogs();
    }

    // Schedule next dog (8s base, then check for bone bonus)
    this.dogInterval = setTimeout(() => {
      const bonus = this.dogBonusTime || 0;
      if (bonus > 0) {
        this.dogBonusTime = 0;
        // Extended stay — wait the bonus then advance
        this.dogInterval = setTimeout(() => this.advanceDog(), bonus);
      } else {
        this.advanceDog();
      }
    }, 8000);
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
    // Seed initial bots — stagger joins over the first 60 seconds
    const initialCount = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...BOTS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < initialCount && i < shuffled.length; i++) {
      const delay = i * (8000 + Math.floor(Math.random() * 7000)); // 8-15s apart
      setTimeout(() => this.botJoin(shuffled[i]), delay);
    }

    // Bots chat at random intervals
    this.botInterval = setInterval(() => {
      if (this.activeBots.length === 0) return;
      const connections = [...this.room.getConnections()];
      if (connections.length === 0) return;

      // Pick a random active bot to speak
      const bot = pick(this.activeBots);
      const msg = {
        type: 'chat',
        user: bot.name,
        text: pick(bot.msgs),
        isBot: true,
        ts: Date.now(),
      };
      this.addMessage(msg);
      this.room.broadcast(JSON.stringify(msg));

      // Bots also throw bones sometimes
      if (Math.random() > 0.6) {
        this.boneCount++;
        this.dogBonusTime = Math.min((this.dogBonusTime || 0) + 500, 15000);
        this.room.broadcast(JSON.stringify({
          type: 'bone',
          count: this.boneCount,
          from: bot.name,
          isBot: true,
        }));
      }
    }, 2000 + Math.random() * 4000);

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
    } catch (e) {
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
    const { tier, email } = await req.json();
    if (!tier || !email) {
      return new Response(JSON.stringify({ error: 'tier and email required' }), { status: 400, headers });
    }

    const priceMap = {
      free: 'price_1TTS6WBOUqMOkBpQm65rUkvi',
      general: 'price_1TTMssBOUqMOkBpQVQR3zFdr',
      premium: 'price_1TTMtiBOUqMOkBpQvxnJMu3e',
    };
    const priceId = priceMap[tier];
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'invalid tier' }), { status: 400, headers });
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

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SK}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ url: session.url }), { headers });
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
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
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
    return res.ok;
  }
}
