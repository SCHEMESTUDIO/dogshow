import { useState, useEffect, useRef, useCallback } from "react";

// Fallback dogs in case API is slow on first load
const SEED_DOGS = [
  "https://images.dog.ceo/breeds/retriever-golden/n02099601_1722.jpg",
  "https://images.dog.ceo/breeds/poodle-standard/n02113799_2280.jpg",
  "https://images.dog.ceo/breeds/husky/n02110185_10047.jpg",
  "https://images.dog.ceo/breeds/corgi-cardigan/n02113186_10475.jpg",
  "https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg",
  "https://images.dog.ceo/breeds/dalmatian/n02110341_4527.jpg",
  "https://images.dog.ceo/breeds/shihtzu/n02086240_7588.jpg",
  "https://images.dog.ceo/breeds/germanshepherd/n02106662_20536.jpg",
  "https://images.dog.ceo/breeds/samoyed/n02111889_10206.jpg",
  "https://images.dog.ceo/breeds/bulldog-french/n02108915_5765.jpg",
];

const DOG_NAMES = [
  "Sir Barkington III", "Princess Fluffernutter", "Captain Wiggles",
  "Duke of Snootsville", "Lady Woofsworth", "Baron von Fetchington",
  "Countess Pawdington", "Lord Droolsbury", "Empress Belly Rubs",
  "The Honorable Mr. Sniffs", "Brigadier Boop", "Dame Floofington",
  "Chancellor Chomps", "Viscount Waggles", "Archduke Zoomies",
  "Madame Snugglesworth", "General Good Boy", "Professor Borkenstein",
  "Queen Pawlina", "Sir Licksalot", "The Grand Poobah of Paws",
];

const VIP_SKINS = [
  { name: "Gold Prestige", color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "#D4AF37" },
  { name: "Royal Purple", color: "#9B59B6", bg: "rgba(155,89,182,0.12)", border: "#9B59B6" },
  { name: "Hot Pink", color: "#FF1493", bg: "rgba(255,20,147,0.12)", border: "#FF1493" },
  { name: "Neon Green", color: "#39FF14", bg: "rgba(57,255,20,0.10)", border: "#39FF14" },
  { name: "Ice Blue", color: "#00D4FF", bg: "rgba(0,212,255,0.12)", border: "#00D4FF" },
  { name: "Sunset Orange", color: "#FF6B35", bg: "rgba(255,107,53,0.12)", border: "#FF6B35" },
];

const FAKE_USERS = [
  "doglover99", "barkfan", "woofwatcher", "puppyperson", "snootboop",
  "goodboy_greg", "fetchqueen", "pawsitive_vibes", "treatseeker", "zoomies4life",
];

const FAKE_MESSAGES = [
  "omg look at this one",
  "10/10 good dog",
  "I paid a dollar for this and I'm not even mad",
  "THIS IS THE BEST DOLLAR I EVER SPENT",
  "wait is this actually just dogs",
  "yes. yes it is.",
  "legendary",
  "that dog looks like my boss",
  "someone tell this dog I love them",
  "I've been here for 40 minutes",
  "the curtain really got me",
  "worth every penny",
  "is this what the internet was made for",
  "I'm showing this to everyone at work",
  "this dog has more charisma than me",
  "ok but the chat is actually the best part",
  "who else is watching at 2am",
  "I can't leave",
  "dogs.",
  "this is art",
  "my therapist is going to hear about this",
  "just venmo'd my friend a dollar to join lol",
  "the old timey music during intermission killed me",
  "RARE DOG RARE DOG",
  "someone just uploaded their dog!!",
  "LIFETIME MEMBER HERE. I LIVE HERE NOW.",
  "that's a community dog right there",
  "the jingle is stuck in my head",
];

const INTERMISSION_MESSAGES = [
  "here comes the jingle",
  "NOT THE JINGLE AGAIN",
  "I love the jingle actually",
  "intermission gang rise up",
  "the dogs... where did they go",
  "I can still hear the jingle in my dreams",
  "who's sponsoring this one",
  "please stand by lmaooo",
  "the curtain is CLOSED",
  "3 2 1... dogs incoming",
];

const SPONSOR_MESSAGES = [
  "This Dog Show brought to you by Kevin from Ohio",
  "Sponsored by: my crippling inability to close browser tabs",
  "This moment of dogs powered by Sarah's birthday fund",
  "Corporate sponsor: Jeff (he is not a corporation)",
  "Brought to you by the letter W (for Woof)",
];

// ─── SCREENS ────────────────────────────────────────────────────

function LandingPage({ onEnter }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff",
      padding: 20,
    }}>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#666" }}>
        presenting
      </div>
      <h1 style={{
        fontSize: "clamp(42px, 8vw, 72px)",
        fontWeight: 200,
        letterSpacing: -1,
        margin: "0 0 12px 0",
        background: "linear-gradient(135deg, #fff 0%, #ccc 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        Dog Show
      </h1>
      <p style={{ color: "#888", fontSize: 15, margin: "0 0 48px 0", fontWeight: 300 }}>
        A live, exclusive experience.
      </p>

      <button
        onClick={onEnter}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          background: hovering
            ? "linear-gradient(135deg, #fff 0%, #e0e0e0 100%)"
            : "linear-gradient(135deg, #fff 0%, #f0f0f0 100%)",
          color: "#000",
          border: "none",
          borderRadius: 50,
          padding: "16px 48px",
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.3s ease",
          transform: hovering ? "scale(1.03)" : "scale(1)",
          boxShadow: hovering
            ? "0 8px 32px rgba(255,255,255,0.25)"
            : "0 4px 16px rgba(255,255,255,0.15)",
        }}
      >
        Enter — $1.00
      </button>

      <div style={{ marginTop: 48, display: "flex", gap: 32, color: "#444", fontSize: 12 }}>
        <span>Live Chat</span>
        <span>·</span>
        <span>Exclusive Content</span>
        <span>·</span>
        <span>Limited Access</span>
      </div>

      <div style={{
        position: "absolute",
        bottom: 24,
        fontSize: 11,
        color: "#333",
        display: "flex",
        gap: 24,
      }}>
        <span>Secure Payment</span>
        <span>·</span>
        <span>256-bit Encryption</span>
        <span>·</span>
        <span>Instant Access</span>
      </div>
    </div>
  );
}

function PaymentScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [cardNum, setCardNum] = useState("");
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (step === 1) {
      const t1 = setTimeout(() => setStep(2), 800);
      return () => clearTimeout(t1);
    }
    if (step === 2) {
      const t2 = setTimeout(() => setStep(3), 1200);
      return () => clearTimeout(t2);
    }
    if (step === 3) {
      const t3 = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(t3);
    }
  }, [step, onComplete]);

  if (step >= 1) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#fff",
      }}>
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 40, height: 40, border: "2px solid #333",
              borderTopColor: "#fff", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            <div style={{ color: "#888", fontSize: 14 }}>Processing payment...</div>
          </div>
        )}
        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
            <div style={{ fontSize: 18, fontWeight: 300 }}>Payment confirmed</div>
            <div style={{ color: "#666", fontSize: 13, marginTop: 8 }}>$1.00 charged</div>
          </div>
        )}
        {step === 3 && (
          <div style={{ textAlign: "center", color: "#888", fontSize: 14 }}>
            Preparing your experience...
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff",
      padding: 20,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#111",
        borderRadius: 16,
        padding: 32,
        border: "1px solid #222",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Dog Show</span>
          <span style={{
            background: "#1a1a1a",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            color: "#aaa",
          }}>$1.00</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            Card Number
          </label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardNum}
            onChange={(e) => setCardNum(e.target.value)}
            style={{
              width: "100%",
              background: "#0a0a0a",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "14px 16px",
              color: "#fff",
              fontSize: 16,
              fontFamily: "monospace",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
              Expiry
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "14px 16px",
                color: "#fff",
                fontSize: 16,
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
              CVC
            </label>
            <input
              type="text"
              placeholder="123"
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "14px 16px",
                color: "#fff",
                fontSize: 16,
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button
          onClick={() => setStep(1)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          style={{
            width: "100%",
            background: hovering ? "#fff" : "#f0f0f0",
            color: "#000",
            border: "none",
            borderRadius: 8,
            padding: "14px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Pay $1.00
        </button>

        <div style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 11,
          color: "#444",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
        }}>
          <span>&#128274;</span> Secured by DogPay&trade;
        </div>
      </div>
    </div>
  );
}

function CurtainReveal({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => onComplete(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Curtain Left */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        width: phase >= 1 ? "0%" : "50%", height: "100%",
        background: "linear-gradient(90deg, #8B0000 0%, #B22222 60%, #6B0000 100%)",
        transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 10, boxShadow: "inset -20px 0 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ position: "absolute", right: "20%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.15)" }} />
        <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.1)" }} />
      </div>

      {/* Curtain Right */}
      <div style={{
        position: "absolute", right: 0, top: 0,
        width: phase >= 1 ? "0%" : "50%", height: "100%",
        background: "linear-gradient(270deg, #8B0000 0%, #B22222 60%, #6B0000 100%)",
        transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 10, boxShadow: "inset 20px 0 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ position: "absolute", left: "20%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.15)" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.1)" }} />
      </div>

      {/* Curtain rod */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 12,
        background: "linear-gradient(180deg, #D4AF37, #B8860B)", zIndex: 20,
      }} />

      {/* Behind curtain text */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0, transition: "opacity 0.8s ease",
        textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", color: "#ccc",
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>Welcome to</div>
        <div style={{ fontSize: 48, fontWeight: "bold", color: "#D4AF37" }}>The Dog Show</div>
        <div style={{ fontSize: 16, marginTop: 12, color: "#888" }}>Enjoy.</div>
      </div>
    </div>
  );
}

// ─── INTERMISSION OVERLAY (sits on top of the dog area only) ────

function IntermissionOverlay() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => d.length >= 3 ? "" : d + ".");
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F5F0E1",
    }}>
      <div style={{
        border: "4px double #8B7355",
        padding: "36px 48px",
        background: "#FFF8E7",
        textAlign: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
        maxWidth: "90%",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#8B7355", marginBottom: 14, textTransform: "uppercase" }}>
          — Intermission —
        </div>
        <div style={{ fontSize: 24, color: "#4A3728", marginBottom: 6 }}>
          Please Stand By{dots}
        </div>
        <div style={{ fontSize: 13, color: "#8B7355", marginBottom: 20, fontStyle: "italic" }}>
          The dogs will return shortly.
        </div>
        <div style={{ width: 50, height: 3, background: "#D4AF37", margin: "0 auto 18px" }} />
        <div style={{
          fontSize: 11, color: "#A0926B",
          border: "1px solid #D4C9A8", padding: "10px 16px",
          background: "#FFFDF5", fontStyle: "italic",
        }}>
          This intermission sponsored by:<br />
          <strong style={{ color: "#6B5B3E" }}>Your Ad Here — $5.00</strong>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: "#B8A88A", fontStyle: "italic" }}>
          &#9835; (imagine an old-timey jangle playing) &#9835;
        </div>
      </div>
    </div>
  );
}

// ─── UPLOAD MODAL ───────────────────────────────────────────────

function UploadDogModal({ onClose, onUpload }) {
  const [dogName, setDogName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app this uploads to a server. For prototype, create object URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    if (!previewUrl) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setDone(true);
      onUpload({ url: previewUrl, name: dogName || "A Very Good Dog" });
      setTimeout(() => onClose(), 1500);
    }, 1200);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#FFF8E7", border: "3px double #D4AF37",
        padding: 28, maxWidth: 380, width: "90%",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>&#10003;</div>
            <div style={{ fontSize: 18, color: "#4A3728" }}>Your dog has been immortalised!</div>
            <div style={{ fontSize: 12, color: "#8B7355", marginTop: 8, fontStyle: "italic" }}>
              They will appear in the show forever.
            </div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#4A3728" }}>
                Immortalise Your Dog
              </div>
              <div style={{ fontSize: 12, color: "#8B7355", marginTop: 6, fontStyle: "italic" }}>
                Upload one photo — $1.00 — forever in the show
              </div>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #D4C9A8",
                padding: previewUrl ? 4 : 32,
                textAlign: "center",
                cursor: "pointer",
                marginBottom: 16,
                background: "#FFFDF5",
                minHeight: previewUrl ? 0 : 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Your dog" style={{
                  maxWidth: "100%", maxHeight: 200, objectFit: "contain",
                }} />
              ) : (
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8, color: "#D4C9A8" }}>&#128054;</div>
                  <div style={{ fontSize: 13, color: "#8B7355" }}>Click to select a photo of your dog</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
              style={{ display: "none" }} />

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#8B7355", display: "block", marginBottom: 6 }}>
                Dog's Stage Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sir Barksalot"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid #D4C9A8", background: "#FFFDF5",
                  fontFamily: "Georgia, serif", fontSize: 13,
                  outline: "none", color: "#4A3728", boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!previewUrl || uploading}
              style={{
                width: "100%", padding: "12px",
                background: previewUrl ? "#4A3728" : "#D4C9A8",
                color: "#FFF8E7", border: "none",
                fontFamily: "Georgia, serif", fontSize: 14,
                cursor: previewUrl ? "pointer" : "default",
                fontWeight: "bold",
              }}
            >
              {uploading ? "Uploading..." : "Pay $1.00 & Immortalise"}
            </button>

            <div style={{
              textAlign: "center", marginTop: 12,
              fontSize: 10, color: "#B8A88A", fontStyle: "italic",
            }}>
              One upload per VIP. Choose wisely. This is permanent.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LIFETIME PASS MODAL ────────────────────────────────────────

function LifetimePassModal({ onClose, onBuy }) {
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState(false);

  const handleBuy = () => {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      setDone(true);
      onBuy();
      setTimeout(() => onClose(), 2000);
    }, 1500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#FFF8E7", border: "4px double #D4AF37",
        padding: 32, maxWidth: 400, width: "90%",
        fontFamily: "Georgia, 'Times New Roman', serif",
        textAlign: "center",
      }}>
        {done ? (
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>&#127942;</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#D4AF37" }}>
              You are now a Lifetime Member.
            </div>
            <div style={{ fontSize: 13, color: "#8B7355", marginTop: 10, fontStyle: "italic" }}>
              The dogs are yours. Forever.
            </div>
            <div style={{
              marginTop: 16, padding: "12px 20px",
              border: "2px solid #D4AF37", background: "#FFFDF5",
              fontSize: 11, color: "#6B5B3E",
            }}>
              CERTIFICATE OF LIFETIME MEMBERSHIP<br />
              The Dog Show &mdash; Est. 2026<br />
              <strong>Member #00001</strong><br />
              Valid: Forever
            </div>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 11, letterSpacing: 4, color: "#D4AF37",
              textTransform: "uppercase", marginBottom: 12,
            }}>
              &#9733; Exclusive Offer &#9733;
            </div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#4A3728", marginBottom: 6 }}>
              Lifetime Pass
            </div>
            <div style={{ fontSize: 14, color: "#8B7355", marginBottom: 20, fontStyle: "italic" }}>
              Never pay again. Dogs forever.
            </div>

            <div style={{
              padding: "16px 20px", border: "1px solid #D4C9A8",
              background: "#FFFDF5", marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 13, color: "#4A3728", marginBottom: 8 }}>
                <strong>What you get:</strong>
              </div>
              <div style={{ fontSize: 12, color: "#6B5B3E", lineHeight: 1.8 }}>
                &#10003; Unlimited dog show access, forever<br />
                &#10003; Permanent gold name in chat<br />
                &#10003; A certificate (this one)<br />
                &#10003; The knowledge that you did this
              </div>
            </div>

            <div style={{
              fontSize: 36, fontWeight: "bold", color: "#D4AF37", marginBottom: 4,
            }}>
              $4.99
            </div>
            <div style={{ fontSize: 11, color: "#B8A88A", marginBottom: 20, textDecoration: "line-through" }}>
              $5,000.00/year
            </div>

            <button
              onClick={handleBuy}
              disabled={buying}
              style={{
                width: "100%", padding: "14px",
                background: buying
                  ? "#B8A88A"
                  : "linear-gradient(135deg, #D4AF37, #B8860B)",
                color: "#fff", border: "none",
                fontFamily: "Georgia, serif", fontSize: 15,
                cursor: buying ? "default" : "pointer",
                fontWeight: "bold",
              }}
            >
              {buying ? "Processing..." : "Commit to Dogs — $4.99"}
            </button>

            <div style={{
              marginTop: 14, fontSize: 10, color: "#B8A88A", fontStyle: "italic",
            }}>
              No refunds. You knew what this was.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DOG SHOW ──────────────────────────────────────────────

function DogShowMain() {
  const [dogQueue, setDogQueue] = useState([...SEED_DOGS]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDogUrl, setCurrentDogUrl] = useState(SEED_DOGS[0]);
  const [currentDogName, setCurrentDogName] = useState(DOG_NAMES[0]);
  const [communityDogs, setCommunityDogs] = useState([]);

  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [username] = useState("you");
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 40) + 12);

  const [isVIP, setIsVIP] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [hasUploadToken, setHasUploadToken] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [usedUploadToken, setUsedUploadToken] = useState(false);

  const [isLifetime, setIsLifetime] = useState(false);
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);

  const [isIntermission, setIsIntermission] = useState(false);
  const [sponsorBanner, setSponsorBanner] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dogTransition, setDogTransition] = useState(true);

  const chatRef = useRef(null);
  const nameIndex = useRef(0);

  // Fetch random dogs from API to build an infinite queue
  const fetchMoreDogs = useCallback(async () => {
    try {
      const resp = await fetch("https://dog.ceo/api/breeds/image/random/5");
      const data = await resp.json();
      if (data.status === "success") {
        setDogQueue((prev) => [...prev, ...data.message]);
      }
    } catch (e) {
      // If API fails, recycle seed dogs
      setDogQueue((prev) => [...prev, ...SEED_DOGS]);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMoreDogs();
  }, [fetchMoreDogs]);

  // Get a random name for any dog
  const getNextName = useCallback(() => {
    const name = DOG_NAMES[nameIndex.current % DOG_NAMES.length];
    nameIndex.current += 1;
    return name;
  }, []);

  // Dog slideshow — cycles through queue, fetches more when running low
  useEffect(() => {
    if (isIntermission) return;
    const interval = setInterval(() => {
      setDogTransition(false);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;

          // Build combined list: API dogs + community dogs shuffled in
          const allDogs = [...dogQueue];
          communityDogs.forEach((cd) => {
            // Insert community dogs at intervals
            const pos = Math.min(allDogs.length, Math.floor(Math.random() * allDogs.length));
            allDogs.splice(pos, 0, cd.url);
          });

          const idx = next % Math.max(allDogs.length, 1);
          const nextUrl = allDogs[idx] || SEED_DOGS[0];
          const communityDog = communityDogs.find((cd) => cd.url === nextUrl);

          setCurrentDogUrl(nextUrl);
          setCurrentDogName(communityDog ? communityDog.name + " (community dog!)" : getNextName());
          setImgLoaded(false);

          // Fetch more when we're getting near the end
          if (next > dogQueue.length - 5) {
            fetchMoreDogs();
          }

          return next;
        });
        setDogTransition(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [isIntermission, dogQueue, communityDogs, fetchMoreDogs, getNextName]);

  // Fake chat messages — uses intermission messages during intermission
  useEffect(() => {
    const addFakeMsg = () => {
      const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const pool = isIntermission ? INTERMISSION_MESSAGES : FAKE_MESSAGES;
      const msg = pool[Math.floor(Math.random() * pool.length)];
      const isVip = Math.random() > 0.7;
      const skin = isVip ? VIP_SKINS[Math.floor(Math.random() * VIP_SKINS.length)] : null;
      const isLt = isVip && Math.random() > 0.8;
      setMessages((prev) => [...prev.slice(-80), {
        user, msg, isVip, skin, isLifetime: isLt, id: Date.now() + Math.random()
      }]);
    };
    const interval = setInterval(addFakeMsg, 2000 + Math.random() * 4000);
    addFakeMsg();
    return () => clearInterval(interval);
  }, [isIntermission]);

  // Scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((v) => Math.max(5, v + Math.floor(Math.random() * 7) - 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Intermission every 45s (compressed for demo)
  useEffect(() => {
    const timer = setInterval(() => {
      setIsIntermission(true);
      setTimeout(() => setIsIntermission(false), 12000);
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  // Sponsor banner
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setSponsorBanner(SPONSOR_MESSAGES[Math.floor(Math.random() * SPONSOR_MESSAGES.length)]);
        setTimeout(() => setSponsorBanner(null), 8000);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!inputMsg.trim()) return;
    setMessages((prev) => [...prev.slice(-80), {
      user: username, msg: inputMsg.trim(),
      isVip: isVIP, skin: selectedSkin, isLifetime, isMe: true, id: Date.now(),
    }]);
    setInputMsg("");
  };

  const buyVIP = (skin) => {
    setIsVIP(true);
    setSelectedSkin(skin);
    setHasUploadToken(true);
    setShowVIPModal(false);
  };

  const handleDogUpload = (dog) => {
    setCommunityDogs((prev) => [...prev, dog]);
    setUsedUploadToken(true);
    setHasUploadToken(false);
  };

  const buyLifetime = () => {
    setIsLifetime(true);
  };

  // ─── RENDER ───
  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F0E1",
      fontFamily: "Georgia, 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#FFF8E7",
        borderBottom: "2px solid #D4C9A8",
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: "bold", color: "#4A3728" }}>The Dog Show</span>
          <span style={{ fontSize: 11, color: "#8B7355" }}>est. 2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#B22222" }}>
            &#9679; LIVE — {viewerCount} watching
          </span>

          {!isVIP && (
            <button onClick={() => setShowVIPModal(true)} style={{
              background: "#D4AF37", color: "#fff", border: "none",
              padding: "5px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "Georgia, serif", fontWeight: "bold",
            }}>
              &#9733; Go VIP — $1.00
            </button>
          )}

          {isVIP && hasUploadToken && !usedUploadToken && (
            <button onClick={() => setShowUploadModal(true)} style={{
              background: "#8B0000", color: "#FFF8E7", border: "none",
              padding: "5px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "Georgia, serif", fontWeight: "bold",
            }}>
              &#128054; Upload Your Dog — $1.00
            </button>
          )}

          {!isLifetime && (
            <button onClick={() => setShowLifetimeModal(true)} style={{
              background: "linear-gradient(135deg, #D4AF37, #B8860B)",
              color: "#fff", border: "none",
              padding: "5px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "Georgia, serif", fontWeight: "bold",
            }}>
              &#127942; Lifetime Pass
            </button>
          )}

          {isVIP && (
            <span style={{
              fontSize: 11,
              color: selectedSkin?.color || "#D4AF37",
              fontWeight: "bold",
            }}>
              {isLifetime ? "&#127942; LIFETIME" : "&#9733; VIP"}
            </span>
          )}
          {isLifetime && !isVIP && (
            <span style={{ fontSize: 11, color: "#D4AF37", fontWeight: "bold" }}>
              &#127942; LIFETIME
            </span>
          )}
        </div>
      </div>

      {/* Sponsor banner */}
      {sponsorBanner && (
        <div style={{
          background: "#4A3728", color: "#D4AF37",
          textAlign: "center", padding: "6px",
          fontSize: 12, fontStyle: "italic",
          overflow: "hidden", whiteSpace: "nowrap",
        }}>
          &#9733; {sponsorBanner} &#9733;
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", minHeight: 0 }}>

        {/* Dog display area — intermission overlays ONLY this section */}
        <div style={{
          flex: "1 1 60%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 20, position: "relative",
        }}>
          {/* Intermission overlay — only covers the dog area */}
          {isIntermission && <IntermissionOverlay />}

          {/* Mini curtain frame */}
          <div style={{
            position: "relative",
            border: "3px solid #8B0000", padding: 4,
            background: "#2a0a0a", maxWidth: 480, width: "100%",
          }}>
            {/* Curtain drape top */}
            <div style={{
              height: 24,
              background: "linear-gradient(180deg, #8B0000, #6B0000)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: "60%", height: 12,
                borderRadius: "0 0 50% 50%",
                background: "radial-gradient(ellipse at center, #B22222, #8B0000)",
              }} />
            </div>

            <div style={{
              position: "relative", width: "100%", paddingBottom: "66%",
              background: "#1a0a0a", overflow: "hidden",
            }}>
              <img
                src={currentDogUrl}
                alt="A good dog"
                onLoad={() => setImgLoaded(true)}
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: dogTransition && imgLoaded ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              />
            </div>

            {/* Gold footer bar */}
            <div style={{
              height: 6,
              background: "linear-gradient(90deg, #B8860B, #D4AF37, #B8860B)",
            }} />
          </div>

          {/* Dog name plate */}
          <div style={{
            marginTop: 12, padding: "6px 20px",
            background: "#FFF8E7", border: "1px solid #D4C9A8",
            fontSize: 14, color: "#4A3728",
            fontStyle: "italic", textAlign: "center",
          }}>
            Now presenting: <strong>{currentDogName}</strong>
          </div>

          {communityDogs.length > 0 && (
            <div style={{
              marginTop: 8, fontSize: 11, color: "#8B7355", fontStyle: "italic",
            }}>
              {communityDogs.length} community dog{communityDogs.length > 1 ? "s" : ""} in the show
            </div>
          )}
        </div>

        {/* Chat — always visible, even during intermission */}
        <div style={{
          flex: "0 0 300px",
          display: "flex", flexDirection: "column",
          borderLeft: "2px solid #D4C9A8", background: "#FFF8E7",
        }}>
          <div style={{
            padding: "8px 12px",
            borderBottom: "1px solid #D4C9A8",
            fontSize: 12, color: "#8B7355", fontWeight: "bold",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>Live Chat</span>
            {isIntermission && (
              <span style={{ color: "#B22222", fontWeight: "normal", fontStyle: "italic" }}>
                &#9835; intermission &#9835;
              </span>
            )}
          </div>

          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "8px 12px",
            display: "flex", flexDirection: "column", gap: 4,
            minHeight: 0, maxHeight: "calc(100vh - 180px)",
          }}>
            {messages.map((m) => (
              <div key={m.id} style={{
                fontSize: 13, lineHeight: 1.4,
                padding: m.isVip ? "2px 6px" : "2px 0",
                background: m.isLifetime
                  ? "rgba(212,175,55,0.08)"
                  : (m.isVip && m.skin ? m.skin.bg : "transparent"),
                borderLeft: m.isLifetime
                  ? "2px solid #D4AF37"
                  : (m.isVip && m.skin ? `2px solid ${m.skin.border}` : "none"),
              }}>
                <span style={{
                  fontWeight: "bold",
                  color: m.isLifetime
                    ? "#D4AF37"
                    : (m.isVip && m.skin ? m.skin.color : (m.isMe ? "#B22222" : "#6B5B3E")),
                  fontSize: 12,
                }}>
                  {m.isLifetime && "&#127942; "}
                  {m.isVip && !m.isLifetime && "&#9733; "}
                  {m.user}
                </span>
                {": "}
                <span style={{ color: "#4A3728" }}>{m.msg}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: 8, borderTop: "1px solid #D4C9A8",
            display: "flex", gap: 6,
          }}>
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Say something..."
              style={{
                flex: 1, padding: "8px 10px",
                border: "1px solid #D4C9A8", background: "#FFFDF5",
                fontFamily: "Georgia, serif", fontSize: 13,
                outline: "none", color: "#4A3728",
              }}
            />
            <button onClick={sendMessage} style={{
              padding: "8px 14px", background: "#4A3728",
              color: "#FFF8E7", border: "none",
              fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer",
            }}>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVIPModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowVIPModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFF8E7", border: "3px double #D4AF37",
            padding: 28, maxWidth: 360, width: "90%",
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#4A3728" }}>&#9733; VIP Access &#9733;</div>
              <div style={{ fontSize: 13, color: "#8B7355", marginTop: 6, fontStyle: "italic" }}>
                Choose your username skin — $1.00
              </div>
              <div style={{ fontSize: 11, color: "#B8A88A", marginTop: 4 }}>
                Includes one dog upload token!
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VIP_SKINS.map((skin) => (
                <button key={skin.name} onClick={() => buyVIP(skin)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: skin.bg,
                  border: `1px solid ${skin.border}`, cursor: "pointer",
                  fontFamily: "Georgia, serif", fontSize: 13, textAlign: "left",
                }}>
                  <span style={{ color: skin.color, fontWeight: "bold", fontSize: 14 }}>
                    &#9733; {skin.name}
                  </span>
                  <span style={{ color: "#8B7355", fontSize: 11, marginLeft: "auto" }}>
                    Preview: <span style={{ color: skin.color, fontWeight: "bold" }}>&#9733; you</span>
                  </span>
                </button>
              ))}
            </div>

            <div style={{
              textAlign: "center", marginTop: 16,
              fontSize: 11, color: "#B8A88A", fontStyle: "italic",
            }}>
              All proceeds go to the dogs (not really)
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadDogModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDogUpload}
        />
      )}

      {showLifetimeModal && (
        <LifetimePassModal
          onClose={() => setShowLifetimeModal(false)}
          onBuy={buyLifetime}
        />
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────

export default function DogShow() {
  const [screen, setScreen] = useState("landing");

  return (
    <div>
      {screen === "landing" && <LandingPage onEnter={() => setScreen("payment")} />}
      {screen === "payment" && <PaymentScreen onComplete={() => setScreen("curtain")} />}
      {screen === "curtain" && <CurtainReveal onComplete={() => setScreen("show")} />}
      {screen === "show" && <DogShowMain />}
    </div>
  );
}