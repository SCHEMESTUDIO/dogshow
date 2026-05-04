// ═══════════════════════════════════════════════
// Dog Show — PartyKit Server
// Real-time chat, shared bone counts, bot seeding.
// ═══════════════════════════════════════════════

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
  }

  onConnect(conn, ctx) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'sync',
      boneCount: this.boneCount,
      messages: this.messages.slice(-50),
      viewers: this.room.getConnections().length || 1,
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

  onMessage(message, sender) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
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
}
