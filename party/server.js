// ═══════════════════════════════════════════════
// Dog Show — PartyKit Server
// Real-time chat, shared bone counts, bot seeding,
// user auth (magic link via Resend).
// ═══════════════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const STRIPE_SK = process.env.STRIPE_SK;
const SITE_URL = 'https://dogshow.lol';

const BOT_NAMES = [
  'doglover99', 'barkfan', 'woofwatcher', 'puppyperson', 'snootboop',
  'goodboy_greg', 'fetchqueen', 'pawsitive_vibes', 'treatseeker', 'zoomies4life',
];

const BOT_MESSAGES = [
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

const VIP_SKINS = [
  { name: 'Amethyst', color: '#BB86FC', bg: 'rgba(187,134,252,0.12)', border: '#BB86FC' },
  { name: 'Electric Violet', color: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', border: '#7C4DFF' },
  { name: 'Hot Pink', color: '#FF1493', bg: 'rgba(255,20,147,0.12)', border: '#FF1493' },
  { name: 'Ice Blue', color: '#00D4FF', bg: 'rgba(0,212,255,0.12)', border: '#00D4FF' },
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
    this.totalFans = 0;
    this.fanIds = new Set();
  }

  async onStart() {
    // Load persisted fan count from storage
    this.totalFans = (await this.room.storage.get('totalFans')) || 0;
    const storedIds = (await this.room.storage.get('fanIds')) || [];
    this.fanIds = new Set(storedIds);
  }

  async onConnect(conn, ctx) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'sync',
      boneCount: this.boneCount,
      messages: this.messages.slice(-50),
      viewers: [...this.room.getConnections()].length || 1,
      totalFans: this.totalFans,
    }));

    // Broadcast updated viewer count
    this.broadcastViewers();

    // Start bot if this is the first connection
    if (!this.botInterval) {
      this.startBot();
    }
  }

  onClose(conn) {
    this.broadcastViewers();

    // Stop bot if no one is connected
    const count = [...this.room.getConnections()].length;
    if (count === 0 && this.botInterval) {
      clearInterval(this.botInterval);
      this.botInterval = null;
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
      this.room.broadcast(JSON.stringify({
        type: 'bone',
        count: this.boneCount,
        from: this.sanitize(data.user || 'anon').slice(0, 20),
      }));
    }

    if (data.type === 'newdog') {
      // Reset bone count for new dog (sent by any client, first one wins)
      this.boneCount = 0;
      this.room.broadcast(JSON.stringify({
        type: 'bone_reset',
        count: 0,
      }));
    }
  }

  addMessage(msg) {
    this.messages.push(msg);
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
  }

  broadcastViewers() {
    const count = [...this.room.getConnections()].length;
    this.room.broadcast(JSON.stringify({
      type: 'viewers',
      count: Math.max(count, 1),
    }));
  }

  startBot() {
    this.botInterval = setInterval(() => {
      const connections = [...this.room.getConnections()];
      if (connections.length === 0) return;

      // Random bot message
      const isVip = Math.random() > 0.7;
      const msg = {
        type: 'chat',
        user: pick(BOT_NAMES),
        text: pick(BOT_MESSAGES),
        isVip: isVip,
        skin: isVip ? pick(VIP_SKINS) : null,
        isBot: true,
        ts: Date.now(),
      };
      this.addMessage(msg);
      this.room.broadcast(JSON.stringify(msg));

      // Bots also throw bones sometimes
      if (Math.random() > 0.6) {
        this.boneCount++;
        this.room.broadcast(JSON.stringify({
          type: 'bone',
          count: this.boneCount,
          from: pick(BOT_NAMES),
          isBot: true,
        }));
      }
    }, 3000 + Math.random() * 5000);
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
