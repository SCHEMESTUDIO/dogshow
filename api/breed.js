// ─────────────────────────────────────────────────────────────────────────
// api/breed.js — Vercel serverless function. Server-renders the per-breed
// hub page at /breeds/{slug}. vercel.json rewrites /breeds/:slug →
// /api/breed?slug=:slug.
//
// Architectural decision (see seo-breed-hub-plan.md §1a): pages MUST work
// without any user-uploaded dogs of this breed. The user-dog grid is a
// bonus section, hidden when N=0. Differentiator carried by hand-written
// voice (Wodehouse-genial host) + show-ring framing.
//
// Pilot content for 'bernedoodle' is embedded below. When we batch the
// remaining 19 P1 breeds, refactor BREEDS to file-based content/breeds/*.js
// so editorial diffs stay scoped to one breed at a time.
// ─────────────────────────────────────────────────────────────────────────
const PARTY = 'https://dogshow.schemestudio.partykit.dev/party/dogshow-live';
const SITE = 'https://dogshow.lol';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Naive English pluralizer, sufficient for our breed names: consonant+y → -ies
// (Pomsky → Pomskies), everything else → +s (Bernedoodle → Bernedoodles,
// Mini Aussie → Mini Aussies). Used to build the reader-first spotlight heading.
function pluralize(name) {
  if (/[^aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
  return name + 's';
}

// ─── Content store ─────────────────────────────────────────────────────
// Pilot — Bernedoodle. Voice + structure are the template; clone for the
// next P1 breeds (see plan §6). Each section is hand-written; do NOT
// build a parameterized "[Breed] is a [size] dog known for [trait]" filler.
// Google's helpful-content classifier eats those. (Plan §9 risk #1.)
//
// ── Page funnel design (rev 2026-06-19) ──────────────────────────────────
// These pages are TOP OF FUNNEL: visitors arrive from Google with
// informational intent (breed research), NOT show-buying intent. So the
// rendered section order satisfies the search first, then bridges to the
// show, then offers the FREE watch as the primary CTA and the $3.99 paid
// entry only as a secondary, owner-only step.
//   Render order (see renderBreedPage): lede → live widget → facts →
//   owner-fit → famous → "see them live" show bridge (+ free watch) →
//   user-dog social proof → dual CTA (watch free / put yours on stage).
// Per-breed content shape required by the template: name, headKeyword,
// metaDescription, facts{}, lede, spotlight, ownerFitHeading, ownerFit,
// famousHeading, famous, relatedBreeds[], breedTagName.
//   NOTE: `spotlightHeading` is DEPRECATED — the spotlight heading is now
//   auto-generated reader-first ("See {plural} on the live show"). The old
//   per-breed spotlightHeading fields below are vestigial and ignored; new
//   breeds do not need one.
//   OPTIONAL hero fields (the top-of-page image):
//     heroImage  — path to a representative breed photo, e.g.
//                  '/breeds-img/bernedoodle.jpg' (static file at repo root,
//                  served by Vercel). Shown ONLY when no submitted dog of this
//                  breed exists yet — a real submitted dog's photo always wins
//                  and links to its certificate page.
//     heroAlt    — alt text for that photo (defaults to "{Breed} — breed photo").
//     heroCredit — raw HTML attribution shown under the photo (required for
//                  CC-licensed images), e.g. 'Photo: <a href="…">Name</a> / CC BY-SA 4.0'.
//   With no heroImage and no submitted dog, the hero is a branded
//   "Be the first {Breed} on our stage" prompt (no broken image).
const BREEDS = {
  bernedoodle: {
    heroImage: '/breeds-img/bernedoodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Bernedoodle',
    headKeyword: 'Bernedoodle',
    metaDescription: "The Bernedoodle: a Bernese Mountain Dog and a Poodle conspired, and the result is gentler than the sum of its parts. A field guide to the breed, with stage notes.",
    facts: {
      'Group': 'Designer mix (Bernese Mountain Dog × Poodle)',
      'Size': 'Tiny 10–24 lb · Mini 25–49 lb · Standard 70–90 lb',
      'Temperament': 'Goofy, gentle, low prey drive, affectionate',
      'Life expectancy': '12–18 years (smaller variants tend longer)',
      'Coat': 'Wavy to curly; shed level depends on generation',
      'Colors': 'Tri-color (black/white/rust), bi-color, sable, phantom',
      'AKC recognized': 'No — designer mix; recognized by some boutique clubs',
      'First bred': '2003, Sherry Rupke, Ontario',
    },
    lede: `The Bernedoodle is what happens when a Bernese Mountain Dog wanders into a literary salon and meets a Poodle who is, as Poodles invariably are, the most well-read creature in the room. The resulting offspring inherits the Berner's gentle <em>"I would carry your child up a mountain"</em> demeanour and the Poodle's slightly terrifying competence with logic puzzles. They also inherit, with the genetic precision of a coin flip, either a low-shedding coat or a coat that will redecorate your living room.`,
    spotlightHeading: 'Why we love the Bernedoodle on stage',
    spotlight: `<p>On the Dog Show stage, the Bernedoodle is a study in scale meets cuddle. Standards lumber in like a piece of furniture that has decided to participate in life and would like, please, a snack. Minis bounce — there is no other verb. Tiny Bernedoodles, who barely cross the threshold into existence at ten pounds, seem to defy several laws of zoology by being mostly eyes and floof.</p>
<p>What they share, top to tail, is an immunity to stage fright. The Bernedoodle does not perform. The Bernedoodle does not posture. The Bernedoodle, presented with a glowing screen full of strangers, simply sits down and assumes the strangers are there for a reason and that the reason is benign. This is correct, of course. The strangers are there to give it bones.</p>
<p>There is also, in nearly every Bernedoodle we have hosted, a particular look — head tilted, ears forward, one front paw lifted as if mid-thought. The Bernedoodle is not, in that moment, having a thought. The Bernedoodle is having an audience. They were born for this.</p>`,
    ownerFitHeading: 'Is a Bernedoodle right for you?',
    ownerFit: `<p>The honest answer is: only if you have the floor space, the patience for adolescence, and a relaxed view of what constitutes "a tidy living room."</p>
<p><strong>Shedding.</strong> Bernedoodles are, by reputation, low-shedding. By reality, this depends entirely on which genes won. A first-generation Bernedoodle (F1) is exactly half Berner and half Poodle, and roughly half of any given litter will shed. F1b crosses — the puppy bred back to a Poodle — shed less but cost more. If your allergy is mild, an F1b is usually fine. If your allergy is the kind that re-routes Christmas plans, get a Poodle.</p>
<p><strong>Energy.</strong> Moderate. They want one solid walk and a play session a day. They do not want a sport. They especially do not want, despite their build, to run alongside your bicycle — a Bernedoodle would rather be <em>in</em> the bicycle.</p>
<p><strong>Trainability.</strong> High, with caveats. Bernedoodles take instruction beautifully for about eight months, then enter adolescence and forget everything they ever learned. This phase ends around eighteen months. Do not panic.</p>
<p><strong>Grooming.</strong> A non-negotiable monthly cost. Their coat mats if not brushed, and a matted Bernedoodle is a sad Bernedoodle. Budget for a groomer or commit to learning the trade yourself.</p>
<p><strong>Health.</strong> Hip dysplasia is the inheritable concern; bloat is rarer but more serious. Choose a breeder who screens both parents.</p>
<p>If all of the above sounds workable, you will be rewarded with one of the warmest dogs in the modern designer-mix landscape.</p>`,
    famousHeading: 'Famous Bernedoodles',
    famous: `<p>The Bernedoodle has not yet produced a Lassie. The breed is too young — it was first deliberately crossed in 2003 by Sherry Rupke in Ontario, which makes the entire breed younger than several of our viewers' Volvos. As such, there are no Bernedoodle movies, no Bernedoodle prime ministers, and no Bernedoodle astronauts. Yet.</p>
<p>What there are: a great many Bernedoodle Instagram accounts with follower counts that would embarrass mid-tier sitcoms. Bear the Bernedoodle is essentially a brand. Maggie the Mini Bernedoodle has been quoted by lifestyle press. Whether this constitutes fame depends entirely on how you feel about the present moment.</p>
<p>We will, in time, see a Bernedoodle in a film. It will be marketed as a family drama. The Bernedoodle will steal the picture.</p>`,
    relatedBreeds: [
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'bernese-mountain-dog', name: 'Bernese Mountain Dog' },
      { slug: 'labradoodle', name: 'Labradoodle' },
      { slug: 'poodle', name: 'Poodle' },
    ],
    // Breed name as it will appear in the user's breeds.js dropdown — used to
    // query /dogs-by-breed and to inner-link from /d/{slug} certificate pages.
    breedTagName: 'Bernedoodle',
  },

  goldendoodle: {
    heroImage: '/breeds-img/goldendoodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Goldendoodle',
    headKeyword: 'Goldendoodle',
    metaDescription: "The Goldendoodle: a Golden Retriever crossed with a Poodle, gifted with the Golden's unconditional yes and the Poodle's deep suspicion of your decision-making. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Golden Retriever × Poodle)',
      'Size': 'Mini 15–35 lb · Medium 35–55 lb · Standard 50–90 lb',
      'Temperament': 'Friendly, outgoing, easy with strangers, food-motivated',
      'Life expectancy': '10–15 years (smaller variants tend longer)',
      'Coat': 'Wavy to curly; shed level varies by generation',
      'Colors': 'Cream, apricot, red, chocolate, parti, sable',
      'AKC recognized': 'No — designer mix; recognized by some boutique clubs',
      'First bred': 'Late 1990s, deliberately popularized in North America',
    },
    lede: `There is a particular kind of dog who, asked to do anything, says yes first and works out the details later. The Goldendoodle is that dog — a Golden Retriever crossed with a Poodle, gifted with the Golden's unconditional positive regard and the Poodle's deeply suspicious intelligence. The result is a creature who will fetch your slippers, decide you are holding them wrong, and then forgive you for it. They come in three sizes and exactly one temperament: delighted.`,
    spotlightHeading: 'Why we love the Goldendoodle on stage',
    spotlight: `<p>The Goldendoodle is our most reliable performer. They do not enter — they arrive. There is a soft jog, a head bob, the loose-jointed bonhomie of a dog who has never been told no and would not believe you if you did. Standards fill the frame like a friendly weather system. Miniatures, who weigh thirty pounds when wet, are nevertheless convinced they are the same dog as their parents and act accordingly.</p>
<p>What sells them, on screen, is the face. The Goldendoodle has been bred — accidentally, since these are early days for the breed — into a kind of permanent gentle surprise. Eyebrows up. Ears alert. Mouth slightly open as though about to say something kind. Viewers send them bones at a rate that does not quite track with the breed's actual rarity in our submissions. Goldendoodles overperform. It is the face.</p>
<p>If a Goldendoodle is on stage and a noise occurs somewhere off-camera, you will see one ear adjust. Not the head. Just the ear. The rest of the dog continues to be charming at you. They are competent multitaskers, in the doggish sense — capable of taking in new information and being delightful simultaneously, with neither suffering.</p>`,
    ownerFitHeading: 'Is a Goldendoodle right for you?',
    ownerFit: `<p>Goldendoodles are easy. This is both the truth and a warning.</p>
<p>They are easy temperamentally — friendly with everyone, low aggression, low prey drive, eager to please. They are easy to train, in the sense that they pick up commands quickly. They are not easy to exhaust, which is where new owners get into trouble: a young Goldendoodle without enough daily activity becomes a creative problem-solver, and Goldendoodle creativity tends to express itself in your shoes.</p>
<p><strong>Energy.</strong> Higher than a typical Golden, lower than a typical Poodle. Plan for an hour of activity a day. They love water and most of them swim well. A Goldendoodle who has not had a swim in two weeks may give you a particular look. Honour it.</p>
<p><strong>Coat.</strong> The same coin-flip as the Bernedoodle. F1 sheds variably, F1b sheds less but costs more. If your sofa is white, plan accordingly. Brushing twice a week is the minimum to avoid mats.</p>
<p><strong>Trainability.</strong> Excellent through eight months, infuriating through eighteen, excellent again thereafter. The Goldendoodle adolescent is the strongest known disproof of the Golden Retriever's reputation for placid obedience.</p>
<p><strong>Health.</strong> Hip dysplasia. Cataracts later in life. The usual large-breed concerns. The Poodle side brings longer life expectancy — a well-bred Standard commonly reaches fourteen, a Miniature sixteen.</p>
<p>If your household has the time and the daily walk in it, a Goldendoodle will be one of the most uncomplicated and joyful relationships of your adult life.</p>`,
    famousHeading: 'Famous Goldendoodles',
    famous: `<p>The Goldendoodle is younger than the Bernedoodle — first deliberately bred in the late 1990s — but it has had a much faster cultural rise. Senator Mitt Romney's family Goldendoodle, Tilly, sat in on the 2012 presidential campaign. Usain Bolt has one. The actress Anne Hathaway has photographed hers more often than several of her co-stars.</p>
<p>There is also a small subgenre of Goldendoodle social media in which the dog has been groomed into a teddy-bear silhouette — round face, short legs, fluffy coat — and posted in increasingly elaborate domestic tableaux. We have opinions about this. The dogs do not seem to mind.</p>`,
    relatedBreeds: [
      { slug: 'golden-retriever', name: 'Golden Retriever' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'mini-golden-retriever', name: 'Mini Golden Retriever' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'labradoodle', name: 'Labradoodle' },
    ],
    breedTagName: 'Goldendoodle',
  },

  'mini-golden-retriever': {
    heroImage: '/breeds-img/mini-golden-retriever.jpg',
    heroCredit: 'AI-generated image',
    name: 'Mini Golden Retriever',
    headKeyword: 'Mini Golden Retriever',
    metaDescription: "The Mini Golden Retriever isn't quite a breed — it's a three-way mix designed to put a Golden's temperament in a lap-sized body. Mostly successful. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Golden Retriever × Cocker Spaniel × Poodle)',
      'Size': '20–45 lb · 14–20 inches at shoulder',
      'Temperament': 'Friendly, eager to please, sociable, water-loving',
      'Life expectancy': '12–16 years',
      'Coat': 'Wavy; shed level varies by mix ratio',
      'Colors': 'Cream, apricot, gold, red',
      'AKC recognized': 'No — not a single defined breed; mix ratios vary by breeder',
      'Also called': 'Comfort Retriever, Petite Golden, Mini Golden',
    },
    lede: `The Mini Golden Retriever is a deliberate confusion. It is not, despite the suggestive name, a downsized version of the breed your aunt's family had in the 1980s — it is a three-way mix of Golden Retriever, Cocker Spaniel, and Poodle, designed by breeders to produce the temperament and look of a Golden in a body that fits on your lap. The trick is mostly successful. The Mini Golden Retriever is sometimes mistaken, by inattentive observers, for a Golden viewed through the wrong end of a telescope.`,
    spotlightHeading: 'Why we love the Mini Golden Retriever on stage',
    spotlight: `<p>Watching a Mini Golden Retriever on stage is a small lesson in genetic chance. Some of them look like Golden Retrievers, full stop — same expression, same coat, same gentle confusion at being asked to sit still — only thirty pounds instead of seventy-five. Others, depending on which parents won the argument, look like very competent Cocker Spaniels with delusions of grandeur. Viewers cannot always tell which they are watching, and the dogs themselves are unbothered by the question.</p>
<p>What unites them is the temperament. The Mini Golden Retriever, regardless of which mix produced it, inherits the Golden's most reliable trait: the unshakeable conviction that everyone they meet is a friend they have not yet greeted properly. On screen this reads as enthusiasm without aggression, attention without anxiety. They lean toward the camera as though it had asked them a question.</p>
<p>Bone counts for Mini Golden Retrievers are remarkably steady. There is no virality, no spike, no breakout charm — just a consistent, day-after-day appreciation from viewers who find them quietly perfect. The Mini Golden Retriever is the breakfast cereal of the doodle world. You do not get excited. You eat it every morning.</p>`,
    ownerFitHeading: 'Is a Mini Golden Retriever right for you?',
    ownerFit: `<p><strong>Honesty first:</strong> the Mini Golden Retriever is not an official breed. The American Kennel Club does not recognise it. Each breeder defines "Mini Golden" slightly differently. You can buy a Mini Golden that is 75% Golden Retriever, or one that is 25%, and both are sold under the same name. If consistency matters to you, ask each breeder for the exact parent breakdown of their lines.</p>
<p><strong>Energy.</strong> Moderate to high. The Golden side brings retriever drive — they want to carry things, fetch things, swim. The Poodle side brings stamina. The Cocker Spaniel side brings, occasionally, an opinion about herding the household.</p>
<p><strong>Coat.</strong> Variable. Some Minis are low-shedding (Poodle-dominant); others shed like a small Golden (Golden-dominant). Both require regular brushing. Plan for grooming visits every six to eight weeks.</p>
<p><strong>Trainability.</strong> Excellent. The Mini Golden Retriever inherits all three parent breeds' eagerness to please, with very little of the Cocker's occasional stubbornness. They are good first dogs for committed owners.</p>
<p><strong>Health.</strong> Hybrid vigour helps, but the parent breeds bring hip dysplasia, eye conditions, and the Cocker's ear infections. Choose a breeder who screens all three parent lines.</p>
<p><strong>Size.</strong> This is the appeal. Most Minis stay between 20 and 45 pounds. A Mini Golden Retriever can live in an apartment, travel as a carry-on with the right airline, and still play fetch like its full-sized cousin.</p>`,
    famousHeading: 'Famous Mini Golden Retrievers',
    famous: `<p>There are no famous Mini Golden Retrievers. The breed — or rather, the cluster of mixes that calls itself the breed — is too new and too inconsistent for a celebrity to have built a recognisable association with it. What there are: many small Mini Golden Retrievers on Instagram, often filmed in coastal lifestyle settings where they appear to have been hired by the location, and a slow, steady increase in waitlist demand at the half-dozen specialist breeders in the United States.</p>
<p>In ten years there will be a Mini Golden Retriever in a film, and the film will not know that the dog is not the same breed as Air Bud. Most viewers will not notice. The dog will not care.</p>`,
    relatedBreeds: [
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'golden-retriever', name: 'Golden Retriever' },
    ],
    breedTagName: 'Mini Golden Retriever',
  },

  'saint-berdoodle': {
    heroImage: '/breeds-img/saint-berdoodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Saint Berdoodle',
    headKeyword: 'Saint Berdoodle',
    metaDescription: "The Saint Berdoodle: a Saint Bernard crossed with a Standard Poodle. Monumental in body, surprisingly clever in mind. A field guide for the brave of dining-room.",
    facts: {
      'Group': 'Designer mix (Saint Bernard × Standard Poodle)',
      'Size': 'Standard 110–180 lb · Mini 40–70 lb',
      'Temperament': 'Gentle, patient, slow-moving, devoted',
      'Life expectancy': '8–12 years',
      'Coat': 'Wavy to curly; lower shedding than Saint Bernard, still drools',
      'Colors': 'Brown/white, black/white, tri-color, sable',
      'AKC recognized': 'No — designer mix',
      'Climate': 'Cool to temperate; struggles in heat',
    },
    lede: `Pair the largest of the working breeds with the cleverest of the lap dogs and you would expect, on first principles, something disastrous. The Saint Berdoodle — a Saint Bernard mixed with a Standard Poodle — is the cheerful refutation. It inherits the Saint Bernard's monumental physical presence and the Poodle's brain, and the combination produces an animal that will occupy approximately the same square footage as your dining-room rug while quietly working out how to open the pantry door. Plan for both.`,
    spotlightHeading: 'Why we love the Saint Berdoodle on stage',
    spotlight: `<p>The Saint Berdoodle is the closest we come to having an actual celebrity arrive at the studio. Viewer counts spike when one is announced. There is no other word — they are the broad-shouldered, slow-blinking presence at the back of every great Victorian portrait. They do not move quickly. They do not need to. The light comes to them.</p>
<p>What separates the Saint Berdoodle from its parent breeds, on screen, is the eyes. The Saint Bernard's eyes are kindly but hooded, weighed by the breed's quiet melancholy. The Poodle's eyes are bright and slightly mischievous. The Saint Berdoodle inherits a hybrid: kindly, and also up to something. Often you can see them thinking, and the thoughts are mostly about food and the well-being of the smallest person in the room, often at the same time.</p>
<p>Viewers respond by sending unusually large quantities of bones. Saint Berdoodles get the cathedral treatment. They accept it as their due.</p>`,
    ownerFitHeading: 'Is a Saint Berdoodle right for you?',
    ownerFit: `<p>We need to talk about size.</p>
<p>A Standard Saint Berdoodle typically weighs 110 to 180 pounds. They eat accordingly. They take up the floor space of a small loveseat. When they shake water off, the water travels. If you are considering a Saint Berdoodle, the first question to answer honestly is: do I have the home, the floor surfaces, and the budget for a very large, slow-shedding dog?</p>
<p><strong>Energy.</strong> Lower than the Poodle parent would suggest. Saint Berdoodles inherit the Saint Bernard's leisurely view of the day. A 30-minute walk and a bit of yard time is usually enough. They do not want to run. They want to be near you, often leaning on you.</p>
<p><strong>Coat.</strong> Wavy to curly. Lower shedding than a Saint Bernard (which is high praise), but they drool. A Saint Berdoodle keeps a damp towel by the front door as a matter of cultural practice.</p>
<p><strong>Trainability.</strong> Surprisingly good. The Poodle intelligence translates well, and the Saint Bernard's natural gentleness means you almost never need to be firm. Early socialisation is non-negotiable — a poorly socialised 150-pound dog is a household problem.</p>
<p><strong>Health.</strong> Large-breed concerns dominate. Hip and elbow dysplasia, bloat, heart conditions. Their life expectancy is 8 to 12 years, which is the saddest sentence on this page. Choose a breeder who screens for heart and hip.</p>
<p><strong>Climate.</strong> They cannot handle heat. A Saint Berdoodle in Phoenix in July is a welfare issue. They thrive in cool, temperate climates. If you live somewhere hot, please consider a different breed.</p>
<p>If you have the space, the time, and the budget — the Saint Berdoodle will be one of the most calming, generous, and quietly grand companions you ever meet.</p>`,
    famousHeading: 'Famous Saint Berdoodles',
    famous: `<p>There is, as of this writing, no Saint Berdoodle in the cultural memory in the way Beethoven the Saint Bernard exists in it. The breed is too new, and arguably too rare — a Saint Berdoodle is significantly more expensive to produce than a regular Saint Bernard, and breeders are few. But the parent breed brings borrowed fame: every Saint Berdoodle is one cinematic step away from a chaotic family comedy, and the Poodle parent assures the cinematic Saint Berdoodle will be slightly smarter than the original Beethoven, which is a low bar.</p>
<p>Most actual Saint Berdoodles, in real life, are owned by families who wanted a Saint Bernard and were warned about the shedding. The dogs have no idea what they were almost instead. They are simply themselves: large, kind, and walking very slowly toward you to lean on your legs.</p>`,
    relatedBreeds: [
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'sheepadoodle', name: 'Sheepadoodle' },
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'bernese-mountain-dog', name: 'Bernese Mountain Dog' },
    ],
    breedTagName: 'Saint Berdoodle',
  },

  'mini-aussie': {
    heroImage: '/breeds-img/mini-aussie.jpg',
    heroCredit: 'AI-generated image',
    name: 'Mini Aussie',
    headKeyword: 'Mini Aussie',
    metaDescription: "The Mini Aussie: an Australian Shepherd at three-quarters scale. Same brain, same drive, smaller body. A field guide — and a warning — for prospective owners.",
    facts: {
      'Group': 'Herding (size variant of Australian Shepherd)',
      'Size': '15–35 lb · 13–18 inches at shoulder',
      'Temperament': 'Intelligent, high-drive, wary of strangers, intensely bonded',
      'Life expectancy': '13–15 years',
      'Coat': 'Medium double coat; sheds heavily seasonally',
      'Colors': 'Blue merle, red merle, black tri, red tri',
      'AKC recognized': 'Yes, as "Miniature American Shepherd" (since 2015)',
      'Also called': 'Miniature Australian Shepherd, Miniature American Shepherd',
    },
    lede: `The Mini Aussie is an Australian Shepherd at three-quarters scale, which sounds harmless and is, on the page, profoundly misleading. The body is smaller. The herding drive is not. The brain is identical. New owners often arrive expecting a portable, low-energy companion and discover, by week three, that they have brought home a strategic intelligence in a fluffy bag.`,
    spotlightHeading: 'Why we love the Mini Aussie on stage',
    spotlight: `<p>Among our most photogenic guests, the Mini Aussie is also our most uncooperative. They are bred from working stock, and working dogs do not sit still on command from a glowing screen. What we get, on a typical Mini Aussie appearance, is roughly four seconds of perfect framed portrait — the merle coat, the asymmetric eyes, the alert ears, the absurdly photogenic face — and then a sudden pivot as the dog tries to herd something off-camera. It is invariably charming.</p>
<p>The merle colouring deserves a paragraph of its own. A blue merle Mini Aussie, lit correctly, is one of the most striking-looking dogs in the modern domestic repertoire. The base coat is silver-grey marbled with darker patches; the eyes are often two different colours, sometimes one eye split between two. Viewers send bones the first time they see a merle Mini Aussie, and again every time. It is a face that does not get familiar.</p>
<p>What they share with the standard Aussie: an intelligence that needs work, a drive that needs an outlet, and a willingness to attempt to herd cats, children, vacuums, and weather.</p>`,
    ownerFitHeading: 'Is a Mini Aussie right for you?',
    ownerFit: `<p>The Mini Aussie is an active dog in a smaller body. Most of what is true about Australian Shepherds is true here.</p>
<p><strong>Energy.</strong> High. Not "long walk a day" high — closer to "two hours of mixed activity, including some kind of mental work" high. A Mini Aussie left in an apartment with a chew toy will become a behavioural problem within a month. They need to do things.</p>
<p><strong>Trainability.</strong> Off the chart. Mini Aussies are routinely among the top breeds in agility competitions for their size. They learn tricks faster than most owners can think of new ones. They also learn things you did not mean to teach them.</p>
<p><strong>Coat.</strong> Medium-length double coat. Sheds. The undercoat blows out twice a year in dramatic fashion. Plan for weekly brushing and seasonal vacuuming.</p>
<p><strong>Temperament.</strong> Wary of strangers, devoted to family. Mini Aussies tend to bond intensely with one or two people in the household. Early socialisation helps, but they are not Goldens — they are choosy.</p>
<p><strong>Herding.</strong> This is the thing nobody tells first-time owners. A Mini Aussie with no work to do will herd. Children running in a back yard. Other dogs at the park. Bikes. Cats. The herding behaviour includes nipping at heels. It is not aggression, but it is not what most families have in mind when they bring home a small fluffy puppy.</p>
<p><strong>Health.</strong> Hip dysplasia, eye conditions, and a particular sensitivity to certain veterinary drugs (MDR1 mutation) common in the breed. Reputable breeders test for MDR1.</p>
<p><strong>The honest verdict:</strong> if you run, ride, hike, or compete in a dog sport, a Mini Aussie will be the most fun you have ever had with a dog. If your activity level is more domestic, please consider almost any breed on the doodle side of this list.</p>`,
    famousHeading: 'Famous Mini Aussies',
    famous: `<p>Mini Aussies appear on the agility circuit far more than they appear in films. There is a small number of high-profile working Mini Aussies — the breed routinely dominates small-dog jumpers competitions out of all proportion to its actual population.</p>
<p>In film: nearly nothing. Mini Aussies are too recent and too uncooperative to make it into the major dog cinema. Australian Shepherds, the parent breed, have small roles in westerns. The Mini Aussie has aspirations.</p>
<p>Where Mini Aussies have arrived culturally is among a particular kind of outdoorsy young household: van life, climbing, backcountry skiing, the dog in the trailhead photograph. If you have seen a small fluffy merle dog in an Instagram tent recently, it was a Mini Aussie.</p>`,
    relatedBreeds: [
      { slug: 'mini-golden-retriever', name: 'Mini Golden Retriever' },
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'toy-aussie', name: 'Toy Aussie' },
      { slug: 'australian-shepherd', name: 'Australian Shepherd' },
    ],
    breedTagName: 'Mini Aussie',
  },

  pomsky: {
    heroImage: '/breeds-img/pomsky.jpg',
    heroCredit: 'AI-generated image',
    name: 'Pomsky',
    headKeyword: 'Pomsky',
    metaDescription: "The Pomsky: a Pomeranian crossed with a Siberian Husky. Visually startling, behaviourally exactly what you would expect. A field guide and a warning, with stage notes.",
    facts: {
      'Group': 'Designer mix (Pomeranian × Siberian Husky)',
      'Size': '15–25 lb · 10–15 inches at shoulder',
      'Temperament': 'Energetic, vocal, intelligent, independent, escape-prone',
      'Life expectancy': '13–15 years',
      'Coat': 'Thick double coat; sheds heavily',
      'Colors': 'Grey/white, black/white, red/white, brown/white — often with Husky-style mask',
      'AKC recognized': 'No — designer mix',
      'First bred': '2009; popularised through viral social-media posts',
    },
    lede: `A Pomeranian and a Siberian Husky should not, on any reasonable principle, produce a healthy puppy. The Husky is forty times the Pomeranian's body weight; the mechanics are nontrivial. Pomsky breeders use artificial insemination and Husky mothers, and the resulting puppies are exactly as visually startling as the math suggests: a fluffy small dog with the markings, eyes, and energy of a Husky, and the body of a footstool. They are too charming for their own good. We will get to the trouble.`,
    spotlightHeading: 'Why we love the Pomsky on stage',
    spotlight: `<p>If a Pomsky is announced on the stage, the chat fills with the same question: is that real? It is. A small dog, fifteen to twenty-five pounds, with the precise face of a Siberian Husky — the white mask, the bright blue eyes, often two different colours — and the alert, slightly furious expression that Huskies wear most of the time.</p>
<p>The expression deserves discussion. Pomskies inherit the Husky's particular look, which is best described as "mildly disgusted with the present situation." On a 60-pound Siberian Husky this reads as wolfish dignity. On a 20-pound Pomsky it reads as a small dog about to file a formal complaint. The effect is comic in a way that the dogs themselves do not seem aware of, which makes it funnier.</p>
<p>What viewers do not see, in the typical thirty-second Pomsky appearance, is the energy. Pomskies are small but they are not lap dogs. They want to run, they want to dig, they want to escape your yard. We do not, fortunately, have a yard on the Dog Show. The studio environment suits them.</p>`,
    ownerFitHeading: 'Is a Pomsky right for you?',
    ownerFit: `<p>The Pomsky is a high-maintenance dog in a small package, and almost everything difficult about owning a Husky is also true here.</p>
<p><strong>Energy.</strong> Very high. Pomskies need 60 to 90 minutes of real exercise daily. They are diggers, runners, and escape artists. If your fence has a gap, they will find it. If it has no gap, they will make one. Several Pomsky owners we have heard from describe their dogs as "small black-ops operators."</p>
<p><strong>Trainability.</strong> Difficult. Pomskies inherit the Husky's independent streak — they understand what you want and decide whether to comply. They are not Goldens. Training requires patience, consistency, and ideally professional help in the first year.</p>
<p><strong>Vocalisation.</strong> Pomskies talk. They howl, whine, yowl, and produce a particular conversational warble that the Husky parent is famous for. If you live in an apartment with shared walls, your neighbours will have opinions.</p>
<p><strong>Coat.</strong> Double coat, sheds heavily twice a year. The "low-maintenance fluffy small dog" fantasy is not the actual Pomsky. Plan for brushing, vacuuming, and a hair-covered home.</p>
<p><strong>Health.</strong> Generally healthy with hybrid vigour. The main concerns are hip dysplasia, dental issues (small dogs lose teeth), and eye problems.</p>
<p><strong>The honest verdict:</strong> if you wanted a Husky but live in an apartment, a Pomsky does not solve your problem. You still need the time, the activity, and the tolerance for noise. If you have all of those and want a smaller body to manage, a Pomsky is a real option. If you wanted a calm small fluffy companion, please consider almost any other breed on this list.</p>`,
    famousHeading: 'Famous Pomskies',
    famous: `<p>There are no famous Pomskies. The breed is too new — first deliberately bred in 2009 and waitlisted ever since. What there are: Pomskies on every social-media platform that rewards a striking first frame. The breed has, depending on the year, been one of the top three "most Googled dog breeds in America," which is a statistic that does not correlate well with the breed's suitability for most households.</p>
<p>We anticipate the first Pomsky cameo in a major film within five years. It will be a dating-app comedy. The dog will be billed as adorable. The dog will, in real life, have required three handlers and a chiropractor for the camera operator.</p>`,
    relatedBreeds: [
      { slug: 'pomeranian', name: 'Pomeranian' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'siberian-husky', name: 'Siberian Husky' },
      { slug: 'agouti-husky', name: 'Agouti Husky' },
    ],
    breedTagName: 'Pomsky',
  },

  'australian-labradoodle': {
    heroImage: '/breeds-img/australian-labradoodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Australian Labradoodle',
    headKeyword: 'Australian Labradoodle',
    metaDescription: "The Australian Labradoodle: not a Labrador-Poodle accident but a deliberate, multi-generational breeding program with a coat to prove it. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer breed (multi-gen Labrador × Poodle × Spaniel infusions)',
      'Size': 'Mini 15–30 lb · Medium 30–45 lb · Standard 45–77 lb',
      'Temperament': 'Intuitive, social, gentle, eager to please',
      'Life expectancy': '13–15 years',
      'Coat': 'Fleece or wool; consistently low-shedding',
      'Colors': 'Chalk, cream, caramel, apricot, red, chocolate, black, parti',
      'AKC recognized': 'No — developed by Australian breed associations, not the AKC',
      'Origin': '1980s Australia; multi-generational lines stabilized at Tegan Park & Rutland Manor',
    },
    lede: `Of all the doodles, the Australian Labradoodle is the one that arrives with paperwork. Where a first-generation Labradoodle is a Labrador and a Poodle introduced last Tuesday, the Australian Labradoodle is the product of decades of deliberate multi-generational breeding — with a few discreet infusions of Spaniel along the way — toward a single goal: a genuinely consistent, allergy-friendly coat. It is the doodle that took the coin-flip out of the equation and replaced it with a spreadsheet.`,
    spotlightHeading: 'Why we love the Australian Labradoodle on stage',
    spotlight: `<p>On stage, the Australian Labradoodle is the doodle that behaves as advertised. Where the first-generation doodles are a genetic lottery — this one sheds, that one does not, this one is a rocket, that one is a cushion — the Australian comes pre-sorted. They tend to be calmer than a standard Labradoodle, softer in the face, and possessed of a fleece coat that catches the studio lights like something out of a shampoo commercial.</p>
<p>The temperament is the other half of the appeal. These lines were built in part for therapy and assistance work, and it shows: the Australian Labradoodle reads a room. Put one on stage and it will frequently fix its gaze on the single quietest viewer in the chat, as though it has decided that person needs the most help and it intends to provide it.</p>
<p>Bone counts come in steady and warm. Nobody is startled by an Australian Labradoodle. Everybody is reassured by one. That, on balance, is the better business to be in.</p>`,
    ownerFitHeading: 'Is an Australian Labradoodle right for you?',
    ownerFit: `<p>This is, for most allergy households, the most reliable doodle on the list. It is also the most expensive, and the reasons are connected.</p>
<p><strong>Shedding.</strong> Genuinely low, and — unlike the F1 doodles — genuinely consistent, because the coat has been bred toward over many generations. If your allergy is the serious kind that ruled out a Goldendoodle, this is the cross to look at first. No guarantee is absolute, but the odds are far better here.</p>
<p><strong>Energy.</strong> Moderate. A good daily walk and some play. Less drive than a Labrador, more steadiness than a Poodle. They are not couch potatoes, but they are not a sport either.</p>
<p><strong>Trainability.</strong> High. Bred from working assistance lines, they take instruction beautifully and want a job. First-time owners do well with them.</p>
<p><strong>Grooming.</strong> The price of that fleece coat is real upkeep. It mats without regular brushing and needs professional grooming every six to eight weeks. Budget for it before you commit.</p>
<p><strong>Cost and waitlists.</strong> Reputable Australian Labradoodle breeders are few, health-test heavily, and have waitlists. Be suspicious of a cheap one or an instant one — the value of the breed is entirely in the breeding program, and a careless program produces an ordinary Labradoodle at a premium price.</p>
<p><strong>Health.</strong> Hips, elbows, and eyes are the lines to ask about. A good breeder will show you the parents' clearances without being asked.</p>`,
    famousHeading: 'Famous Australian Labradoodles',
    famous: `<p>The Australian Labradoodle does not have a Lassie, but it has a lineage worth knowing. The whole project traces back to the same impulse that created the original Labradoodle — an allergy-friendly assistance dog — and the Australian breeders who took the idea and spent thirty years making it breed true. The breed's fame is institutional rather than cinematic: it lives in therapy wards, reading-support programs, and the laps of people whose allergies had previously closed the door on dog ownership entirely.</p>
<p>You will not see one win an Oscar. You may very well meet one at a hospital, wearing a vest, being quietly excellent at the only job it has ever wanted. If fame is measured in lives quietly improved rather than tickets sold, the Australian Labradoodle is, by that better yardstick, one of the most accomplished dogs on this entire list.</p>`,
    relatedBreeds: [
      { slug: 'labradoodle', name: 'Labradoodle' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'cockapoo', name: 'Cockapoo' },
      { slug: 'cavapoo', name: 'Cavapoo' },
    ],
    breedTagName: 'Australian Labradoodle',
  },

  'teacup-poodle': {
    heroImage: '/breeds-img/teacup-poodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Teacup Poodle',
    headKeyword: 'Teacup Poodle',
    metaDescription: "The Teacup Poodle isn't a breed the kennel clubs recognize — it's a very small Toy Poodle, with all the brilliance and all the fragility that size implies. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Unofficial size variant of the Toy Poodle',
      'Size': 'Typically under 6 lb · under 9 inches at shoulder',
      'Temperament': 'Brilliant, affectionate, alert, sensitive',
      'Life expectancy': '12–16 years',
      'Coat': 'Dense, curly, low-shedding',
      'Colors': 'White, black, apricot, red, silver, cream, parti',
      'AKC recognized': 'No — the AKC recognizes only Standard, Miniature, and Toy Poodles',
      'Health note': 'Very small size brings real fragility — see below',
    },
    lede: `A word on the word teacup before we begin: it is a marketing term, not a kennel-club category. The American Kennel Club recognizes the Poodle in three sizes — Standard, Miniature, and Toy — and the Teacup Poodle is, in plain terms, a Toy Poodle bred to the very bottom of the scale, often under six pounds. What you get is one of the most decorated brains in all of dogdom installed in a body roughly the size of a grapefruit. What you also get, and we will not pretend otherwise, is fragility.`,
    spotlightHeading: 'Why we love the Teacup Poodle on stage',
    spotlight: `<p>The Teacup Poodle is a small triumph of disproportion. The Poodle is, by most rankings, the second-cleverest breed on earth, and a Teacup carries that full intelligence in a frame that barely registers on the scale. The effect on stage is comic and slightly uncanny: an enormous, calculating mind peering out of a creature you could lose in a cushion.</p>
<p>They are exquisite on camera. The curls, the dark intelligent eyes, the precise little movements of a dog that has thought about each one. Where a larger dog lumbers, a Teacup Poodle arranges itself, like a small aristocrat settling into the good chair.</p>
<p>Viewers respond with a particular protective tenderness. The bones come in not as applause but as something closer to care. The Teacup Poodle accepts this as entirely correct.</p>`,
    ownerFitHeading: 'Is a Teacup Poodle right for you?',
    ownerFit: `<p>We are going to be honest about this one, because the marketing rarely is.</p>
<p><strong>Fragility is the headline.</strong> A dog under six pounds is genuinely delicate. A fall from a sofa can break a leg. A bigger dog playing too rough can cause serious injury. They can be stepped on. If your household has young children or large boisterous pets, a Teacup Poodle is the wrong choice — not because of temperament, but because of physics.</p>
<p><strong>Health.</strong> Breeding for extreme smallness concentrates problems: hypoglycemia (dangerous blood-sugar drops, especially in puppies), luxating patellas, dental crowding, collapsing trachea, and fragile bones. Buy only from a breeder who is candid about all of this and breeds for health rather than for the smallest possible number. Walk away from anyone selling "micro" anything.</p>
<p><strong>Intelligence needs work.</strong> That brilliant brain gets bored. A Teacup Poodle wants training, puzzles, and attention. Neglected, it can become anxious and yappy. Engaged, it is one of the most rewarding companions going.</p>
<p><strong>Grooming.</strong> Low-shedding, high-maintenance. The curly coat needs regular brushing and professional grooming. The upside is genuinely allergy-friendly.</p>
<p><strong>The honest verdict:</strong> a wonderful companion for a calm adult household with the time to engage that mind and the care to protect that body. A poor and even risky fit for a busy, rough-and-tumble home.</p>`,
    famousHeading: 'Famous Teacup Poodles',
    famous: `<p>Poodles writ large have one of the grandest résumés in dogdom — performing in European courts and circuses, clipped into topiary by the French, and ranked at the very top of canine intelligence studies for a century. The Teacup, specifically, is a more modern and more complicated celebrity: it is the dog of the handbag, the lapdog of the social-media age, the breed that periodically goes viral for being almost impossibly small.</p>
<p>We would gently note that the viral appeal and the welfare concern are the same fact viewed from two angles. The smaller the dog, the more striking the photograph and the more fragile the animal. Admire them. Then, if you bring one home, buy from someone who breeds for the dog's sake and not the photograph's. The dogs themselves are oblivious to the debate; they simply want a warm lap and a problem to solve, ideally in that order, and they will repay both with a devotion out of all proportion to their tiny size.</p>`,
    relatedBreeds: [
      { slug: 'maltipoo', name: 'Maltipoo' },
      { slug: 'cavapoo', name: 'Cavapoo' },
      { slug: 'poodle', name: 'Poodle' },
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'shih-tzu', name: 'Shih Tzu' },
    ],
    breedTagName: 'Teacup Poodle',
  },

  'mini-dachshund': {
    heroImage: '/breeds-img/mini-dachshund.jpg',
    heroCredit: 'AI-generated image',
    name: 'Mini Dachshund',
    headKeyword: 'Mini Dachshund',
    metaDescription: "The Miniature Dachshund: a full-sized hunting dog's courage compressed into eleven pounds of low-slung determination. A field guide, with stage notes — and a serious word about backs.",
    facts: {
      'Group': 'Hound (miniature variety of the Dachshund)',
      'Size': 'Under 11 lb · 5–6 inches at shoulder',
      'Temperament': 'Clever, bold, stubborn, devoted, vocal',
      'Life expectancy': '12–16 years',
      'Coat': 'Three types — smooth, longhaired, wirehaired',
      'Colors': 'Red, black & tan, cream, chocolate, dapple, piebald',
      'AKC recognized': 'Yes — as the Miniature variety of the Dachshund',
      'Health note': 'IVDD (back disease) is the breed-defining risk — see below',
    },
    lede: `Engineered in Germany to follow a badger down its own hole and argue with it, the Dachshund is a hunting dog that happens to be shaped like a draught excluder. The Miniature is the same animal at eleven pounds or under — same courage, same stubbornness, same operatic bark, all compressed into a body that is mostly length. They were bred for a job that required tremendous nerve in a very small package, and nobody has yet told them the job is over.`,
    spotlightHeading: 'Why we love the Mini Dachshund on stage',
    spotlight: `<p>The Mini Dachshund is a gift to a horizontal medium. That silhouette — the long body, the short legs, the earnest face arriving a full half-second before the back half catches up — is comedy that requires no setup. They come in three coats, too: the sleek smooth, the elegant longhaired, and the gruff little wirehaired, who looks permanently like a retired sea captain.</p>
<p>What surprises new viewers is the confidence. There is no timidity in a Dachshund. They strut on with the bearing of a dog four times the size, fix the camera with a hunting hound's intensity, and bark at it if it does the wrong thing. The body is small. The opinion of itself is enormous.</p>
<p>Viewers adore them precisely for this mismatch. A Mini Dachshund convinced it is a wolfhound is one of the most reliable sources of joy we host.</p>`,
    ownerFitHeading: 'Is a Mini Dachshund right for you?',
    ownerFit: `<p>Charming, characterful, and carrying one serious caveat that every prospective owner must understand before anything else.</p>
<p><strong>The back.</strong> That long spine is the breed's defining vulnerability. Intervertebral disc disease (IVDD) is common in Dachshunds, and a single bad jump off the sofa can cause a spinal injury. The whole household has to adapt: ramps instead of jumps, no stairs where avoidable, careful lifting (support the chest and rear, never dangle), and strict weight control, because every extra ounce loads that spine. This is not optional fussing. It is the single most important thing about owning the breed.</p>
<p><strong>Stubbornness.</strong> Dachshunds are smart and entirely self-directed. Housetraining is famously slow. They will learn a command and then visibly decide whether complying is in their interest. Patient, consistent, reward-based training works; bullying does not.</p>
<p><strong>Energy.</strong> Higher than the shape suggests. They were bred to hunt all day, and they want to dig, sniff, and patrol. A bored Dachshund excavates.</p>
<p><strong>Voice.</strong> They bark. They are alert little watchdogs with a bark startlingly large for the body. Apartment neighbors should be warned.</p>
<p><strong>The verdict:</strong> a hilarious, devoted companion for an owner who will protect that back religiously and find the stubbornness endearing rather than maddening.</p>`,
    famousHeading: 'Famous Mini Dachshunds',
    famous: `<p>The Dachshund punches well above its weight in the art world. Pablo Picasso's dachshund Lump more or less moved into his house and appeared, recognizably, in a whole sequence of his works — there is a well-known book devoted entirely to Picasso and Lump. Andy Warhol owned dachshunds and took them everywhere. David Hockney has painted his own dachshunds with the same attention he gives California swimming pools.</p>
<p>Add to that the entire cultural institution of the "wiener dog" — the costumes, the races, the memes — and the Dachshund may be, pound for pound, the most artistically and comedically documented dog alive. Not bad for an animal built to annoy badgers.</p>
<p>The cultural reach runs further still. That long, low silhouette has sold cars, sausages, and software precisely because it is impossible to mistake for anything else, which makes the Dachshund one of the most caricatured dogs alive. Fame, for a Dachshund, was only ever a matter of standing sideways — and the Miniature carries the whole inheritance in a body half the size.</p>`,
    relatedBreeds: [
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'dachshund', name: 'Dachshund' },
      { slug: 'corgi', name: 'Corgi' },
    ],
    breedTagName: 'Mini Dachshund',
  },

  'german-shepherd': {
    heroImage: '/breeds-img/german-shepherd.jpg',
    heroCredit: 'AI-generated image',
    name: 'German Shepherd',
    headKeyword: 'German Shepherd',
    metaDescription: "The German Shepherd: the dog the world reaches for when the job is serious. Brilliant, loyal, and emphatically not a beginner's breed. A field guide, with stage notes.",
    facts: {
      'Group': 'Herding',
      'Size': 'Males 65–90 lb · Females 50–70 lb · 22–26 inches',
      'Temperament': 'Confident, courageous, loyal, highly trainable, watchful',
      'Life expectancy': '9–13 years',
      'Coat': 'Dense double coat; sheds heavily year-round',
      'Colors': 'Black & tan, sable, solid black, bicolor',
      'AKC recognized': 'Yes — recognized 1908',
      'Origin': 'Germany, 1899; standardized by Max von Stephanitz',
    },
    lede: `There is a reason that when a script calls for a dog to look intelligent, the casting call goes out for a German Shepherd. No breed has done more varied work — herding, policing, soldiering, guiding the blind, finding the lost beneath rubble — and none wears competence quite so visibly. The German Shepherd is the canine equivalent of the colleague who is annoyingly good at everything and, worse, knows it. Give one a job and a person to do it for, and you have, more or less, the most capable animal in domestic life.`,
    spotlightHeading: 'Why we love the German Shepherd on stage',
    spotlight: `<p>The German Shepherd does not so much appear on stage as report for duty. There is a noble, slightly serious quality to the breed — the upright ears, the steady gaze, the sense that it is already assessing the situation and forming a plan. They are magnificent to look at and, unlike many of our guests, they appear to understand that they are being looked at.</p>
<p>What you rarely catch a German Shepherd doing is fully relaxing. Even mid-charm, one ear will swivel toward an off-camera sound, the head holding its position while the radar sweeps. They are watchful by deepest instinct, and on a live broadcast full of strangers, that watchfulness reads as a kind of quiet gravity.</p>
<p>Viewers respond with respect rather than squeals. The bones come in like a salute. The German Shepherd receives them as no more than its due, and goes back to scanning the perimeter.</p>`,
    ownerFitHeading: 'Is a German Shepherd right for you?',
    ownerFit: `<p>This is one of the great dogs of the world, and it is not a dog for everyone. Be honest with yourself before you fall for the photograph.</p>
<p><strong>This is not a beginner's breed.</strong> A German Shepherd needs a confident, consistent owner who can provide structure. In capable hands they are sublime. In uncertain hands, a large, intelligent, protective dog without clear leadership becomes anxious, reactive, and a genuine problem.</p>
<p><strong>Work, not just walks.</strong> Their needs are physical and mental. A bored German Shepherd is a destructive one — they need real exercise plus a job: training, scent work, a sport, something to think about. "A walk round the block" does not touch the sides.</p>
<p><strong>Shedding.</strong> They are affectionately nicknamed German Shedders. The double coat sheds constantly and blows out dramatically twice a year. A lint roller becomes a lifestyle.</p>
<p><strong>Socialization.</strong> Early, broad, ongoing. The protective instinct is a feature that must be channeled, never encouraged into suspicion.</p>
<p><strong>Health.</strong> Hip and elbow dysplasia are the breed's notorious concerns; degenerative myelopathy and bloat also appear. Choose a breeder who health-tests, and steer away from the extreme sloped-back show lines — a level back is a sounder dog.</p>
<p><strong>The verdict:</strong> for the committed, active, experienced owner, the finest working partner alive. For the casual owner who wanted a handsome family pet, simply too much dog.</p>`,
    famousHeading: 'Famous German Shepherds',
    famous: `<p>The German Shepherd is arguably the most famous breed in the history of film. Rin Tin Tin, a puppy pulled from a bombed-out kennel in France during the First World War, became one of the biggest movie stars of the silent era — credited, only half in jest, with keeping Warner Bros. solvent in its early years. His near-contemporary Strongheart was a star in his own right.</p>
<p>Off screen the record is just as long. Buddy, a German Shepherd, was the first guide dog in America, partnered with Morris Frank in the 1920s and the reason guide-dog programs exist in the English-speaking world at all. Add a century of police and military service dogs, and search-and-rescue work at every modern disaster, and the German Shepherd's fame turns out to be the least interesting thing about it.</p>`,
    relatedBreeds: [
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'dalmatian', name: 'Dalmatian' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'vizsla', name: 'Vizsla' },
    ],
    breedTagName: 'German Shepherd',
  },

  'golden-mountain-dog': {
    heroImage: '/breeds-img/golden-mountain-dog.jpg',
    heroCredit: 'AI-generated image',
    name: 'Golden Mountain Dog',
    headKeyword: 'Golden Mountain Dog',
    metaDescription: "The Golden Mountain Dog: a Golden Retriever crossed with a Bernese Mountain Dog, which is to say a great deal of warmth in a very large coat. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Golden Retriever × Bernese Mountain Dog)',
      'Size': '75–120 lb · 24–28 inches at shoulder',
      'Temperament': 'Gentle, affectionate, calm, devoted to family',
      'Life expectancy': '9–12 years',
      'Coat': 'Long, dense double coat; sheds substantially',
      'Colors': 'Golden, black, brown & white, tri-color (Bernese-influenced)',
      'AKC recognized': 'No — designer mix',
      'Climate': 'Cool to temperate; the coat struggles in heat',
    },
    lede: `Cross the two friendliest large dogs the Northern Hemisphere has to offer — the Golden Retriever and the Bernese Mountain Dog — and the result is almost suspiciously nice. The Golden Mountain Dog is a great, warm, shedding monument of an animal, built along Bernese lines but often carrying the Golden's lighter coat and lighter heart. It has no edge to it whatsoever. If you are shopping for a guard dog, look elsewhere: this one would show a burglar where the good silver is kept and then lean on him hopefully until petted.`,
    spotlightHeading: 'Why we love the Golden Mountain Dog on stage',
    spotlight: `<p>The Golden Mountain Dog arrives like a piece of well-upholstered furniture that has decided to join the party. They are large, they are slow, and they are entirely, beamingly content to be looked at. Many carry the Bernese tri-color markings softened by the Golden's warmth; others come through closer to a big shaggy Golden. Either way, the camera loves the size and the softness in equal measure.</p>
<p>What sells them is the gentleness. There is not a fast or anxious bone in the breed. They settle into the frame, lean toward whoever is nearest, and radiate a calm that travels surprisingly well through a screen. After a run of high-energy herding dogs, a Golden Mountain Dog is the broadcast equivalent of a deep breath.</p>
<p>Viewers give them the cathedral treatment — the same lavish bone counts the big gentle Saint Berdoodles draw. Large, kind dogs do very well here. The audience knows a good soul when it sees one.</p>`,
    ownerFitHeading: 'Is a Golden Mountain Dog right for you?',
    ownerFit: `<p>A wonderful family dog, with two honest caveats: the space it needs and the time you get to keep it.</p>
<p><strong>Size and space.</strong> At 75 to 120 pounds, this is a genuinely large dog. It needs room, eats accordingly, and when it shakes off water the water travels. A small flat is not a fair home for one.</p>
<p><strong>The lifespan.</strong> This is the hard part. The Bernese parent is one of the shorter-lived breeds, and large dogs in general do not get the long innings smaller ones do. Nine to twelve years is the realistic range. You are signing up for an intense, generous companionship that ends sooner than you will want. Go in clear-eyed.</p>
<p><strong>Energy.</strong> Lower than the Golden side alone would suggest. A couple of good walks and some yard time suit them. They are companions, not athletes, and they would rather be near you than running ahead of you.</p>
<p><strong>Coat and climate.</strong> Heavy shedding and a real grooming commitment. The thick double coat also means they suffer in heat — a Golden Mountain Dog belongs in a cool or temperate climate, not a hot one.</p>
<p><strong>Health.</strong> Large-breed concerns dominate: hip and elbow dysplasia and bloat, and — inherited from the Bernese side — an elevated cancer risk worth discussing frankly with any breeder. Choose one who screens both parents.</p>`,
    famousHeading: 'Famous Golden Mountain Dogs',
    famous: `<p>The Golden Mountain Dog is too new and too rare to have produced a celebrity of its own. Its fame, for now, is borrowed: the Golden Retriever is one of the most beloved breeds in cinema and advertising, and the Bernese Mountain Dog is the gentle giant of a thousand alpine postcards. The cross inherits the goodwill of both without yet having earned its own headline.</p>
<p>Where you do find them is in the rising wave of "gentle giant" designer dogs — the big, soft, family-first crossbreeds that have become aspirational on social media for households with the space and the heart for a great deal of dog. Give the breed a decade. A Golden Mountain Dog will eventually amble through a family film and steal it simply by being enormous and kind.</p>`,
    relatedBreeds: [
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'bernese-mountain-dog', name: 'Bernese Mountain Dog' },
      { slug: 'golden-retriever', name: 'Golden Retriever' },
    ],
    breedTagName: 'Golden Mountain Dog',
  },

  'toy-aussie': {
    heroImage: '/breeds-img/toy-aussie.jpg',
    heroCredit: 'AI-generated image',
    name: 'Toy Aussie',
    headKeyword: 'Toy Aussie',
    metaDescription: "The Toy Aussie: the Australian Shepherd's herding brain and boundless drive, downsized to twelve pounds. Adorable, exhausting, and not a lap dog. A field guide, with stage notes.",
    facts: {
      'Group': 'Herding (toy-sized variant of the Australian Shepherd)',
      'Size': '12–17 lb · 10–14 inches at shoulder',
      'Temperament': 'Brilliant, intense, high-drive, devoted, alert',
      'Life expectancy': '12–15 years',
      'Coat': 'Medium double coat; sheds seasonally',
      'Colors': 'Blue merle, red merle, black tri, red tri',
      'AKC recognized': 'No — the Miniature is (as the Miniature American Shepherd); the Toy is not separately recognized',
      'Also called': 'Toy Australian Shepherd',
    },
    lede: `Take the Mini Aussie — itself already a downsized Australian Shepherd — and shrink it once more, to twelve pounds of merle-coated intensity, and you have the Toy Aussie. The marketing whispers "lap dog." The dog disagrees, firmly. Inside this small and photogenic body lives the full, undiluted herding intelligence of a working stockdog, and it would like, very much, a task. Several tasks. Ideally a flock. In the absence of sheep it will settle for organizing your other pets, your children, and the vacuum cleaner.`,
    spotlightHeading: 'Why we love the Toy Aussie on stage',
    spotlight: `<p>The Toy Aussie may be the most striking small dog we host, and certainly among the least cooperative. The merle coat — silver-grey or rust marbled with darker patches — is extraordinary at any size, but compressed into a twelve-pound frame it becomes almost jewel-like. Add the pale, sometimes mismatched eyes (one blue, one brown, occasionally a single eye split between the two) and you have a face that stops the chat cold the first time it appears.</p>
<p>The trouble, charmingly, is keeping it in frame. Working dogs do not pose for screens, and a Toy Aussie on stage tends to deliver about three perfect seconds of portrait before pivoting sharply to herd something only it can see. The result is part glamour shot, part blooper reel, and viewers love both halves.</p>
<p>Bones spike on the first merle reveal and keep coming. It is a face that refuses to become familiar.</p>`,
    ownerFitHeading: 'Is a Toy Aussie right for you?',
    ownerFit: `<p>The single most important thing to understand: a Toy Aussie is a high-drive working dog that happens to be small. The body shrank. The needs did not.</p>
<p><strong>Energy.</strong> Disproportionate to the size and relentless. This is not a "walk a day" dog — it is a "real exercise plus daily mental work" dog. A Toy Aussie understimulated in a flat will invent its own job within a fortnight, and you will not enjoy the job it picks.</p>
<p><strong>Trainability.</strong> Genius-level. Toy and Mini Aussies dominate small-dog agility out of all proportion to their numbers. They learn tricks faster than most owners can invent them — and they learn the things you did not mean to teach, too.</p>
<p><strong>Herding instinct.</strong> The bit nobody mentions at the puppy stage: they herd. Children running in the yard, other dogs at the park, bikes, the family cat — all get rounded up, sometimes with a nip at the heels. It is instinct, not aggression, but it is rarely what a family picturing a small fluffy lapdog had in mind.</p>
<p><strong>Coat.</strong> A medium double coat that sheds, with a seasonal blow-out. Weekly brushing minimum.</p>
<p><strong>Size caveat.</strong> At the very small end they are delicate; mind the joints and the jumping, as with any toy breed.</p>
<p><strong>The verdict:</strong> brilliant for an active owner who wants a portable working dog and will give it a real outlet. A genuine mismatch as a decorative companion — for that, look hard at the doodle side of this list instead.</p>`,
    famousHeading: 'Famous Toy Aussies',
    famous: `<p>The Toy Aussie's natural stage is the agility ring, not the cinema. The breed and its slightly larger Mini sibling routinely clean up in small-dog jumpers competitions, and a good deal of the breed's reputation has been built handler by handler at weekend trials rather than on any screen.</p>
<p>Culturally, the Toy Aussie has found its real home in the outdoorsy young-adult corner of social media — the trailhead photograph, the dog in the tent, the small merle face peering out of a camper van. If you have scrolled past a tiny, impossibly photogenic merle dog mid-adventure recently, the odds are good it was a Toy or Mini Aussie, and that its owner is more tired than the caption admits.</p>`,
    relatedBreeds: [
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'aussiedoodle', name: 'Aussiedoodle' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'australian-shepherd', name: 'Australian Shepherd' },
    ],
    breedTagName: 'Toy Aussie',
  },

  'french-bulldog': {
    heroImage: '/breeds-img/french-bulldog.jpg',
    heroCredit: 'AI-generated image',
    name: 'French Bulldog',
    headKeyword: 'French Bulldog',
    metaDescription: "The French Bulldog: the most popular dog in America, and a charismatic little gargoyle with serious health caveats every owner should know. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Non-Sporting',
      'Size': 'Under 28 lb · 11–13 inches at shoulder',
      'Temperament': 'Playful, affectionate, alert, adaptable, comic',
      'Life expectancy': '10–14 years',
      'Coat': 'Short, smooth; modest shedding',
      'Colors': 'Brindle, fawn, cream, white, pied',
      'AKC recognized': 'Yes — recognized 1898',
      'Health note': 'Brachycephalic (flat-faced) — breathing, heat, and swimming risks',
    },
    lede: `The most popular dog in America is a snoring, occasionally flatulent, profoundly charismatic little gargoyle. In the space of two decades the French Bulldog has climbed from niche curiosity to the single most-registered breed in the United States — on the strength of a face, a personality, and a body that fits a city apartment. They are clowns with bat ears and a gift for comic timing. They are also, and any honest guide must say this plainly, a breed with real health considerations built into that very face.`,
    spotlightHeading: 'Why we love the French Bulldog on stage',
    spotlight: `<p>The French Bulldog is a born broadcaster. Those enormous upright ears, that flat expressive face, the repertoire of head-tilts and snorts and slow blinks — it is a dog that seems to perform without being asked. And because their energy runs low, they hold a frame beautifully, where a livelier breed would have bolted off-camera in pursuit of a noise.</p>
<p>They are also masters of the reaction shot. Say something to a Frenchie on stage and you will get a tilt, a pause, a small grumble of apparent commentary. None of it means anything, and all of it is hilarious, and the chat reliably loses its composure.</p>
<p>Bone counts run high — French Bulldogs over-index here much as the doodles do. It is the face, and the comedy, and the sense that this small creature is having a wonderful time and would like you to as well.</p>`,
    ownerFitHeading: 'Is a French Bulldog right for you?',
    ownerFit: `<p>Adore them — but adopt one with both eyes open, because the things that make a Frenchie charming are tangled up with the things that make it medically complicated.</p>
<p><strong>Breathing.</strong> French Bulldogs are brachycephalic — the flat face that sells the breed also shortens the airway. Snoring is universal; snorting is constant; and many struggle to breathe efficiently, especially when excited or exerted. Some need corrective surgery. Buy from a breeder selecting for a slightly longer muzzle and open nostrils, not the most extreme flat face.</p>
<p><strong>Heat.</strong> This is life-or-death, not fussiness. A Frenchie cannot cool itself well and can overheat fatally. Never leave one in a warm car or in the sun, and keep exercise gentle and short in hot weather.</p>
<p><strong>They cannot swim.</strong> The dense, front-heavy body sinks. A French Bulldog near an unfenced pool is in real danger. Treat water with caution and never assume they will manage.</p>
<p><strong>Energy.</strong> Low, and that is part of the appeal — short walks and plenty of sofa. They tire quickly, which suits apartment life.</p>
<p><strong>Health and cost.</strong> Beyond the airway: spinal issues, skin-fold care, eye problems, and frequent need for C-sections to whelp. The breed's popularity has unleashed a tide of careless breeding and puppy mills, so a responsible, health-testing breeder matters more here than almost anywhere.</p>
<p><strong>The verdict:</strong> a wonderful, funny, affectionate apartment companion — for an owner who has read the health profile honestly and sourced the dog responsibly.</p>`,
    famousHeading: 'Famous French Bulldogs',
    famous: `<p>The French Bulldog is everywhere fame is. The breed has become the default celebrity dog of the era — Lady Gaga's Frenchies, Koji and Gustav, made global news in 2021 when they were stolen at gunpoint and later recovered, an episode that said as much about the breed's status and price as about the dogs themselves. The Rock, Reese Witherspoon, and a long roster of others have all kept them; social-media Frenchies like Manny pull followings that dwarf most human influencers.</p>
<p>The origins are humbler and rather charming: small bulldogs kept by Nottingham lace-workers crossed the Channel during the Industrial Revolution, became fashionable in Paris among artists and society alike, and acquired the "French" name there. From lace-makers' companion to America's number-one dog in a little over a century is not a bad run.</p>`,
    relatedBreeds: [
      { slug: 'dalmatian', name: 'Dalmatian' },
      { slug: 'cavapoo', name: 'Cavapoo' },
      { slug: 'mini-dachshund', name: 'Mini Dachshund' },
      { slug: 'bulldog', name: 'Bulldog' },
      { slug: 'mini-french-bulldog', name: 'Mini French Bulldog' },
      { slug: 'american-bully', name: 'American Bully' },
    ],
    breedTagName: 'French Bulldog',
  },

  'mini-french-bulldog': {
    name: 'Mini French Bulldog',
    headKeyword: 'Mini French Bulldog',
    metaDescription: "The Mini French Bulldog: an unofficial, unregulated size variant of America's most popular breed — charming, and worth understanding fully before you commit. A field guide, with stage notes.",
    facts: {
      'Group': 'Non-Sporting (unofficial size variant of the French Bulldog)',
      'Size': 'No industry standard — commonly marketed 15–25 lb, with more extreme "micro"/"teacup" lines claimed as low as 5–14 lb',
      'Temperament': 'Playful, affectionate, alert, comic — same personality as the standard Frenchie',
      'Coat': 'Short, smooth — identical to the standard French Bulldog',
      'Colors': 'Brindle, fawn, cream, white, pied — same palette as standard',
      'AKC recognized': 'No — the AKC recognizes only the standard-sized French Bulldog',
      'Bred by': 'Pairing undersized Frenchies, or crossing in other small breeds (Pug, Chihuahua, Toy Poodle) to shrink the line further',
      'Health note': 'Standard Frenchie brachycephalic risk, compounded by extreme small size — see below',
    },
    lede: `There is no such thing, officially, as a Mini French Bulldog. No kennel club recognizes the term, no breed standard defines it, and ask five breeders what "mini" means and you will get five different numbers on the scale. What you will get, reliably, is a French Bulldog — bat ears, flat face, and all — bred down toward the smaller end of an already small breed, sometimes by pairing undersized Frenchies together and sometimes, more controversially, by introducing other tiny breeds to shrink the line further. The charm is real. So, we need to say plainly, is the risk.`,
    spotlightHeading: 'Why we love the Mini French Bulldog on stage',
    spotlight: `<p>On stage, a Mini French Bulldog reads at first glance as a regular Frenchie shot through the wrong end of a telescope — same upright bat ears, same flat comic face, same gift for the perfectly timed head-tilt, just noticeably less of it. Viewers do a visible double-take the first time one trots out, checking the frame for scale before the chat fills with variations on "wait, how small is that."</p>
<p>What survives the size reduction, entirely intact, is the personality. A Mini French Bulldog performs exactly like its standard-sized cousin: low-key, deadpan, utterly unbothered by an audience of strangers, content to sit and hold an expression that reads as commentary on the proceedings. It does not need coaxing. It arrives already convinced the room finds it funny, and the room generally agrees.</p>
<p>Bone counts run warm rather than explosive — closer to the Teacup Poodle's protective tenderness than the Pomsky's startled-delight spike. Viewers send bones the way you'd tip extra for a particularly good waiter: pleased, a little charmed, and quietly concerned for its wellbeing.</p>`,
    ownerFitHeading: 'Is a Mini French Bulldog right for you?',
    ownerFit: `<p>We are going to lead with the caution here, because the marketing around "mini" and "teacup" Frenchies rarely does.</p>
<p><strong>Breathing, twice over.</strong> A standard French Bulldog is already brachycephalic — the flat face that makes the breed so recognisable also narrows the airway, causing snoring, snorting, and in many dogs genuine difficulty breathing under exertion or heat. Breeding for a smaller overall body does nothing to fix that airway and can make the proportions worse; a Mini French Bulldog inherits the standard breed's breathing risk with less body mass to buffer it.</p>
<p><strong>Size-reduction risks.</strong> There is no accepted, health-screened breeding program producing "mini" Frenchies the way there is for, say, the Miniature Poodle. Extreme small size in a breed not built for it is frequently achieved through dwarfism genetics or by crossing in other small breeds, and both routes carry real costs: fragile, easily-fractured bones, heart defects, and spinal issues layered on top of the hemivertebrae already common in the standard breed — with, in the smallest "teacup" extremes, hypoglycemia and dangerously fragile skulls also reported. Treat any breeder advertising guaranteed "micro" or "teacup" sizing with real skepticism.</p>
<p><strong>No industry standard.</strong> Because "mini" isn't a recognised category, the number on the scale is whatever an individual breeder decides to call it — we've seen the same term applied to a sturdy 20-pound dog and a five-pound one, and only one of those is remotely comparable in risk to a standard Frenchie. No major breed club recognizes a miniature or teacup French Bulldog at all; the French Bull Dog Club of America's own referral standards are built entirely around the conformation breed at its normal size, with no separate category for anything smaller.</p>
<p><strong>Vetting a breeder.</strong> Because there is no club standard to lean on, the burden of proof shifts entirely onto you. Ask directly how the small size was produced — line-breeding from naturally smaller parents is a very different (and far safer) answer than "crossed with a Chihuahua," or a shrug. Ask to see both parents in person if at all possible; a breeder unwilling to show you a dam that looks disproportionately delicate for her own health is telling you something. And budget honestly for what "great risk" tends to mean in practice: a mini Frenchie's veterinary bills, across a lifetime of managing a compressed airway and a compressed skeleton at once, are frequently higher than a standard Frenchie's, not lower, whatever the smaller sticker price on the puppy suggested.</p>
<p><strong>Heat and water.</strong> Identical to the standard breed and, if anything, more urgent at a smaller size: a Mini French Bulldog cannot cool itself efficiently and cannot swim. Never leave one in heat or near unfenced water.</p>
<p><strong>Energy and temperament.</strong> Low-key and affectionate, same as its full-sized relative — short walks, plenty of sofa time, comedy on tap.</p>
<p><strong>The honest verdict:</strong> if the appeal is simply "a smaller Frenchie," look first at a well-bred standard female, who will often run toward the smaller end of the standard's own range with none of the extra risk. If you do go looking for a Mini French Bulldog specifically, find a breeder who is candid about exactly how the size was achieved and what health testing backs it up — and be prepared to walk away from anyone who isn't.</p>`,
    famousHeading: 'Famous Mini French Bulldogs',
    famous: `<p>There is, as far as we can establish, no individually famous Mini French Bulldog — no breakout Instagram star built specifically on the "mini" label the way Manny the Frenchie or Izzy the Frenchie built theirs on the standard breed's enormous social-media following. What exists instead is a fast-growing marketplace of "micro" and "teacup" Frenchie accounts riding the coattails of the parent breed's extraordinary rise: the French Bulldog overtook the Labrador Retriever in 2022 to become America's most popular dog after the Lab's 31-year reign, and that popularity created demand for ever-smaller, ever-more-photogenic versions of an already adored breed.</p>
<p>We'd gently note that the demand arrived faster than any health-testing infrastructure to support it responsibly. The standard French Bulldog earned its fame the honest way — personality plus a face built for the camera. A Mini French Bulldog, if you find a genuinely well-bred one, inherits all of that charm. Make sure the breeder's practices are worth inheriting too.</p>`,
    relatedBreeds: [
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'mini-dachshund', name: 'Mini Dachshund' },
      { slug: 'mini-aussie', name: 'Mini Aussie' },
    ],
    breedTagName: 'Mini French Bulldog',
  },

  cockapoo: {
    heroImage: '/breeds-img/cockapoo.jpg',
    heroCredit: 'AI-generated image',
    name: 'Cockapoo',
    headKeyword: 'Cockapoo',
    metaDescription: "The Cockapoo: the original designer crossbreed, a Cocker Spaniel and Poodle pairing that predates the doodle craze by decades. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Cocker Spaniel × Poodle)',
      'Size': 'Toy under 12 lb · Mini 13–18 lb · Maxi 19–30 lb',
      'Temperament': 'Affectionate, sociable, clever, people-oriented',
      'Life expectancy': '13–16 years',
      'Coat': 'Wavy to curly; low-shedding',
      'Colors': 'Cream, apricot, red, chocolate, black, parti, roan',
      'AKC recognized': 'No — designer mix, one of the oldest',
      'First bred': '1950s–60s, decades before the doodle boom',
    },
    lede: `Before doodle became a suffix you could attach to any breed and sell at a markup, there was the Cockapoo. Crossed deliberately as far back as the 1950s, the Cocker Spaniel and Poodle pairing is the elder statesman of designer dogs — around long enough that several generations of families have quietly owned one without ever once thinking of it as a trend. It is the doodle that got there first and never needed the hype to justify itself.`,
    spotlightHeading: 'Why we love the Cockapoo on stage',
    spotlight: `<p>The Cockapoo is comfort television in dog form. Smaller and softer than the headline-grabbing big doodles, it pairs the Cocker Spaniel's melting warmth with the Poodle's quick wits, and the result on camera is a round, wavy-coated, perpetually delighted little face that asks nothing of the viewer except mutual affection.</p>
<p>They are eager performers in the gentlest sense — they lean toward the camera, they respond to a kind voice, they seem genuinely pleased that all these strangers have turned up. There is no edge, no aloofness, no working-dog agenda. A Cockapoo on stage simply wants everyone to have a nice time.</p>
<p>The bone counts reflect it. Cockapoos do not spike or go viral; they accumulate a steady, fond appreciation from viewers who find them quietly, reliably lovely. They are the breed you would cast as the family dog, because in a great many families that is exactly what they are.</p>`,
    ownerFitHeading: 'Is a Cockapoo right for you?',
    ownerFit: `<p>One of the easiest and friendliest family dogs going — with a single, important emotional caveat.</p>
<p><strong>They need company.</strong> Cockapoos are people-oriented to the core, and the flip side of that devotion is a real susceptibility to separation anxiety. A household that is out for ten hours a day is not a fair home for one. They do best where someone is around for much of the day, or where a routine and gradual training have taught them to cope.</p>
<p><strong>Energy.</strong> Moderate. The Cocker side brings a real need for activity — a good daily walk and some play — without the relentless drive of a working breed. Manageable for most active households.</p>
<p><strong>Coat.</strong> Low-shedding and often allergy-friendly, but it mats without regular brushing, and most need professional grooming every six to eight weeks.</p>
<p><strong>Ears.</strong> Inherited straight from the Cocker: long, floppy, and prone to infection. Build ear-checking and cleaning into the routine; it prevents a great deal of trouble.</p>
<p><strong>Trainability.</strong> High and eager. They want to please and they learn quickly, which makes them forgiving first dogs for committed owners.</p>
<p><strong>Health.</strong> The hybrid mix and a long average lifespan (often 13 to 16 years) are points in their favor; watch for the Cocker's eye conditions and ear issues, and choose a breeder who tests the parents.</p>`,
    famousHeading: 'Famous Cockapoos',
    famous: `<p>Here is the quiet irony of the Cockapoo: it is the original designer dog and the least famous of them. It arrived decades before the Labradoodle and the marketing machine that turned later crosses into status symbols, and so it never acquired a celebrity roster or a viral moment. It simply became, especially across Britain, one of the most popular family dogs in the country — fame by ubiquity rather than by headline.</p>
<p>There is something fitting in that. The Cockapoo was never bred to be a statement. It was bred to be good company, and it has been good company, unshowily, for the better part of seventy years. The newer doodles owe it a debt they rarely acknowledge.</p>
<p>That quiet seniority is, if anything, a point in its favour. Decades of family ownership have stress-tested the cross in a way no marketing campaign ever could, and the verdict from all those living rooms is remarkably consistent: the Cockapoo is easy to love and easy to live with, which is the only review that has ever really mattered.</p>`,
    relatedBreeds: [
      { slug: 'labradoodle', name: 'Labradoodle' },
      { slug: 'cavapoo', name: 'Cavapoo' },
      { slug: 'maltipoo', name: 'Maltipoo' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
    ],
    breedTagName: 'Cockapoo',
  },

  labradoodle: {
    heroImage: '/breeds-img/labradoodle.jpg',
    heroCredit: 'AI-generated image',
    name: 'Labradoodle',
    headKeyword: 'Labradoodle',
    metaDescription: "The Labradoodle: the dog that launched the entire designer-dog era — and whose own creator came to regret it. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Labrador Retriever × Poodle)',
      'Size': 'Mini 15–30 lb · Medium 30–45 lb · Standard 50–65 lb',
      'Temperament': 'Friendly, energetic, sociable, eager to please',
      'Life expectancy': '12–15 years',
      'Coat': 'Wool, fleece, or hair; shed level varies by generation',
      'Colors': 'Cream, gold, apricot, red, chocolate, black, parti',
      'AKC recognized': 'No — designer mix',
      'First bred': '1989, Wally Conron, Royal Guide Dogs Australia',
    },
    lede: `The Labradoodle has a creation myth, and unusually for a dog, it comes with an apology. In 1989 a breeder named Wally Conron, working for Australia's guide-dog program, crossed a Labrador and a Poodle to make an assistance dog for a blind woman whose husband was allergic. It worked. It also, quite by accident, invented an entire industry — and Conron spent his later years saying he had opened a Pandora's box, that for every good Labradoodle there were a great many bred carelessly for profit. The dog itself is innocent of all this. The dog is just delighted to be here.`,
    spotlightHeading: 'Why we love the Labradoodle on stage',
    spotlight: `<p>The Labradoodle brings the Labrador's bounce and the Poodle's flair to the stage, usually at the same time and usually at speed. Where the Australian Labradoodle has been bred toward calm consistency, the standard Labradoodle is a livelier, less predictable creature — and that unpredictability is half the entertainment. You never quite know which dog is going to walk out: the woolly one, the wavy one, the one built like a Lab in a curly wig.</p>
<p>What unites them is high spirits. A Labradoodle on stage is rarely still and never sullen. They bound, they grin, they fling themselves at the moment with the Labrador's bottomless enthusiasm, and viewers feed off the energy.</p>
<p>The bones come in fast on the good days. There is something infectious about a dog this pleased to exist, and the Labradoodle is, more often than not, the most pleased dog in the building.</p>`,
    ownerFitHeading: 'Is a Labradoodle right for you?',
    ownerFit: `<p>A wonderful high-energy family dog — provided you can match the energy and you do your homework on the breeder.</p>
<p><strong>Energy.</strong> High. This is a Labrador crossed with a Poodle, two active breeds, and the result wants real daily exercise plus play. Most love water and swim well. A Labradoodle that does not get enough activity becomes an inventive problem-solver, and the inventions involve your belongings.</p>
<p><strong>The coat lottery.</strong> First-generation Labradoodles (F1) vary — some shed, some do not, and you cannot fully predict which a given puppy will be. F1b crosses (bred back to a Poodle) shed less but cost more. If your allergy is serious, look hard at the more consistent Australian Labradoodle lines instead.</p>
<p><strong>Adolescence.</strong> Expect the familiar doodle arc: delightful and biddable through about eight months, gleefully amnesiac through eighteen, and excellent again thereafter. Hold your nerve.</p>
<p><strong>Trainability.</strong> Excellent — they descend, after all, from assistance-dog stock. Eager, smart, food-motivated.</p>
<p><strong>Choosing a breeder.</strong> Given the breed's own cautionary history, this matters more than usual. Ask for the exact generation, the parents' health clearances (hips, elbows, eyes), and walk away from anyone treating the cross as a quick product rather than a considered pairing.</p>`,
    famousHeading: 'Famous Labradoodles',
    famous: `<p>The most famous thing about the Labradoodle is its origin story and the regret attached to it. Wally Conron, the man who made the first one, became an unlikely public figure late in life by going on record that he wished he hadn't — not because the dogs were bad, but because he had inadvertently kicked off a designer-dog gold rush full of unscrupulous breeders. It is one of the rare breeds whose creator became its most prominent critic, and the story has been told and retold in the press for years.</p>
<p>Beyond that, Labradoodles have served widely as therapy and assistance dogs — the job they were invented for — and turned up in plenty of celebrity households along the way. But the Conron story is the one that sticks, and it carries a useful lesson baked right in: with this breed, the breeder is everything. Heed his warning and you get the friendly, capable dog he set out to make; ignore it and you get the cautionary tale he spent his retirement apologising for. The choice, as ever, is made long before the puppy comes home.</p>`,
    relatedBreeds: [
      { slug: 'labrador-retriever', name: 'Labrador Retriever' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'australian-labradoodle', name: 'Australian Labradoodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'cockapoo', name: 'Cockapoo' },
      { slug: 'chocolate-lab', name: 'Chocolate Lab' },
    ],
    breedTagName: 'Labradoodle',
  },

  'chocolate-lab': {
    name: 'Chocolate Lab',
    headKeyword: 'Chocolate Lab',
    metaDescription: "The Chocolate Lab isn't a separate breed — it's the rarest color a Labrador Retriever can wear, with a genuinely different health story underneath. A field guide, with stage notes.",
    facts: {
      'Group': 'Sporting (color variant of the Labrador Retriever)',
      'Size': 'Males 65–80 lb / 22.5–24.5 in · Females 55–70 lb / 21.5–23.5 in',
      'Temperament': 'Friendly, outgoing, eager to please, food-motivated',
      'Life expectancy': '11–13 years breed-wide; chocolate-specific median ~10.7 years — see below',
      'Coat': 'Short, dense, water-resistant double coat',
      'Colors': 'Solid rich brown ("chocolate") — governed by a recessive gene pair',
      'AKC recognized': 'Yes — as a color of the Labrador Retriever, breed recognized 1917',
      'Genetics': 'Requires two recessive TYRP1 alleles (bb) inherited from both parents',
    },
    lede: `Every Chocolate Lab is, quite literally, a coin that landed on its rarer side twice. Black is dominant in the Labrador Retriever's genetic code; chocolate needs a matching recessive gene from both parents to show at all, which is why chocolate puppies were once the surprise stragglers in a litter of black and yellow siblings. There is no other breed here, no cross, no invented lineage — a Chocolate Lab is a Labrador Retriever in every respect but the one detail that recessive genetics conspired to make rare, then fashionable, then, as we'll get to, a little more complicated than the coat colour alone would suggest.`,
    spotlightHeading: 'Why we love the Chocolate Lab on stage',
    spotlight: `<p>On stage, a Chocolate Lab behaves exactly like every other Labrador we have ever hosted, which is to say: enthusiastically, immediately, and with its whole body. The coat is the only variable. Under studio lighting a good rich chocolate coat reads almost purple-black in shadow and glows warm mahogany when it catches the light directly — genuinely one of the more photogenic colourings in the sporting group, and viewers say so in the chat every single time.</p>
<p>What a Chocolate Lab does not do is behave like a rarer or more delicate animal on account of its unusual colour. It barrels in the same way a black or yellow Lab barrels — tail as rudder, whole rear end following the tail's lead, nose first into whatever smells most promising. Ask it to sit for the camera and you get roughly a second and a half of dignified posture before something more interesting happens off-frame.</p>
<p>Bone counts run consistently high. There is a small, reliable spike in enthusiasm whenever a Chocolate Lab is announced — audiences seem to enjoy the colour precisely because it is the same warm, uncomplicated Labrador soul wearing a slightly less common coat.</p>`,
    ownerFitHeading: 'Is a Chocolate Lab right for you?',
    ownerFit: `<p>Everything true of a Labrador Retriever is true of a Chocolate Lab, with one genuinely important exception worth reading carefully before anything else.</p>
<p><strong>A word on history first.</strong> It is worth knowing that the colour you are choosing was, for most of the breed's early life, actively unwanted. When England's Kennel Club first recognised the Labrador Retriever in 1904, only black and yellow were listed as proper colours — chocolate (then called "liver") was considered an off-colour fault, and puppies born that shade were routinely culled or given away rather than bred from. Because the gene is recessive, it kept quietly resurfacing anyway, carried invisibly by black and yellow dogs, popping up whenever two secret carriers were paired. Chocolate didn't become genuinely fashionable until the 1960s, which means the colour's popularity has had a much shorter run to catch up on than the breed itself, and the modern breeding pool behind it is correspondingly younger and narrower. That history is directly relevant to the next point.</p>
<p><strong>Life expectancy.</strong> A large UK veterinary study (the Royal Veterinary College's VetCompass programme, tracking tens of thousands of Labradors) found chocolate-coloured dogs living a median of 10.7 years — about 1.4 years less than their black and yellow littermates. The likely cause isn't the colour itself but the breeding behind it: because chocolate requires two recessive genes to appear, breeders chasing the colour have historically drawn from a narrower gene pool, and the same research found chocolate Labs carrying meaningfully higher rates of skin and ear infections (23.4% ear-infection prevalence versus 12.8% in black dogs, by one measure). None of this makes a Chocolate Lab a bad choice — it makes "ask the breeder about health testing" a slightly more important question than usual.</p>
<p><strong>Energy.</strong> High, full stop. Labradors were bred to retrieve game from cold water all day, and the drive hasn't faded just because the job has largely disappeared. Budget for a real daily walk plus a fetch session, or budget for a dog that redecorates the sofa cushions out of boredom.</p>
<p><strong>Trainability.</strong> Among the best of any breed. Labradors are food-motivated to a degree that borders on comic, which makes them wonderfully easy to train and, not coincidentally, prone to weight gain if that motivation isn't managed with portion control.</p>
<p><strong>Coat.</strong> Short and low-maintenance to brush, but it sheds — steadily year-round, heavily twice a year. A weekly brush and a good vacuum cleaner handle it.</p>
<p><strong>Health beyond the coat-colour study.</strong> Hip and elbow dysplasia, and a Labrador's famous willingness to eat anything, including things that later require a vet visit to remove. Choose a breeder who screens hips, elbows, and eyes regardless of which colour puppy you're taking home.</p>
<p>If you want the classic Labrador experience — big heart, bigger appetite, unstoppable enthusiasm — in the least common of the breed's three colours, a well-bred Chocolate Lab delivers it completely. Just choose the breeder as carefully as you would for any Labrador, perhaps a shade more so.</p>`,
    famousHeading: 'Famous Chocolate Labs',
    famous: `<p>The Chocolate Lab's most famous representative lived at the most famous address in America. Buddy, adopted by President Bill Clinton in December 1997 and named for a beloved uncle, became one of the most photographed dogs in White House history — trotting across the South Lawn, riding along in the press pool's photographs, occupying more coverage than most sitting senators. Buddy's fame was cut short in January 2002, when he was struck and killed by a car outside the Clintons' home in Chappaqua, New York — a loss that made national news in its own right.</p>
<p>Beyond the political sphere, the Chocolate Lab's fame is mostly the Labrador's fame, borrowed and re-tinted. The breed as a whole held the title of America's most popular dog for 31 consecutive years, from 1991 to 2022, before finally losing the top spot — fittingly for this particular batch of pages — to the French Bulldog. Chocolate ones simply carried a rarer coat through all thirty-one years of that reign: the family favourite, in a slightly less common shade.</p>`,
    relatedBreeds: [
      { slug: 'labrador-retriever', name: 'Labrador Retriever' },
      { slug: 'labradoodle', name: 'Labradoodle' },
      { slug: 'vizsla', name: 'Vizsla' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'french-bulldog', name: 'French Bulldog' },
    ],
    breedTagName: 'Chocolate Lab',
  },

  maltipoo: {
    heroImage: '/breeds-img/maltipoo.jpg',
    heroCredit: 'AI-generated image',
    name: 'Maltipoo',
    headKeyword: 'Maltipoo',
    metaDescription: "The Maltipoo: a Maltese and a Toy Poodle combined into roughly nine pounds of devotion. A field guide for the lap-dog inclined, with stage notes.",
    facts: {
      'Group': 'Designer mix (Maltese × Toy/Miniature Poodle)',
      'Size': '5–20 lb · 8–14 inches at shoulder',
      'Temperament': 'Affectionate, gentle, playful, people-oriented',
      'Life expectancy': '12–16 years',
      'Coat': 'Soft, wavy to curly; low-shedding',
      'Colors': 'White, cream, apricot, silver, occasionally parti',
      'AKC recognized': 'No — designer mix',
      'Bred for': 'Companionship, first and last',
    },
    lede: `The Maltipoo is built almost entirely from affection and approximately nine pounds of curly hair. A Maltese crossed with a small Poodle, it was bred for one purpose and has never aspired to another: to be near you. Not in the yard, not in the next room — on you, ideally, or within paw's reach of the spot you most recently vacated. As lap dogs go, it is among the most single-minded specimens the designer-dog world has yet produced.`,
    spotlightHeading: 'Why we love the Maltipoo on stage',
    spotlight: `<p>The Maltipoo is a small, soft, white (or cream, or apricot) cloud with two enormous dark eyes set into the middle of it, and it photographs like a plush toy that has been granted a wish. On stage, the appeal is immediate and uncomplicated: it is adorable, it knows it is adorable in the way all lapdogs eventually learn, and it would very much like to be picked up.</p>
<p>They hold a frame well, mostly because being held is their preferred state and stillness is no hardship. Where a working breed fidgets toward the exit, a Maltipoo settles in, gazes up, and waits to be adored. It is not a difficult ask of the audience.</p>
<p>The bones come in as coos. The Maltipoo inspires the soft, doting end of the chat — the heart emojis, the "I can't," the people declaring they are not okay. It accepts this devotion as the natural order of things.</p>`,
    ownerFitHeading: 'Is a Maltipoo right for you?',
    ownerFit: `<p>One of the most devoted companions on this list, and the devotion is the thing to plan around.</p>
<p><strong>They cannot be left.</strong> Maltipoos bond hard and suffer real separation anxiety when left alone for long stretches. This is the central fact of ownership: a Maltipoo suits someone who is home much of the day, and is genuinely the wrong dog for a household out at work from morning to night.</p>
<p><strong>Energy.</strong> Low to moderate. Indoor play and a short walk usually cover it. They are companions, not athletes, and they adapt beautifully to apartment life.</p>
<p><strong>Coat.</strong> Low-shedding and often allergy-friendly — but the soft coat needs regular brushing to avoid mats, and the pale fur shows tear stains that need gentle daily wiping around the eyes.</p>
<p><strong>Trainability.</strong> Smart and willing, but small-dog housetraining takes patience and consistency. Crate training and a strict routine help enormously.</p>
<p><strong>Health and fragility.</strong> Small-breed concerns: luxating patellas, dental crowding, and in the tiniest individuals a risk of hypoglycemia. They are also physically delicate — a poor match for homes with very young or boisterous children who might handle them roughly.</p>
<p><strong>The verdict:</strong> ideal for someone home a great deal who wants an utterly devoted small companion; a poor fit for a busy, empty-all-day household.</p>`,
    famousHeading: 'Famous Maltipoos',
    famous: `<p>The Maltese half of the family has serious pedigree: small white companion dogs of this type have been kept by the wealthy for well over two thousand years, lounging in the laps of Roman matrons and Renaissance ladies and turning up in old master paintings as a quiet symbol of comfort and status. The Maltipoo inherits that ancient role and updates it for the present.</p>
<p>Today the breed is a fixture of the celebrity handbag and the lifestyle feed — the small white dog peeking out of a tote, the companion on the private flight. It has no single famous individual so much as a whole genre of fame: the perpetual, photogenic lap dog of people who can have any dog they like and keep choosing this one.</p>
<p>There is a quiet endorsement in that pattern. When people with unlimited options repeatedly select a small, devoted, low-shedding companion, they are telling you precisely what the Maltipoo is for — and it is not ornament so much as company, the oldest and steadiest job a dog has ever held.</p>`,
    relatedBreeds: [
      { slug: 'cavapoo', name: 'Cavapoo' },
      { slug: 'cockapoo', name: 'Cockapoo' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'maltese', name: 'Maltese' },
    ],
    breedTagName: 'Maltipoo',
  },

  cavapoo: {
    heroImage: '/breeds-img/cavapoo.jpg',
    heroCredit: 'AI-generated image',
    name: 'Cavapoo',
    headKeyword: 'Cavapoo',
    metaDescription: "The Cavapoo: a Cavalier King Charles Spaniel crossed with a Poodle, possibly the gentlest small dog going. A field guide, with stage notes.",
    facts: {
      'Group': 'Designer mix (Cavalier King Charles Spaniel × Poodle)',
      'Size': '9–25 lb · 9–14 inches at shoulder',
      'Temperament': 'Gentle, affectionate, sociable, eager to please',
      'Life expectancy': '12–15 years',
      'Coat': 'Wavy to curly; low-shedding',
      'Colors': 'Blenheim (chestnut & white), ruby, gold, tri-color, black',
      'AKC recognized': 'No — designer mix (called the Cavoodle in the UK and Australia)',
      'Popularity': 'Among the most popular family crossbreeds worldwide',
    },
    lede: `Somewhere in the design brief for the Cavapoo, someone wrote the word gentle and underlined it twice. A Cavalier King Charles Spaniel crossed with a Poodle, it inherits the Cavalier's famously soft, biddable nature and the Poodle's brain and low-shedding coat, and the result is a dog that visibly struggles to find a person it does not immediately adore. In Britain and Australia, where it goes by Cavoodle, it has become one of the default family dogs of the era. Spend five minutes with one and the reasons are not mysterious.`,
    spotlightHeading: 'Why we love the Cavapoo on stage',
    spotlight: `<p>The Cavapoo is soft in every register — soft coat, soft eyes, soft temperament — and the camera drinks it in. Many carry the Cavalier's Blenheim colouring, chestnut-and-white in gentle patches, framed by those long spaniel ears that turn every head-tilt into a small event. It is a face built for sympathy, and it deploys it constantly.</p>
<p>On stage they are calm and sweet, neither fizzing with working-dog drive nor demanding to be the centre of attention. They settle, they gaze, they radiate a kind of unhurried contentment. After a stretch of livelier guests, a Cavapoo is the broadcast equivalent of a warm bath.</p>
<p>Viewers respond with quiet, steady affection — the soothing end of the chat. Nobody is whipped into a frenzy by a Cavapoo. Everybody feels a little better for having watched one. The bones come in gentle and constant.</p>`,
    ownerFitHeading: 'Is a Cavapoo right for you?',
    ownerFit: `<p>One of the best companion dogs available — with one health responsibility that you must take seriously before you buy.</p>
<p><strong>Temperament.</strong> Superb. Gentle with children, easy with other pets, eager to please. They are about as soft-natured as small dogs come, and they respond poorly to harsh handling — kindness and consistency get everything out of them.</p>
<p><strong>They are velcro dogs.</strong> Like several breeds on this list, the affection comes with attachment, and Cavapoos can develop separation anxiety if routinely left alone for long days. Best suited to a home with regular company.</p>
<p><strong>Energy.</strong> Moderate. A couple of walks and some play. Adaptable to flats and houses alike.</p>
<p><strong>Coat.</strong> Low-shedding and often allergy-friendly, with regular brushing required; the spaniel ears, like the Cocker's, need routine cleaning to ward off infection.</p>
<p><strong>Health — read this part.</strong> The Cavalier parent carries two serious inherited conditions: mitral valve heart disease and syringomyelia (a painful neurological condition). Crossing with a Poodle can dilute the risk but does not erase it. Buy only from a breeder who heart-tests the Cavalier parent and is open about the lineage. This single question separates a sound Cavapoo from a heartbreaking one.</p>
<p><strong>The verdict:</strong> an exceptional family and companion dog, on the firm condition that you treat the parent health-testing as non-negotiable.</p>`,
    famousHeading: 'Famous Cavapoos',
    famous: `<p>The Cavapoo borrows its glamour from the spaniel side, and the spaniel side is positively regal. The Cavalier King Charles Spaniel is named for King Charles II of England, who was so devoted to his little spaniels that, by long-repeated tradition, he could barely be parted from them and let them roam the palace at will — there is even a persistent legend that he decreed the breed should be allowed into any public building, a claim often repeated and rarely sourced, but too charming to leave out with a caveat attached.</p>
<p>The Cavapoo itself is too modern for individual celebrity, but it has conquered the contemporary equivalent of the royal court: it is one of the most-posted small dogs on social media, especially across the UK and Australia, where the Cavoodle has become shorthand for the gentle, photogenic family dog. From the lap of a Stuart king to the corner of ten thousand modern sofas is a long journey, but the job description has not changed in three and a half centuries: be near your people, and make them feel better for it.</p>`,
    relatedBreeds: [
      { slug: 'maltipoo', name: 'Maltipoo' },
      { slug: 'cockapoo', name: 'Cockapoo' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'cavalier-king-charles-spaniel', name: 'Cavalier King Charles Spaniel' },
    ],
    breedTagName: 'Cavapoo',
  },

  chihuahua: {
    name: 'Chihuahua',
    headKeyword: 'Chihuahua',
    metaDescription: "The Chihuahua: the smallest AKC-recognized dog and one of the longest-living, a tiny body housing a personality twice its size. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Toy',
      'Size': 'Under 6 lb (ideal weight) · 5–8 inches at shoulder',
      'Temperament': 'Alert, graceful, saucy, loyal, attention-seeking, terrier-like',
      'Life expectancy': '14–16 years (some live into their 20s)',
      'Coat': 'Two varieties — smooth and long-coated',
      'Colors': 'Any color or color combination (fawn most common; also black, white, cream, chocolate, tan)',
      'AKC recognized': 'Yes — recognized 1904; 11th most popular of 155 breeds',
      'Origin': 'Ancient pre-Columbian kingdoms; modern breed developed in Mexico, national symbol',
    },
    lede: `The Chihuahua is the sound of ambition in a very small body. Weighing no more than six pounds, small enough to fit in a teacup (hence a whole separate breed category invented around the concept), the Chihuahua carries the personality of a dog four times its size and the conviction that size is irrelevant and, frankly, beside the point. It is a breed that arrived from ancient Mexico and has never once seemed to register that it is supposed to be lap furniture. The Chihuahua knows exactly what it is: the centre of attention, non-negotiable.`,
    spotlight: `<p>On stage, the Chihuahua is a study in confidence writ small. The build is delicate — the long, narrow face, the high-set ears that can swivel independently, the legs that look as though they might snap if someone sneezed in the wrong direction — and yet the whole package carries itself with the bearing of a dog twice the height. A Chihuahua does not trot out; it marches.</p>
<p>The eyes are enormous and very, very focused. A Chihuahua arriving on the show floor seems, within seconds, to have assessed the lighting conditions, catalogued the threats, and determined the optimal position from which to receive the adoration it considers its due. They are not nervous dogs in the way small dogs sometimes are. They are small dogs in the way bulldozers are small vehicles — it is not a size descriptor, it is a misconception.</p>
<p>What viewers find irresistible is the mismatch. A dog this tiny does not get to have this much confidence, and yet here we are. The bones arrive like applause at a small, surprisingly arrogant performance.</p>`,
    ownerFitHeading: 'Is a Chihuahua right for you?',
    ownerFit: `<p>The Chihuahua suits a very particular owner, and it is worth understanding what you are signing up for before you fall for the size.</p>
<p><strong>Fragility first.</strong> These are small dogs, physically delicate in a way that toy breeds in general are and Chihuahuas in particular are. A fall from sofa height can break a leg. Handling must be firm but gentle; a Chihuahua dropped or squeezed roughly can suffer serious injury. If your household includes young children who haven't yet mastered delicate handling, this is the wrong breed.</p>
<p><strong>Temperament and socialization.</strong> The personality is fearless bordering on confrontational, which reads as cute at four pounds but can tip into aggression if the dog isn't socialized early and broadly. Small dogs are often permitted to bark at other dogs, snap at strangers, and generally behave in ways that are overlooked because they are not a physical threat. In a Chihuahua, this matters more than most. They need to learn that other creatures are not invading their territory.</p>
<p><strong>Health.</strong> Collapsing trachea (a narrowing of the airway that causes chronic coughing and can be life-threatening), patellar luxation (knee dislocation), hydrocephalus, and dental crowding are the main concerns. Hypoglycemia can be serious in puppies. Choose a breeder who has health-tested the parents and can speak candidly about the breed's vulnerabilities.</p>
<p><strong>Housetraining.</strong> Notoriously slow. Small-dog owners often give up on perfect reliability — a Chihuahua in your house may never be 100% trustworthy away from a wee-pad. Patience, consistency, and realistic expectations help.</p>
<p><strong>Attention requirements.</strong> These dogs want to be with you, near you, on you. A Chihuahua left alone for ten hours a day is not living its best life. They are companions first, everything else a distant second.</p>
<p><strong>Trainability.</strong> Smart and spirited, but they do have opinions and will voice them. Training works best with small, high-value rewards and a handler with patience and humor.</p>
<p><strong>The honest verdict:</strong> a wonderful companion for a calm, attentive household that appreciates a small dog with a large personality and will take the health and socialization seriously. A poor fit for a busy household, a rough environment, or anyone who wants a decorative handbag ornament — though Chihuahuas have certainly had success at being those things.</p>`,
    famousHeading: 'Famous Chihuahuas',
    famous: `<p>The single most famous Chihuahua in advertising history is Gidget, better known as the Taco Bell Chihuahua. From 1997 to 2000, her catchphrase "¡Yo quiero Taco Bell!" — a small dog demanding fast food in Spanish — became so culturally embedded that it drove half a billion dollars in revenue for the chain and made her a household name. She appeared on talk shows, toured the country, and made a cameo in Legally Blonde 2 before the campaign ended. She lived to 15, dying in 2009, and remains one of the most recognizable brand mascots in advertising history.</p>
<p>Beyond the Taco Bell phenomenon: Paris Hilton's Tinkerbell became a fixture of The Simple Life and early celebrity Instagram culture, forever associated with the handbag-dog era of the 2000s. The Beverly Hills Chihuahua film franchise (2008 onward) rode that wave. Celebrity owners abound — Madonna, Demi Moore, Mickey Rourke, Jamie Lee Curtis, George Lopez — perhaps because the Chihuahua's refusal to act small translates remarkably well to camera work. A dog convinced it is larger than life photographs like one.</p>`,
    relatedBreeds: [
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'maltese', name: 'Maltese' },
      { slug: 'mini-dachshund', name: 'Mini Dachshund' },
      { slug: 'pomeranian', name: 'Pomeranian' },
    ],
    breedTagName: 'Chihuahua',
  },

  'cane-corso': {
    heroImage: '/breeds-img/cane-corso.jpg',
    heroCredit: 'AI-generated image',
    name: 'Cane Corso',
    headKeyword: 'Cane Corso',
    metaDescription: "The Cane Corso: a Roman-descended Italian mastiff — powerful, intelligent, and emphatically not a first dog. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Working',
      'Size': 'Males 99–110 lb · Females 88–99 lb · 23.5–27.5 inches',
      'Temperament': 'Confident, intelligent, protective, aloof with strangers',
      'Life expectancy': '9–12 years',
      'Coat': 'Short, stiff double coat; sheds',
      'Colors': 'Black, gray, fawn, red, brindle',
      'AKC recognized': 'Yes — recognized 2010',
      'Origin': 'Italy; descended from Roman war and guardian dogs',
    },
    lede: `The Cane Corso descends from the war dogs of Rome, and on some level it has never quite filed the paperwork to retire. A powerful Italian mastiff built for guarding property and hunting large game, it carries immense physical presence and a watchful, discerning intelligence — devoted utterly to its own family and reserved to the point of suspicion with everyone else. It is magnificent. It is also, let us be entirely clear before anyone falls in love with a photograph, not a beginner's dog.`,
    spotlightHeading: 'Why we love the Cane Corso on stage',
    spotlight: `<p>The Cane Corso changes the temperature of the room. After the doodles and the lapdogs, a Corso strides on with the slow, deliberate confidence of a dog that has never needed to hurry, and the chat goes briefly quiet. The build is extraordinary — deep chest, heavy muscle, that broad serious head — and the dog wears it without a trace of clowning.</p>
<p>They do not perform, and that is precisely the appeal. Where a spaniel tilts its head for approval, a Corso simply regards the camera, steady and unimpressed, and lets its sheer presence do the work. There is a stillness to a confident guardian breed that reads as gravity on screen.</p>
<p>Viewers respond with awe rather than coos — the bones arrive like a respectful nod. A well-raised Cane Corso is one of the most quietly commanding sights we host.</p>`,
    ownerFitHeading: 'Is a Cane Corso right for you?',
    ownerFit: `<p>This section matters more than most on this site. A Cane Corso in the right hands is a superb companion and guardian. In the wrong hands it is a genuine liability. Be ruthlessly honest with yourself.</p>
<p><strong>Experience is required.</strong> This is a large, powerful, protective breed that needs a calm, confident, experienced owner who can provide consistent leadership and structure. If this would be your first dog, or your first large dog, the Cane Corso is the wrong place to start.</p>
<p><strong>Socialization and training are not optional.</strong> Early, broad, lifelong socialization and steady obedience training are the difference between a stable guardian and a dangerous one. An under-socialized hundred-pound protective dog is a serious problem for everyone around it. Plan for professional training from puppyhood.</p>
<p><strong>The protective instinct must be managed.</strong> A Corso is naturally aloof with strangers and watchful over its family. That instinct is to be channeled and controlled — never encouraged into suspicion or aggression.</p>
<p><strong>Energy and space.</strong> Moderate to high. They need real daily exercise, a job to occupy the mind, and room to live. A bored, cooped-up Corso is a recipe for trouble.</p>
<p><strong>Health.</strong> Large-breed concerns: hip dysplasia, bloat (gastric torsion), and eyelid conditions, alongside the shorter lifespan large dogs tend to get. Choose a breeder who health-tests and breeds for sound temperament above all.</p>
<p><strong>Practicalities.</strong> Check local regulations and insurance — some areas and providers treat large guardian breeds differently. Go in informed.</p>`,
    famousHeading: 'Famous Cane Corsos',
    famous: `<p>The Cane Corso's fame is ancient rather than cinematic. Its ancestors marched with the Roman legions — the broad-built war and guardian dogs the Romans prized — and the breed spent the centuries after Rome's fall as a working farm and estate guardian across southern Italy, hunting boar and minding livestock. The very name is usually traced to Latin roots meaning, roughly, guardian dog.</p>
<p>By the mid-twentieth century the breed had dwindled almost to extinction as rural Italian life changed, and it survived only because a handful of Italian enthusiasts deliberately revived it in the 1970s. It reached American recognition in 2010 and has climbed in popularity since — a rise that brings real responsibility, because a powerful guardian breed becoming fashionable is exactly the situation that demands careful, ethical ownership. The Cane Corso survived the twentieth century on the strength of a handful of people who took it seriously. It deserves owners who will do the same in this one.</p>`,
    relatedBreeds: [
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'dalmatian', name: 'Dalmatian' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'giant-schnauzer', name: 'Giant Schnauzer' },
      { slug: 'american-bully', name: 'American Bully' },
    ],
    breedTagName: 'Cane Corso',
  },

  dalmatian: {
    heroImage: '/breeds-img/dalmatian.jpg',
    heroCredit: 'AI-generated image',
    name: 'Dalmatian',
    headKeyword: 'Dalmatian',
    metaDescription: "The Dalmatian: the spotted firehouse icon of 101 fame, and a high-energy athlete the movie never warned anyone about. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Non-Sporting',
      'Size': '45–70 lb · 19–24 inches at shoulder',
      'Temperament': 'Energetic, dignified, outgoing, loyal, intelligent',
      'Life expectancy': '11–13 years',
      'Coat': 'Short, dense; sheds heavily and constantly',
      'Colors': 'White with black or liver spots (born pure white)',
      'AKC recognized': 'Yes',
      'Health note': 'Congenital deafness affects a notable share of the breed',
    },
    lede: `No dog has been more thoroughly defined by a single film, and few films have been more misleading about their star. The Dalmatian is, in the popular imagination, a gentle spotted family pet who arrives in litters of ninety-nine. The actual Dalmatian is a tireless athletic dog originally bred to run for miles beside horse-drawn carriages — a coaching dog with stamina to burn and a powerful need to use it. The spots are real. The placid-family-pet part was largely invented by Disney.`,
    spotlightHeading: 'Why we love the Dalmatian on stage',
    spotlight: `<p>The Dalmatian is the most instantly recognizable dog we host. Those spots — and every dog's pattern is unique, like a fingerprint, developing over the first weeks of life on a coat that starts pure white — make for an unmistakable silhouette under the studio lights. The build beneath them is elegant and athletic, all clean lines and barely-contained motion.</p>
<p>The "barely contained" is the operative phrase. Dalmatians run high, and keeping one fully still for the camera is an optimistic ambition. What you get is a few seconds of poised, aristocratic portrait — the breed has a genuinely dignified bearing — punctuated by sudden bursts of "what was that, where are we going, can we go there now."</p>
<p>Viewers recognize them on sight and the chat lights up with film references. The bones come in on the strength of pure star power: there are few breeds the audience knows by name as instantly as this one.</p>`,
    ownerFitHeading: 'Is a Dalmatian right for you?',
    ownerFit: `<p>A brilliant dog for the right owner, and one of the most commonly regretted impulse buys for the wrong one — usually someone who fell for the film. Know what you are taking on.</p>
<p><strong>Energy, energy, energy.</strong> This is the headline. Dalmatians were built to run all day beside a carriage, and that engine is still inside the modern dog. They need serious daily exercise — running, not just strolling. An under-exercised Dalmatian becomes destructive and frustrated, and a great many end up in rescue for exactly this reason. Match the energy or choose another breed.</p>
<p><strong>Deafness.</strong> Congenital hearing loss affects a meaningful share of the breed — some dogs are deaf in one ear, some in both. Responsible breeders BAER-test their puppies and will tell you each one's status. A deaf Dalmatian can live a full, happy life with hand-signal training, but it changes the household, and you should know before you commit.</p>
<p><strong>Urinary health.</strong> Dalmatians have a unique quirk of metabolism that predisposes them to urinary stones. It is managed with the right diet and constant access to water, but it is a lifelong consideration, not a one-off.</p>
<p><strong>Shedding.</strong> Relentless. The short, stiff white hairs shed year-round and embed themselves in everything. The saying among owners is that Dalmatians shed 365 days a year. Believe it.</p>
<p><strong>Trainability.</strong> Smart but independent. They respond to consistent, positive training and need it from the start — particularly given the energy.</p>
<p><strong>The verdict:</strong> a magnificent companion for a very active, experienced owner who wants a running partner; a poor and often unhappy match for a sedentary household expecting the movie.</p>`,
    famousHeading: 'Famous Dalmatians',
    famous: `<p>The Dalmatian's fame is almost entirely the story of one book and the films it spawned. Dodie Smith's 1956 novel The Hundred and One Dalmatians, and the Disney animated classic that followed in 1961 (plus the 1996 live-action remake), embedded the breed in popular culture so completely that for most people "Dalmatian" and "101" are nearly the same word. The films were wonderful for the breed's profile and, arguably, terrible for the breed's welfare — each release was followed by a surge of impulse purchases and, soon after, a surge of surrenders by families who had not bargained for the energy.</p>
<p>The other great Dalmatian role is older and truer to the breed: the firehouse dog. Their natural affinity with horses made them the coaching dogs of the horse-drawn fire-engine era — running ahead to clear the way, calming the team, and guarding the equipment. The horses are long gone, but the Dalmatian remains the mascot of fire stations across America, and of more than one famous brewery's hitch team. That role, unlike the spotted-puppy fantasy, the breed actually earned.</p>`,
    relatedBreeds: [
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'pointer', name: 'Pointer' },
    ],
    breedTagName: 'Dalmatian',
  },

  'belgian-malinois': {
    name: 'Belgian Malinois',
    headKeyword: 'Belgian Malinois',
    metaDescription: "The Belgian Malinois: the working dog behind the world's most famous military and police units, and one of the least beginner-friendly breeds alive. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Herding',
      'Size': 'Males 24–26 in, 60–80 lb · Females 22–24 in, 40–60 lb',
      'Temperament': 'Confident, alert, hardworking, extremely high drive, protective',
      'Life expectancy': '12–14 years (sources vary; well-bred working lines are sometimes reported longer)',
      'Coat': 'Short, straight, weather-resistant double coat; sheds year-round with two heavy seasonal blowouts',
      'Colors': 'Rich fawn to mahogany with black overlay, black mask and ears',
      'AKC recognized': 'Yes — 1959, one of four Belgian shepherd varieties',
      'Origin': 'Mechelen ("Malines"), Belgium, 19th century — bred to herd sheep and cattle',
    },
    lede: `Ask most people to name the dog that went into Osama bin Laden's compound with Navy SEAL Team Six, and the guess is almost always German Shepherd. It was Cairo, a Belgian Malinois, kitted out in a body-armor vest with night vision and a radio, and by most accounts he did the hardest, scariest part of the job first. That mix-up says everything about the breed's public profile: quietly doing the world's most demanding security work for decades while a flashier, furrier cousin got the movie roles. The Malinois is smaller, leaner, and — ask any handler — even more relentlessly driven.`,
    spotlight: `<p>A Belgian Malinois arriving on the Dog Show stage does not saunter on so much as report for an assignment it hasn't been briefed on yet. The build is all coiled purpose — square, athletic, ears locked forward — and the eyes are already working the room before the rest of the dog has caught up. Where a lapdog waits to be noticed, a Malinois has already noticed you, catalogued the exits, and formed a provisional opinion.</p>
<p>What makes them riveting to watch is the same trait that makes them formidable on a police perimeter: total, uninterrupted focus. A tossed bone doesn't get a wag and a polite sniff — it gets tracked mid-air with the exact intensity a working Malinois applies to a training decoy. Viewers raised on golden retrievers find this faintly unnerving for about three seconds, and then completely magnetic.</p>
<p>They rarely soften into the frame the way a doodle does. A Malinois on our stage looks, unmistakably, like a dog that would prefer to be given a job. Since we have not yet worked out how to hand a job to a dog through a livestream, it settles for looking extremely capable of one instead. The chat always asks whether it does bite-work. It does. We do not offer bite-work on the Dog Show. Everyone involved considers this the correct call.</p>`,
    ownerFitHeading: 'Is a Belgian Malinois right for you?',
    ownerFit: `<p>Read the temperament column again — confident, alert, extremely high drive — and take it as a warning label, not a compliment. This is, without exaggeration, one of the most demanding breeds most people will ever consider owning.</p>
<p><strong>This is not a first dog.</strong> Belgian Malinois are bred for police, military, and protection work because they are relentless, and relentless does not switch off in a suburban living room. Without a confident, experienced handler providing real structure from puppyhood, that drive turns into destruction, obsessive behavior, or a dog that quietly decides it is in charge.</p>
<p><strong>Exercise is not optional, and a walk does not count.</strong> Plan on one to two hours of genuine physical and mental work daily — running, structured training, a sport like agility or bikejoring, something with a job attached. A bored Malinois is not a quiet Malinois; it is a Malinois redecorating your sofa.</p>
<p><strong>Prey drive.</strong> Bred originally to herd, the breed chases what moves — joggers, cyclists, cats, small dogs, occasionally children on scooters. This is manageable with training and management, not with hope.</p>
<p><strong>The popularity problem.</strong> John Wick and a thousand social-media clips have made the Malinois look like the coolest dog alive, which it may well be, and that fame is currently filling rescues with Malinois whose owners did not do the reading above. Please do the reading above.</p>
<p><strong>Shedding.</strong> A short coat sheds more than the length suggests, with two dramatic seasonal blowouts a year.</p>
<p><strong>Health.</strong> Generally robust and long-lived for a working breed of this size, with hip and elbow dysplasia the main structural concerns — buy from a breeder who health-tests working lines, not one breeding for looks alone.</p>
<p><strong>The verdict:</strong> for an experienced, active owner with a genuine job to give it — sport, work, serious training — the Belgian Malinois is one of the most capable dogs alive. For anyone who just watched a movie, it is a five-alarm mismatch.</p>`,
    famousHeading: 'Famous Belgian Malinois',
    famous: `<p>The breed's single most famous member is Cairo, the Malinois who accompanied Navy SEAL Team Six into Osama bin Laden's compound in 2011 and was, for a while, the only member of the raid whose name was made public. He is far from alone in that line of work — the Belgian Malinois is now the standard-issue dog for the U.S. Secret Service, most Western militaries, and a growing share of police K9 units, largely because its lighter, more compact build suits the parachute jumps and tight quarters that a heavier German Shepherd struggles with.</p>
<p>Not every story ends well, and the breed's working record includes real loss alongside the glory. Diesel, a seven-year-old Belgian Malinois with the French police, was killed in the 2015 Saint-Denis raid that followed the Paris attacks, clearing rooms so human officers didn't have to go first. The hashtag #JeSuisChien trended worldwide in tribute, and Russia's interior minister offered France a puppy in solidarity. It is, in miniature, the whole story of the breed: unglamorous, dangerous work, done without complaint, usually noticed only after the fact.</p>
<p>The breed's more recent fame is cinematic. Halle Berry's assassin character Sofia rode into John Wick: Chapter 3 with a pair of Belgian Malinois, Dazir and Havan, and Berry reportedly spent eight months training the dogs herself before filming — well enough that her trainers joked the dogs thought she was one of them. A Malinois belonging to the character Mr. Nobody returned for John Wick: Chapter 4. In both jobs, real and fictional, the breed did the same thing it has always done: showed up, worked harder than everyone else in the room, and let someone else take the bow.</p>`,
    relatedBreeds: [
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'rottweiler', name: 'Rottweiler' },
      { slug: 'vizsla', name: 'Vizsla' },
    ],
    breedTagName: 'Belgian Malinois',
  },

  maltese: {
    name: 'Maltese',
    headKeyword: 'Maltese',
    metaDescription: "The Maltese: a pure-white companion breed old enough to appear in Aristotle's writing, and confident enough to have never once acted its size. A field guide, with stage notes.",
    facts: {
      'Group': 'Toy',
      'Size': '7–9 in at shoulder · typically 4–7 lb',
      'Temperament': 'Affectionate, gentle, intelligent, fearless, alert',
      'Life expectancy': '12–15 years',
      'Coat': 'Long, silky, straight single coat (no undercoat); floor-length if left ungroomed',
      'Colors': 'Pure white',
      'AKC recognized': 'Yes — 1888',
      'Origin': 'Central Mediterranean/Malta, antiquity — one of Europe\'s oldest toy breeds',
    },
    lede: `Aristotle wrote about small white lapdogs from Malta more than two thousand years ago, which makes the Maltese one of the very few things on this list older than the concept of written law. Since then the breed has needed almost no further editing. Ancient Mediterranean traders, Renaissance nobility, and a small dog too self-possessed to notice its own size all arrived, centuries apart, at the same formula: pure white, silky-coated, fearless out of all proportion to its weight, and constitutionally certain it belongs exactly where you happen to be sitting.`,
    spotlight: `<p>A properly presented Maltese arrives on our stage looking less like a dog and more like a small, opinionated cloud that has decided to attend in person. The coat, when it's been let grow, falls in a straight silken curtain nearly to the floor — no undercoat, no fluff, just a sheet of white hair moving as one under the studio lights, parted neatly down the spine like a tiny debutante.</p>
<p>What surprises first-time viewers is the confidence. A dog weighing well under seven pounds ought, by any sensible logic, to be nervous in front of a glowing screen full of strangers. The Maltese did not receive that memo. It holds its head up, meets the camera dead-on, and carries itself with the settled dignity of a dog that has been someone's favorite for three thousand years running and sees no reason that streak should end tonight.</p>
<p>The bones arrive instantly and in quantity — there is very little audience resistance to a small white dog radiating that much unearned self-assurance. It is, on balance, one of the purest crowd-pleasers we host: no drama, no chaos, just an ancient companion breed doing the one job it has always done extremely well.</p>`,
    ownerFitHeading: 'Is a Maltese right for you?',
    ownerFit: `<p>An excellent companion for the right household, with a short list of real commitments attached — mostly involving hair, teeth, and how much time you actually spend at home.</p>
<p><strong>The coat is a job, not a feature.</strong> That silky sheet mats quickly without regular brushing, and most pet owners keep it in a shorter "puppy cut" rather than attempt the full show-length curtain at home. Budget for a groomer every four to six weeks, or commit properly to learning the routine yourself.</p>
<p><strong>Tear staining.</strong> The white coat shows every mark, and Maltese are prone to reddish-brown tear staining around the eyes. Daily gentle wiping keeps it manageable; ignoring it does not make it go away.</p>
<p><strong>They cannot be left alone all day.</strong> Maltese bond hard to their people and are prone to real separation anxiety. This is a companion breed in the most literal sense — it wants to be in the room, ideally on you — and a household empty from nine to six is a poor match.</p>
<p><strong>Small-dog fragility.</strong> At well under seven pounds, a Maltese can be seriously hurt by a fall, a rough child, or an overly enthusiastic larger dog. Households with very young children should supervise closely.</p>
<p><strong>They talk, and often.</strong> Fearless well past what its size ought to allow, a Maltese will alert-bark at the doorbell, the mail carrier, and any dog three times its weight without a flicker of hesitation. It makes for a surprisingly capable watchdog in a body built for a lap, but apartment neighbors deserve fair warning, and some basic "quiet" training early on saves everyone's ears.</p>
<p><strong>Dental health.</strong> Toy breeds crowd teeth into a small jaw, and dental disease is close to universal without regular brushing and professional cleanings.</p>
<p><strong>Other health notes.</strong> Patellar luxation (a slipping kneecap) is the most common orthopedic issue, and young white-coated dogs are occasionally prone to a treatable tremor condition vets call "white dog shaker syndrome." Neither is a common cause for alarm with a health-screening breeder and attentive care.</p>
<p><strong>The verdict:</strong> a wonderful, adaptable companion for someone home often, prepared for real grooming upkeep, and gentle with a small, delicate dog. A poor fit for a chaotic, dog-piling household or a family expecting a low-maintenance breed.</p>`,
    famousHeading: 'Famous Maltese',
    famous: `<p>Few breeds have kept this much company with royalty for this long. Ancient Greek pottery depicts small Maltese-type dogs, Aristotle wrote about them directly, and for centuries the breed carried the nickname "The Comforter" — kept tucked against an aching stomach or a cold bed on the reasonable theory that a warm, devoted small dog beats most medicine. The lineage nearly didn't survive Europe's Dark Ages; the breed's own historians credit Chinese kennelers with preserving and crossbreeding the line when it was at its most fragile, which makes the modern Maltese a genuinely international rescue story disguised as a lapdog.</p>
<p>By the Renaissance the breed was a fixture of European aristocratic life — painters including Titian featured them, and Mary Queen of Scots is said to have kept one for comfort in her final days. Queen Elizabeth I and Josephine Bonaparte both kept Maltese of their own; the breed has essentially never been out of a palace since antiquity decided to let it in.</p>
<p>The modern celebrity record is just as thorough. Marilyn Monroe received a white Maltese named Mafia Honey as a gift from Frank Sinatra, and the dog stayed by her side through her final years. Hotelier Leona Helmsley left her Maltese, Trouble, a trust fund reported at $12 million — a detail that tells you most of what you need to know about how this breed makes people feel. Eva Longoria's Maltese, Jinxie, walked down the aisle at her wedding to Tony Parker. Three thousand years of royal laps later, the job description has never once changed.</p>`,
    relatedBreeds: [
      { slug: 'maltipoo', name: 'Maltipoo' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'cavapoo', name: 'Cavapoo' },
      { slug: 'shih-tzu', name: 'Shih Tzu' },
      { slug: 'yorkshire-terrier', name: 'Yorkshire Terrier' },
    ],
    breedTagName: 'Maltese',
  },

  'bernese-mountain-dog': {
    name: 'Bernese Mountain Dog',
    headKeyword: 'Bernese Mountain Dog',
    metaDescription: "The Bernese Mountain Dog: a tricolor Swiss farm dog built for hauling carts, now mostly employed hauling itself onto the sofa. A field guide, with stage notes — and an honest word about the years you get.",
    facts: {
      'Group': 'Working',
      'Size': 'Males 25–27.5 in, 80–115 lb · Females 23–26 in, 70–95 lb',
      'Temperament': 'Calm, gentle, eager to please, reserved with strangers, devoted to family',
      'Life expectancy': '7–10 years (short for a breed this size, driven by a high cancer rate)',
      'Coat': 'Long, thick double coat; heavy seasonal shedding',
      'Colors': 'Tricolor only — black base, white blaze and chest, rust points',
      'AKC recognized': 'Yes — 1937',
      'Origin': 'Bernese Alps, Switzerland — bred as a farm and draft dog',
    },
    lede: `Before the Bernese Mountain Dog was anyone's living-room giant, it was staff. Farmers in the Swiss canton of Bern bred it to haul cartloads of milk, cheese, and produce down mountain roads, herd cattle, and guard the property overnight — a working triple-threat wrapped in a striking tricolor coat, sturdy enough for real labor and even-tempered enough to be trusted loose around children and livestock alike. Motor vehicles ended the cart-hauling career decades ago; the temperament that made the dog good at the job never got the memo. What's left is one of the gentlest large dogs alive, still built like it might be handed a harness at any moment, and still, in some corners of Switzerland, entered in carting competitions purely for the love of the old work.`,
    spotlight: `<p>A Bernese Mountain Dog does not so much walk onto the stage as arrive, the way weather arrives — unhurried, filling the frame, entirely sure of its welcome. The tricolor coat does most of the work before the dog does anything at all: jet-black flanks, a white blaze splitting the face clean down the middle, a white marking at the chest that Swiss breeders have called the "Swiss cross" for a century, and rust points warming the cheeks, legs, and eyebrows like a wax seal. Under studio lights it photographs the way a good tapestry photographs — better the longer you look at it.</p>
<p>What keeps viewers watching is the mismatch between the size and the manner. A dog once built to pull a loaded cart down an Alpine road sits, on our stage, with the unbothered patience of an animal that has never once been in a hurry. Ears drop. Head tilts. The tail, plumed and constantly in motion, does most of the emotional heavy lifting. Children in the chat ask, without fail, whether it bites. It does not. It leans.</p>
<p>Bone counts for a Bernese Mountain Dog run high and steady — not the instant spike a merle Mini Aussie gets, but a slow, accumulating goodwill, the sort a genuinely trustworthy animal earns rather than performs for. Regulars in the chat tend to remember a Bernese Mountain Dog's name long after the broadcast ends, which is more than can be said for most guests.</p>`,
    ownerFitHeading: 'Is a Bernese Mountain Dog right for you?',
    ownerFit: `<p>Read the next paragraph before you decide whether a Bernese Mountain Dog is right for you.</p>
<p><strong>The lifespan is the hardest fact on this page.</strong> Reputable sources put the breed's median lifespan at around eight to ten years — short even by large-breed standards — and the leading cause by a wide margin is cancer. Bernese Mountain Dogs carry an unusually high rate of a specific, aggressive cancer called histiocytic sarcoma, and malignant tumors of one kind or another account for roughly half of all Berner deaths. This is not a footnote to mention in passing. It is the single most important thing to know before committing to the breed, and it is why serious breeders health-test as far up the family tree as records allow, and why a fair number of Berner rescues exist for owners simply unprepared for the grief.</p>
<p><strong>Size and space.</strong> Males run up to 115 pounds, females a still-substantial 70 to 95. This is a dog that needs real floor space, a car that can carry it in comfort, and a household budget sized for a large dog's food and veterinary care.</p>
<p><strong>Grooming.</strong> The thick double coat sheds year-round with two dramatic seasonal blowouts. Brushing several times a week is the minimum to stay ahead of it; a slicker brush and an undercoat rake are not optional accessories here but standard equipment, and skipping a season is functionally the same as moving into the coat.</p>
<p><strong>Energy.</strong> Moderate, and genuinely restful compared to most working breeds. A Bernese Mountain Dog wants a solid daily walk and some time outdoors, not a triathlon — temperamentally, one of the calmer large dogs you will meet.</p>
<p><strong>Temperament.</strong> Famously good with children — patient, gentle, inclined to lie down rather than bowl someone over — but reserved with strangers rather than instantly friendly; it will wait for your cue before deciding a newcomer is welcome. Early, broad socialization smooths this without dulling the watchfulness that makes it a good judge of character.</p>
<p><strong>The verdict:</strong> if you have the space, the grooming discipline, and — honestly — the emotional readiness for a short, intense companionship with a large and devoted animal, the Bernese Mountain Dog gives back more warmth than almost any breed alive. Go in with your eyes open about the years you'll actually get.</p>`,
    famousHeading: 'Famous Bernese Mountain Dogs',
    famous: `<p>The Bernese Mountain Dog has never produced a Rin Tin Tin, and probably never will — the breed's calm, unhurried nature is a virtue in a living room and a liability on a film set that needs a dog to hit its mark on cue, forty takes running, and act delighted about it each time. What the breed has instead is a genuinely charming run as presidential company: Ireland's President Michael D. Higgins has kept a succession of Bernese Mountain Dogs at the official residence — Bród, then Síoda, then Misneach — each one a minor national celebrity in their own right, their comings, goings, and eventual passings marked with official statements from the President's office and warm, front-page-adjacent coverage in the Irish press. It is a rare thing for a head of state's pet to be publicly mourned by name. The Bernese Mountain Dog has managed it three times running, and each successor has arrived to a public that already knew, roughly, what kind of dog it was getting: patient, watchful, and thoroughly decent.</p>
<p>Beyond Áras an Uachtaráin, the breed's fame stays quieter and more local: the working farm dog turned beloved family giant, instantly recognizable, adored on social media, and rarely cast as anything grander than itself. Given the breed's own patient, unbothered temperament, it is hard to imagine it minding one bit.</p>`,
    relatedBreeds: [
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'golden-mountain-dog', name: 'Golden Mountain Dog' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'sheepadoodle', name: 'Sheepadoodle' },
      { slug: 'newfoundland', name: 'Newfoundland' },
    ],
    breedTagName: 'Bernese Mountain Dog',
  },

  vizsla: {
    name: 'Vizsla',
    headKeyword: 'Vizsla',
    metaDescription: "The Vizsla: Hungary's velvet-coated hunting dog, bred for the field and constitutionally unable to relax unless it's touching you. A field guide, with stage notes.",
    facts: {
      'Group': 'Sporting',
      'Size': 'Males 22–24 in, 55–60 lb · Females 21–23 in, 44–55 lb',
      'Temperament': 'Affectionate, high-energy, sensitive, intensely bonded ("velcro dog"), gentle',
      'Life expectancy': '12–14 years',
      'Coat': 'Short, dense, self-cleaning single coat',
      'Colors': 'Golden rust to red; small white markings acceptable on chest and toes',
      'AKC recognized': 'Yes — 1960',
      'Origin': 'Hungary — Magyar hunting dog, bred as an all-purpose pointer-retriever',
    },
    lede: `There is a nickname breeders use for the Vizsla that tells you most of what you need to know before you've met one: velcro dog. Not in the loose, marketing sense applied to any breed that likes its owner — a Vizsla will follow you from room to room, press against your leg mid-conversation, and treat a closed bathroom door as a small personal tragedy. Underneath the affection is a genuine working hunting dog, bred in Hungary over centuries to point and retrieve game across open plains, and it carries a hunting dog's stamina and drive whether or not anyone in the household has ever held a shotgun. Handsome, golden-rust, and constitutionally unable to relax more than three feet from a person it loves — that is the whole breed in one sentence, and the rest of this page is just footnotes.`,
    spotlight: `<p>A Vizsla on stage looks, for the first several seconds, like it is auditioning for the cover of a hunting magazine — the coat a single unbroken sheet of golden rust, the build lean and coiled, the whole animal pointed at whatever has its attention with a stillness a Labrador never quite manages. Then the moment breaks, because a Vizsla left in a frame alone for more than four seconds starts looking for its person, and the search itself becomes the show: head swiveling, ears up, a soft worried whine that resolves the instant a familiar voice answers back.</p>
<p>What makes them compelling to watch is the sensitivity underneath the athleticism. A Vizsla's eyes track the room constantly, reading tone more than words, and its reaction to praise is immediate and visible — the whole back half of the dog seems to agree with the compliment before the front half has finished processing it. Viewers who expect a stoic, business-like hunting dog get, instead, something closer to a muscular, golden-red exclamation mark that has just been told it's a very good boy and believes it completely.</p>
<p>The coat helps enormously on camera. With no undercoat to fluff or mat, it lies close and dense in a single warm color — closer to good whiskey than to any dog we usually describe as "golden" — so a Vizsla never looks anything but immaculate, however much running around it has just done. Even mid-zoomies, the silhouette stays sleek.</p>`,
    ownerFitHeading: 'Is a Vizsla right for you?',
    ownerFit: `<p>The Vizsla's reputation as an affectionate, elegant, low-maintenance-looking dog undersells exactly how much dog is actually involved.</p>
<p><strong>This is a genuine athlete.</strong> Bred to hunt birds across open Hungarian plains all day, a Vizsla needs real, sustained exercise — commonly cited at close to two hours daily, ideally including some off-leash running. A walk around the block is a warm-up, not a workout. An under-exercised Vizsla gets inventive, and the inventions usually involve your furniture, your garden, or both. Many owners find a Vizsla is genuinely happiest paired with a job — hiking, running, a field-trial or hunt-test program through a local club — rather than left to invent its own entertainment.</p>
<p><strong>The velcro trait is not a figure of speech.</strong> This breed bonds hard and does not do well left alone for long stretches — genuine separation anxiety is common. A Vizsla suits a household with someone home most of the day, or a serious, honest plan for company when they're not.</p>
<p><strong>Sensitivity.</strong> Vizslas take correction hard. Harsh training methods backfire badly with this breed; they respond to patience, consistency, and positive reinforcement, and tend to shut down or grow anxious under the kind of firm-handed training some other breeds simply shrug off.</p>
<p><strong>Coat and grooming.</strong> About as easy as dog ownership gets on this front — a short, dense, self-cleaning coat that needs only weekly brushing, with light shedding year-round and a heavier drop each spring and fall.</p>
<p><strong>Health.</strong> Hip dysplasia, epilepsy, hypothyroidism, and a handful of inherited eye conditions appear in the breed, along with clotting disorders such as von Willebrand's disease. The Vizsla Club of America runs a health-screening program covering hips, thyroid, and eyes, and a reputable breeder will have the paperwork to show for it. Ask to see it.</p>
<p><strong>The verdict:</strong> a wonderful, deeply loyal companion for an active household that's rarely empty and willing to meet the breed's exercise needs honestly, not aspirationally. A rough fit for anyone hoping for a low-key dog content to entertain itself — a Vizsla left alone and under-exercised is, reliably, an unhappy and destructive one.</p>`,
    famousHeading: 'Famous Vizslas',
    famous: `<p>The Vizsla has never had a proper Hollywood moment, but it has quietly had a very good run through Hungarian and American history. Hungarian nobility kept vizsla-type hunting dogs for centuries — the breed's association with the Magyar aristocracy is documented back to the medieval period — and the line nearly vanished twice, first amid the upheavals of the First World War and again after the Second, saved largely by breeders who carried foundation stock out of Hungary and rebuilt it abroad, including in the United States, where the AKC recognized the breed in 1960 as its 115th breed.</p>
<p>Its closest thing to a modern celebrity is Jasper, the Vizsla belonging to Fox News host Dana Perino, who became enough of a fixture on her program <em>The Five</em> that Perino wrote a bestselling book about him — <em>Let Me Tell You About Jasper . . . How My Best Friend Became America's Dog</em> — built around the idea that a good dog is one of the few things left that everyone, regardless of politics, can agree on. Whatever else divided her show's audience, Jasper reliably did not. It is, in miniature, the Vizsla's whole talent: winning over a room it hasn't officially been introduced to yet.</p>`,
    relatedBreeds: [
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'weimaraner', name: 'Weimaraner' },
      { slug: 'pointer', name: 'Pointer' },
    ],
    breedTagName: 'Vizsla',
  },

  'giant-schnauzer': {
    heroImage: '/breeds-img/giant-schnauzer.jpg',
    heroCredit: 'AI-generated image',
    name: 'Giant Schnauzer',
    headKeyword: 'Giant Schnauzer',
    metaDescription: "The Giant Schnauzer: a Bavarian brewery guard dog scaled up from cattle-droving stock, all beard, eyebrows, and unblinking watchfulness. A field guide, with stage notes.",
    facts: {
      'Group': 'Working',
      'Size': 'Males 25.5–27.5 in, 60–85 lb · Females 23.5–25.5 in, 55–75 lb',
      'Temperament': 'Composed, watchful, courageous, easily trained, deeply loyal, playful in repose',
      'Life expectancy': '12–15 years',
      'Coat': 'Wiry double coat; hand-stripped or clipped, low-shedding',
      'Colors': 'Solid black or pepper-and-salt — the only two AKC colors',
      'AKC recognized': 'Yes — 1930',
      'Origin': 'Bavaria, Germany — cattle-driving and brewery-guard dog',
    },
    lede: `Long before Bavaria's breweries needed a guard smarter than a lock, they had the Giant Schnauzer — a cattle drover's dog from the hills between Munich and Augsburg, bulked up over generations (local lore credits an infusion of black Great Dane, among other crosses) until it was serious enough to march a herd to market by day and serious enough to sit outside a beer cellar all night daring anyone to try something. It has since been drafted into police work, military service, and search and rescue, which tells you plainly what sort of employee this is. Retire it into a family home and the résumé doesn't go away — it just gets redirected at your sofa, your mail carrier, and anyone it has decided, on its own authority, needs supervising.`,
    spotlight: `<p>A Giant Schnauzer arrives on stage the way a good bouncer arrives at a bar fight: unhurried, entirely aware of the room, in no rush to prove anything. The wiry black coat reads almost architectural under studio lights — square-built, close-fitted, with that famous beard and those heavy, expressive eyebrows doing more emotional work than most dogs manage with their whole face. Before it has done a single trick, the Giant Schnauzer has already communicated an opinion about the evening.</p>
<p>The opinion is usually favorable, once you get past the eyebrows. Underneath the stern, professorial look is a genuinely playful, people-oriented dog, and the flip between the two is the whole show: a Giant Schnauzer will hold a solemn, faintly disapproving expression for a full ten seconds and then, without warning, break into a full-body wag that undoes the entire performance. Regulars in the chat have taken to calling it "the reveal."</p>
<p>Viewers send bones the way you'd tip a maître d' who turned out to have a sense of humor after all — a little startled, entirely won over. It is, per bone, one of the more efficient dogs we host: it does not audition for approval so much as begrudgingly accept it as its due, and that reluctance is exactly what makes the eventual tail-wag land. The salt-and-pepper coloring, when we get one, adds a distinguished, silvering effect that makes an already professorial dog look faintly retired from something important.</p>`,
    ownerFitHeading: 'Is a Giant Schnauzer right for you?',
    ownerFit: `<p>The Giant Schnauzer is an outstanding dog for the right owner and a genuinely difficult one for the wrong household. Read the fine print before falling for the beard.</p>
<p><strong>Energy — a lot of it.</strong> This is not a dog you can walk around the block and call it done. Giant Schnauzers need somewhere in the neighborhood of ninety minutes to two hours of real activity a day, and they lean toward dog sports — agility, obedience, tracking, carting — where a working brain finally gets something to chew on besides your furniture. An under-exercised Giant Schnauzer does not sulk quietly; it invents its own job, and you generally will not enjoy which one it picks.</p>
<p><strong>Training and leadership.</strong> Highly intelligent and genuinely easy to train, provided the training is consistent and starts early. Left without clear structure, that same intelligence gets applied to deciding who's actually in charge of the house, and a Giant Schnauzer that has appointed itself head of household is a considerably harder animal to live with than one that never got the chance.</p>
<p><strong>Grooming.</strong> The wiry double coat does not shed the way a Labrador's does, which is good news for allergy sufferers and bad news for your grooming budget. Hand-stripping or clipping every six to eight weeks is standard, with brushing two or three times a week in between to keep the beard from turning into a small salad.</p>
<p><strong>Watchfulness.</strong> Bred for generations to guard a brewery cellar unsupervised, and it never really clocked out. A Giant Schnauzer is naturally wary of strangers and will announce visitors with real conviction. Early, broad socialization keeps that instinct at "alert" rather than "hostile," and is not optional.</p>
<p><strong>Health.</strong> Hip dysplasia and bloat are the concerns to ask a breeder about directly; both are serious in a deep-chested dog this size, and a reputable breeder will have hip scores and a clear feeding protocol to discuss.</p>
<p>The verdict: a magnificent, whip-smart working dog for an active owner who wants a partner rather than a houseplant. A poor match for anyone hoping for a low-energy dog that keeps itself entertained — that dog does not exist in this breed, and the eyebrows will not apologize for it.</p>`,
    famousHeading: 'Famous Giant Schnauzers',
    famous: `<p>The Giant Schnauzer's most famous modern moment arrived on live television: in February 2025, a five-year-old Giant Schnauzer named Monty won Best in Show at the 149th Westminster Kennel Club Dog Show — the first Giant Schnauzer in the event's history to take the top prize, after placing in the Working Group three years running before finally getting the nod. His handler, Kate Bernardin, nicknamed him "my Secretariat," on account of a dog that reportedly never stops moving. It was, by any measure, the breed's biggest night.</p>
<p>Off the show circuit, the breed has quietly kept celebrity company for decades. Zendaya grew up with a Giant Schnauzer named Midnight from the age of eight until the dog's death in 2015, a loss she marked with an unusually heartfelt public tribute — proof that a dog bred to guard beer cellars can, somewhere along the way, become someone's actual childhood.</p>
<p>Between Monty's ring career and Midnight's long, doted-on retirement, the Giant Schnauzer's fame runs exactly the way the breed itself does: understated until called upon, and then entirely unmissable.</p>`,
    relatedBreeds: [
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'standard-schnauzer', name: 'Standard Schnauzer' },
    ],
    breedTagName: 'Giant Schnauzer',
  },

  newfoundland: {
    heroImage: '/breeds-img/newfoundland.jpg',
    heroCredit: 'AI-generated image',
    name: 'Newfoundland',
    headKeyword: 'Newfoundland',
    metaDescription: "The Newfoundland: a Canadian fisherman's water-rescue dog built like a small bear and tempered like a saint. A field guide, with stage notes.",
    facts: {
      'Group': 'Working',
      'Size': 'Males ~28 in, 130–150 lb · Females ~26 in, 100–120 lb',
      'Temperament': 'Sweet-natured, patient, calm, devoted, gentle with children',
      'Life expectancy': '9–10 years',
      'Coat': 'Thick, water-resistant double coat; heavy year-round shedding',
      'Colors': 'Black, brown, gray, and Landseer (white with black markings)',
      'AKC recognized': 'Yes — 1886',
      'Origin': 'Island of Newfoundland, Canada — fishermen’s working and water-rescue dog',
    },
    lede: `Most dogs that jump into cold water are making a mistake. A Newfoundland jumping into cold water is going to work. Bred by Canadian fishermen to haul nets, tow lines to shore, and pull half-drowned sailors out of the North Atlantic, the breed comes equipped with webbed feet, an oily water-repellent double coat, and a chest deep enough to power through a rough sea without much apparent effort. It is, by build, one of the strongest swimmers in the dog world — capable enough that lifesaving societies in more than one country have, at various points, trained Newfoundlands as actual rescue personnel. All that raw capability is wrapped around one of the gentlest temperaments in the working group, which is either an enormous stroke of luck or the whole point of the breeding program, depending who you ask.`,
    spotlight: `<p>A Newfoundland does not enter a room so much as fill the available cubic footage of it. At up to a hundred and fifty pounds, the breed is one of the largest we regularly host, and the stage frame has to work to contain it — a broad head, a heavy, slightly mournful expression, and a coat so thick it reads as a separate weather system. And yet the overwhelming impression, within seconds, is not size. It's gentleness. The eyes do it — soft, patient, entirely unbothered by the lights or the noise or the general circus of live television.</p>
<p>What audiences respond to is the mismatch between raw power and evident sweetness. This is a dog built to drag a grown man out of the sea, currently more concerned with whether there is a lap nearby large enough to accommodate its ambitions. A Newfoundland's default expression carries a faint, permanent sorrow that has nothing to do with its mood — it's simply how the jowls fall — and viewers who don't know this find it weirdly moving, right up until the tail starts going and the illusion collapses into pure, drooling joy.</p>
<p>Bone counts run warm and steady rather than explosive; a Newfoundland earns its votes the way it earns everything else, by radiating calm competence and looking, throughout, entirely trustworthy. Regulars describe the feeling as being handed a very large, very damp blanket that also loves you.</p>`,
    ownerFitHeading: 'Is a Newfoundland right for you?',
    ownerFit: `<p>A Newfoundland rewards the right household enormously and overwhelms the wrong one just as fast. Read this section with a tape measure in hand.</p>
<p><strong>Size and space.</strong> Males commonly reach 130 to 150 pounds, females 100 to 120. This is genuinely one of the largest common breeds, and it needs a home — and furniture, and a car, and a vet's scale — built to match. Small apartments are a hard no.</p>
<p><strong>The lifespan is short for how big the heart is.</strong> Nine to ten years on average is on the low end even by large-breed standards, and it's the single hardest fact to sit with before committing to the breed.</p>
<p><strong>Grooming and drool.</strong> The dense, water-resistant double coat sheds heavily year-round with two serious seasonal blowouts, and needs brushing several times a week to stay ahead of matting. Add a working jowl built to shed water rather than hold it in, and you get a dog that drools — a fact new owners chronically underestimate until they've bought their first slobber towel.</p>
<p><strong>Energy — moderate, but real.</strong> Newfoundlands aren't hyperactive, but they need a daily walk and, ideally, regular access to water; a Newfoundland that never gets to swim is missing out on the thing its whole body was engineered for. Heat is a genuine risk given the coat, so exercise needs planning around climate.</p>
<p><strong>Temperament with family.</strong> Famously gentle and patient, especially with children — sometimes called a "nanny dog," a reputation cemented by Nana in <em>Peter Pan</em> and earned honestly in real households. Good-natured with strangers rather than watchful, which makes it a poor guard dog and an excellent one for a busy, sociable home.</p>
<p><strong>Health.</strong> Hip and elbow dysplasia, a heart condition called subaortic stenosis, and bloat are the main concerns in a dog this size; a reputable breeder screens for all three and can produce the paperwork.</p>
<p>The verdict: an extraordinary, loving companion for a household with the space, the budget, and the emotional readiness for a short partnership with a very large, very devoted animal. A poor fit for small living spaces, tidy-house perfectionists, or anyone startled by dog hair in their coffee.</p>`,
    famousHeading: 'Famous Newfoundlands',
    famous: `<p>Few breeds have a literary and historical résumé this deep. J.M. Barrie made a Newfoundland the family nanny in the original stage version of <em>Peter Pan</em> — Nana, drawn from Barrie's own dog, cemented the breed's reputation as the gentlest of giants for more than a century of readers who'd never met one. Lewis and Clark brought a Newfoundland named Seaman on their entire transcontinental expedition, where he hunted, stood guard, and by several accounts saved the party from more than one close call; when Meriwether Lewis died, Seaman reportedly refused to eat and did not long survive him. Lord Byron loved his Newfoundland Boatswain enough to write the dog one of the most quoted epitaphs in English literature, praising virtues in Boatswain — honesty, courage, fidelity — that the poet pointedly noted he found rarer in most humans.</p>
<p>On the show circuit, a 155-pound Newfoundland named Josh — registered as Ch. Darbydale's All Rise Pouchcove — won Best in Show at the 2004 Westminster Kennel Club Dog Show and parlayed it into a genuine media tour, appearing on <em>Late Show with David Letterman</em> and <em>Good Morning America</em>. His hometown of Flemington, New Jersey, declared an official "Josh Day" in his honor. It remains one of the more good-natured victory laps in Westminster history, which feels entirely on brand for the breed.</p>`,
    relatedBreeds: [
      { slug: 'bernese-mountain-dog', name: 'Bernese Mountain Dog' },
      { slug: 'golden-mountain-dog', name: 'Golden Mountain Dog' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'great-pyrenees', name: 'Great Pyrenees' },
    ],
    breedTagName: 'Newfoundland',
  },

  'american-bully': {
    name: 'American Bully',
    headKeyword: 'American Bully',
    metaDescription: "The American Bully: a UKC-recognized companion breed built like a linebacker with the temperament of a lap dog, plus a legal landscape every owner should read before falling for the look. An honest field guide, with stage notes.",
    facts: {
      'Group': 'Companion/guardian type — not AKC recognized; UKC Terrier Group (2013), ABKC (2004)',
      'Size': 'Four classes — Pocket, Standard, Classic, XL — 13–23 in at the withers depending on class and sex',
      'Weight': 'Roughly 40–88 lb, varying by size class',
      'Temperament': 'Confident, outgoing, affectionate, eager to please, good with children',
      'Life expectancy': '8–13 years',
      'Coat': 'Short, smooth, glossy; moderate year-round shedding',
      'Colors': 'Any color or color pattern',
      'Origin': 'United States, 1980s–90s — American Pit Bull Terrier crossed with Bulldog breeds',
      'Legal note': 'The XL variety has been banned in England and Wales since 2024',
    },
    lede: `The American Bully looks like it walked out of a comic book and into your living room — built low and wide, with the kind of shoulders that suggest a background in furniture removal. Then it puts its head in your lap and declines to leave. That contrast is the entire point of the breed: cartoonish muscle, bred quite deliberately around a gentle, people-pleasing temperament. It was engineered for one job — looking formidable and being lovely — and, bred responsibly, it does that job well. It also arrives with a legal and social weight that no honest guide can skip.`,
    spotlight: `<p>An American Bully arriving on stage rearranges the room's sense of scale before it reaches center frame. The shoulders lead, the chest follows a beat later, and the whole assembly moves with a low, rolling confidence that reads — for about two seconds, before the tail starts going — like a monster-movie trailer. Then the tail starts going.</p>
<p>What audiences aren't braced for is the collapse into goofiness. A Pocket Bully the size of a beer keg will attempt, without fail, to fold itself into a lap built for something a third its mass. A Standard will lean its full bodyweight against the nearest leg and consider the transaction complete. The XLs — the largest of the four size classes — manage the rare trick of looking like a bouncer and behaving like a golden retriever who never got the height memo.</p>
<p>The chat reaction runs a reliable two-beat joke: a wave of nervous commentary about the jawline, followed almost immediately by "okay, that's the sweetest thing I've seen all week." Bone counts follow the same arc — cautious, then generous. Very few breeds on our stage cover that particular emotional distance in under ten seconds, and it never stops working.</p>`,
    ownerFitHeading: 'Is an American Bully right for you?',
    ownerFit: `<p>The American Bully's whole design brief was gentleness inside a formidable frame, and responsible breeding has mostly delivered on it. But the breed carries real practical and legal weight that deserves a straight answer, not a marketing one.</p>
<p><strong>Temperament, honestly.</strong> Well-bred, well-socialized American Bullies are consistently described as affectionate, tolerant of children, and eager to please — closer in disposition to an oversized lap dog than to their tough-guy silhouette. As with any breed descended from bull-breed working lines, individual temperament tracks breeding and upbringing closely, and early socialization plus consistent training matter more here than with a low-stakes breed. Skip either and the dog's size turns any bad habit into a bigger problem than it would be on a spaniel.</p>
<p><strong>The legislation problem.</strong> Most breed guides skip this, and it matters too much to skip. Since February 2024, the XL Bully has been banned outright in England and Wales under the Dangerous Dogs Act — existing owners must register, neuter, muzzle, and leash their dogs in public, or face prosecution, following a string of serious attacks that made national news. A number of U.S. cities and several states still carry breed-specific legislation aimed at "pit bull type" dogs that can sweep in the American Bully by appearance, regardless of any individual dog's temperament or paperwork. None of this reflects on any specific dog you might bring home, but it is a real, binding fact of ownership — check your local ordinances and your insurance policy before you commit, not after.</p>
<p><strong>Space and strength.</strong> Even the Pocket class is a dense, muscular animal, and the Standard and XL classes are genuinely large, strong dogs. Leash-manners training from puppyhood isn't optional just because the dog seems friendly.</p>
<p><strong>Health.</strong> Hip dysplasia is the most common structural concern; the breed's broader face can bring mild breathing and heat-tolerance issues in hot weather, and skin allergies turn up often enough that an early conversation with your vet about food sensitivities is worth having. Ask any breeder for hip and cardiac clearances.</p>
<p><strong>Grooming and exercise.</strong> Low-maintenance coat, moderate shedding, and a daily walk plus playtime covers most of it — a comparatively easy breed to physically maintain, whatever else it asks of you.</p>
<p><strong>The verdict:</strong> for an owner willing to do the legal homework, the training, and the socializing, the American Bully delivers exactly what it was bred for — a huge, muscular dog with a house-pet's heart. For anyone drawn purely to the look, that legal homework is not optional reading.</p>`,
    famousHeading: 'Famous American Bullies',
    famous: `<p>The American Bully is young and internet-native enough that its fame lives almost entirely on social media rather than in film credits. Within the breeding world, Gottyline Dax — from the Gottiline and Greyline bloodlines that helped found the breed alongside Dave Wilson's Razor's Edge kennel in the 1980s and 90s — is treated as close to royalty, a foundation dog whose pedigree still turns up across the sport. Wilson founded the American Bully Kennel Club in 2004 to formalize the standard, and the UKC granted its own recognition in 2013.</p>
<p>Outside the breeding world, the closest thing to a household name is Hulk, the roughly 175-pound dog made famous by New Hampshire's Dark Dynasty K9s and a viral video of him giving a toddler pony rides. We'll note the connection honestly rather than overclaim it: outlets covering Hulk describe him only as a "Pit Bull" of undetermined exact parentage, not confirmed as an American Bully specifically. What isn't in doubt is the breed's more recent, less flattering brush with fame — the 2024 UK ban on the XL variety put "American Bully" in international headlines for reasons no breed wants.</p>`,
    relatedBreeds: [
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'pit-bull', name: 'Pit Bull' },
    ],
    breedTagName: 'American Bully',
  },

  'agouti-husky': {
    name: 'Agouti Husky',
    headKeyword: 'Agouti Husky',
    metaDescription: "The Agouti Husky: the rare, wolf-colored Siberian Husky coat that made the sled dog Togo famous — a field guide to the color, and the same brilliant, headstrong breed underneath. Honest, with stage notes.",
    facts: {
      'Group': 'Working (Siberian Husky) — agouti is a coat-color variant, not a separate breed',
      'Size': 'Males 21–23½ in, 45–60 lb · Females 20–22 in, 35–50 lb',
      'Temperament': 'Friendly, outgoing, independent, high-energy, not possessive or guarding',
      'Life expectancy': '12–14 years',
      'Coat': 'Thick double coat; each hair banded black/tan/grey ("wolf sable"), giving a mottled wild look; heavy seasonal shedding',
      'Colors': 'Charcoal undercoat with black-tipped, tan-and-grey-banded outer hairs, often with a dark facial mask and tan "spectacles"',
      'AKC recognized': 'Yes — 1930, Working Group (as a Siberian Husky color, not a separate registration)',
      'Origin': 'Siberia, bred by the Chukchi people; imported to Alaska in the early 1900s',
      'Rarity': 'One of the rarer Husky colors — more common in working/sled lines than show lines',
    },
    lede: `Put an ordinary Siberian Husky and an agouti Husky side by side and the agouti looks like it wandered in from a different, wilder documentary. The coloring — each hair banded through black, tan, and grey rather than dyed one flat shade — produces about the closest thing to an actual wolf's coat a housepet can legally have. It isn't a separate breed, a designer mix, or a marketing invention. It's a genuine, comparatively rare Siberian Husky color, and the dog underneath is exactly the same Husky as ever: brilliant, headstrong, and entirely unconcerned with your schedule.`,
    spotlight: `<p>An agouti Husky under studio lights does something almost no other coloring on our stage manages: it changes color as the dog moves. Turn a shoulder toward the key light and the coat reads warm tan; turn it away and the same patch goes charcoal-grey, because every individual hair is doing three colors at once rather than one. Viewers who know Huskies mainly as black-and-white or red-and-white spend the first thirty seconds audibly recalculating what breed they're looking at.</p>
<p>The behavior underneath is pure, unfiltered Husky, agouti or not. There's the direct, pale-eyed stare that misses nothing in the room. There's the vocal repertoire — a Husky rarely barks and frequently narrates, in a rising, almost human-sounding howl-talk that the chat finds either hilarious or faintly haunting depending on the night. And there's the total absence of interest in being anyone's obedient background prop; a Husky on stage behaves like a colleague, not an employee.</p>
<p>Bone counts spike hard and fast for the wolf-look alone, then tend to hold, because the personality earns its own following. Regulars start requesting agouti Huskies by name once they've seen one — a genuinely rare color, spotted maybe once every few dozen shows, is its own kind of event.</p>`,
    ownerFitHeading: 'Is an Agouti Husky right for you?',
    ownerFit: `<p>Color doesn't change temperament, so read this as an honest Siberian Husky owner-fit with one extra wrinkle: agouti dogs more often trace back to working sled lines than show lines, which can mean even more drive than the breed average, not less.</p>
<p><strong>Energy and exercise.</strong> Huskies were bred to run in harness for hours, in a team, and that inheritance doesn't switch off in a backyard. Plan on serious daily exercise — a jog, not a stroll — plus real mental work, or expect digging, howling, and escape attempts born of pure boredom.</p>
<p><strong>The escape-artist reputation is earned.</strong> Huskies are famous for clearing fences that would hold most breeds, by jumping and by digging underneath. A secure, tall, buried-bottom fence isn't optional, and neither is a leash near traffic — the breed's independent streak means recall is never guaranteed once something interesting is moving.</p>
<p><strong>Prey drive and other pets.</strong> Bred partly to hunt as well as pull, many Huskies chase small animals with real intent. Cats and small dogs in the household need careful, gradual introductions, and off-leash time around wildlife needs real caution.</p>
<p><strong>Shedding and grooming.</strong> The thick double coat "blows" twice a year in dramatic, room-filling amounts, with lighter shedding constantly in between. Weekly brushing keeps the worst of it manageable; during a seasonal blowout, plan on daily brushing for a week or two, and never shave a Husky to "help" — the coat is doing genuine thermal work and shaving can damage regrowth and remove its insulation just when the dog needs it. If you can't live with fur on everything, this isn't your breed regardless of how striking the color is.</p>
<p><strong>Climate.</strong> Built for Siberian winters, not a hot back patio. Huskies tolerate cold beautifully and heat poorly — shade, water, and common sense are mandatory in summer, and a Husky left in direct sun on a warm day is a dog in genuine distress, not a dog that's merely uncomfortable.</p>
<p><strong>Sourcing an agouti specifically.</strong> Because the color is genuinely rare and turns up more in working/sled lines than conformation lines, chasing the color specifically can narrow your choice of breeder. Prioritize a health-tested, well-socialized litter over a coat pattern, and treat the color as a happy bonus rather than the main event.</p>
<p><strong>Health.</strong> Hip dysplasia and inherited eye conditions (progressive retinal atrophy, cataracts) are the main concerns; ask any breeder for hip and eye clearances on both parents.</p>
<p><strong>The verdict:</strong> a spectacular-looking dog wrapped around the same brilliant, independent, high-maintenance breed as any other Husky — right for an active owner with real fencing and real patience, wrong for anyone drawn in by the wolf-like coat alone.</p>`,
    famousHeading: 'Famous Agouti Huskies',
    famous: `<p>The most famous agouti-coated dog in history is also one of the most famous dogs, period. Togo, the lead sled dog for musher Leonhard Seppala during the legendary 1925 serum run to Nome, ran the longest and most dangerous stretch of the relay — across the breaking ice of Norton Sound — while Balto, who covered the shorter final leg, became the public face of the rescue and got the statue in Central Park. Togo's coat is consistently described by breed historians as agouti, or "wolf-gray": a banded mix of black, brown, grey, and creamy white that, fittingly, made him look every inch the wild animal he occasionally outran. Disney's 2019 film <em>Togo</em>, starring Willem Dafoe, finally gave Seppala's dog something closer to Balto's share of the credit.</p>
<p>Beyond Togo, agouti-specific fame gets thin fast — it's a color, not a bloodline, and most famous Huskies, Balto included, were solid black-and-white or red-and-white rather than agouti. The color's real celebrity is happening now, in the sled-dog and working-Husky world and across social media, where a striking agouti coat reliably stops the scroll.</p>`,
    relatedBreeds: [
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'siberian-husky', name: 'Siberian Husky' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'giant-schnauzer', name: 'Giant Schnauzer' },
    ],
    breedTagName: 'Siberian Husky',
  },

  poodle: {
    name: 'Poodle',
    headKeyword: 'Poodle',
    metaDescription: "The Poodle: the brilliant, low-shedding water retriever sitting quietly at the top of every doodle's family tree, in three sizes and one relentless brain. A field guide, with stage notes.",
    facts: {
      'Group': 'Non-Sporting (Standard & Miniature) · Toy Group (Toy)',
      'Size': 'Standard over 15 in, 40–70 lb · Miniature 10–15 in, 10–15 lb · Toy under 10 in, 4–6 lb',
      'Temperament': 'Brilliant, eager to please, elegant, sensitive, alert',
      'Life expectancy': '10–18 years (smaller varieties tend longer)',
      'Coat': 'Dense, curly, single-layer, low-shedding',
      'Colors': 'Solid — black, white, brown/café-au-lait, apricot, cream, silver, blue, gray, red',
      'AKC recognized': 'Yes — Standard 1887, Miniature 1929, Toy 1942',
      'Origin': 'Germany, as a working water retriever; later refined and popularized in France',
    },
    lede: `Every doodle on this website — every Bernedoodle, every Goldendoodle, every Cavapoo currently drowsing in a lap somewhere — has the same relative sitting quietly at the top of its family tree, largely unbothered about getting credit for any of it. The Poodle is not, whatever its reputation suggests, a decorative invention of French high society. It began in Germany as a serious working water retriever, the elaborate show clip was a hunter's haircut and not a fashion statement, and the brain underneath all that curl is — by the most-cited scientific ranking of the lot — the second-most trainable in all of dogdom. Everything else about the Poodle, including the France of it, came later.`,
    spotlight: `<p>A Poodle arriving on stage carries itself like it already knows how the segment is going to go, which — this is the maddening part — it usually does. Three sizes pass through our rotation: a Standard fills the frame with genuine athletic bearing, a coat like sculpted charcoal or apricot wool; a Miniature performs the same bearing at two-thirds scale and seems, if anything, more convinced of its own importance for the compression; a Toy at four or five pounds manages to look down its nose at a camera crew from a truly startling height disadvantage.</p>
<p>What none of them do is fumble. Ask a Poodle to sit and it sits before you have finished the sentence, then appears to wait — politely, but unmistakably — for a marginally harder question. We have had Standard Poodles pick up a wave, a spin, and a "which paw" routine inside a single commercial break, entirely because a producer got bored and started teaching between segments. The dog was never the bottleneck.</p>
<p>Viewers respond to the elegance first and the intelligence once they've clocked it — a Poodle's eyes track the chat scroll the way a chess player tracks an opponent's hand, and regulars swear the good ones are reading the bone count. We cannot confirm this. We also cannot entirely rule it out.</p>`,
    ownerFitHeading: 'Is a Poodle right for you?',
    ownerFit: `<p>The Poodle's reputation is unusually accurate, which is rare enough in this business that we want to say it plainly: yes, they really are that smart, and yes, that cuts both ways.</p>
<p><strong>Intelligence needs a job.</strong> Stanley Coren's landmark canine-intelligence study ranked the Poodle second of 138 breeds tested for working and obedience intelligence — beaten only by the Border Collie. A bored Poodle does not go quiet. It gets resourceful, and Poodle resourcefulness tends to end in an opened cupboard, a solved baby gate, or a look that says it has been waiting for you to catch up.</p>
<p><strong>Coat and shedding.</strong> Genuinely low-shedding across all three sizes — the very trait every doodle on this site was bred to chase — but low-shedding is not low-maintenance. The dense curl mats without regular brushing and needs a professional trim every four to six weeks. Skip it and you are not saving money; you are deferring a much larger grooming bill and an unhappy dog.</p>
<p><strong>Size matters more than the stereotype suggests.</strong> A Standard is a genuine mid-size athlete that wants real daily exercise, closer in spirit to a retriever than to a lapdog. A Toy is a different animal in every practical sense — more fragile, more prone to dental crowding, better suited to an apartment. Pick the size that matches your actual life, not the size in the photo you liked.</p>
<p><strong>Sensitivity.</strong> Poodles read tone and tension in a household with uncomfortable accuracy, and they do not thrive around raised voices or chaotic handling. Calm, consistent, reward-based training gets you the breed's full brilliance. Harshness gets you an anxious dog that has quietly stopped trying to please you — the one outcome no Poodle owner wants, and every Poodle owner can create by accident.</p>
<p><strong>Health.</strong> Hip dysplasia and progressive retinal atrophy show up in the larger varieties; smaller Poodles carry more risk of luxating patellas and dental crowding. Standard Poodles are also among the breeds associated with bloat — ask any breeder how they feed and whether the line has a bloat history.</p>
<p>The honest verdict: one of the most rewarding breeds going, for an owner willing to engage that brain daily and keep up with that coat. A frustrating one for anyone who wanted "smart" to mean "easy."</p>`,
    famousHeading: 'Famous Poodles',
    famous: `<p>The Poodle's fame runs in two very different directions at once, and both are genuine. In one direction: Louis XVI kept Toy Poodles as court companions, the Spanish painter Francisco Goya put them into more than one canvas, and 18th- and 19th-century European circuses built entire acts around the breed's trick-learning speed — the origin, more or less, of every "smartest dog" claim that followed. In the other, considerably later: Winston Churchill was, despite the bulldog mythology that still clings to him, a genuine Poodle man. His Miniature Poodle Rufus sailed the Atlantic with him to meet Roosevelt, was served his dinner off his own cloth before the family sat down to theirs, and was mourned so completely on his death that Churchill acquired a second dog and named it Rufus II rather than move on to a different name entirely.</p>
<p>Then there is the 1950s "poodle skirt" — a felt circle skirt appliquéd with a Poodle silhouette that became, for an entire American teenage generation, cultural shorthand for the era itself. A strange kind of fame, achieved without the breed lifting a single elegantly clipped paw.</p>`,
    relatedBreeds: [
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'cockapoo', name: 'Cockapoo' },
      { slug: 'labradoodle', name: 'Labradoodle' },
    ],
    breedTagName: 'Poodle',
  },

  'australian-shepherd': {
    name: 'Australian Shepherd',
    headKeyword: 'Australian Shepherd',
    metaDescription: "The Australian Shepherd: an American ranch dog with a mistaken passport, a merle coat that photographs like abstract art, and a work ethic that does not know how to switch off. A field guide, with stage notes.",
    facts: {
      'Group': 'Herding',
      'Size': 'Males 20–23 in · Females 18–21 in',
      'Weight': '40–65 lb',
      'Temperament': 'Intelligent, energetic, work-driven, watchful, deeply loyal',
      'Life expectancy': '12–15 years',
      'Coat': 'Medium-length double coat; moderate to heavy seasonal shedding',
      'Colors': 'Black, blue merle, red, red merle — each with or without white markings and/or tan points',
      'AKC recognized': 'Yes — 1991 (Miscellaneous Class), Herding Group 1993',
      'Origin': 'American West, 19th–20th century — despite the name, developed in the United States',
    },
    lede: `Despite what the passport implies, the Australian Shepherd has never set a paw in Australia. The breed was built in the American West, by ranchers who needed a herding dog smart enough to make its own decisions about sheep, and the "Australian" in the name is a hand-me-down credit to the Basque shepherds who arrived by way of Australia in the 1800s, sheepdogs in tow. Two centuries on, the Aussie remains mildly, good-naturedly confused about its own name and entirely undisputed about its own competence: this is one of the most capable working brains in the herding group, wrapped in a merle coat that photographs like abstract art.`,
    spotlight: `<p>An Australian Shepherd does not so much appear on stage as arrive mid-assessment, one ear already swiveling toward whatever in the studio most needs organizing. The coat does the visual work before the dog does anything at all — a blue merle's marbled silver-and-black patchwork, or a red merle's rust-and-cream mottling, catches studio light in a way no solid coat can, and the eyes compound it: pale blue, amber, one of each, occasionally split straight down the middle of a single iris. Viewers who have never seen a merle Aussie tend to type some version of "wait, is that real."</p>
<p>What breaks the portrait, reliably, is the herding instinct going off like a small internal alarm. Give an Aussie four seconds of stillness and something off-camera — a producer walking past, another dog's tail, a stray sound — earns a full-body pivot and a decisive stare, the same stare its ancestors used to move sheep down a mountainside without a word from anyone. It is not disobedience. It is a job applicant who has spotted unassigned work and cannot let it go undone.</p>
<p>Bone counts run hot for the coat and stay hot once the personality shows up — regulars have learned to expect the merle spike in the first ten seconds and the loyalty spike over the following minute, as the dog's attention visibly narrows to the one or two humans it has decided are its actual responsibility tonight.</p>`,
    ownerFitHeading: 'Is an Australian Shepherd right for you?',
    ownerFit: `<p>The Australian Shepherd is, without much competition, one of the highest-drive breeds we cover on this site, and nearly every piece of good advice about the breed traces back to that one fact.</p>
<p><strong>Energy that does not negotiate.</strong> This is a dog bred to work a full day on a ranch, and a walk around the block registers to an Aussie as a warm-up, not an outing. Plan on real, sustained daily activity — running, hiking, structured play, ideally something with a job attached — or plan on the dog inventing a job of its own, usually at the expense of your yard, your door frames, or your smaller pets.</p>
<p><strong>Trainability, cutting both ways.</strong> Aussies are exceptionally quick studies and dominate agility, obedience, and herding trials well out of proportion to the breed's actual population. That same speed of learning means they pick up bad habits just as fast as good ones — an under-trained Aussie isn't a blank slate, it's a smart dog that has already taught itself something you didn't intend.</p>
<p><strong>Herding will happen regardless of livestock.</strong> Children, cats, joggers, bicycles, other dogs at the park — an Aussie without sheep will herd whatever is available, sometimes with a nip at the heels that reads as instinct rather than aggression but still needs managing in a family home.</p>
<p><strong>The merle gene needs respect.</strong> Never breed two merle Australian Shepherds together — the pairing has a one-in-four chance of producing a "double merle" puppy, predominantly white-coated and at serious risk of blindness, deafness, or both. Any breeder proposing a merle-to-merle cross is not one to buy from.</p>
<p><strong>MDR1 drug sensitivity.</strong> Roughly half the breed carries at least one copy of the MDR1 gene mutation, which can cause severe, sometimes fatal reactions to ivermectin and several other common medications. Every Australian Shepherd — and every Aussie mix — should be genetically tested before its first round of standard veterinary drugs, not after a bad reaction.</p>
<p><strong>Health.</strong> Otherwise a fairly sound breed — hip dysplasia runs lower than in many working breeds (roughly 6% by OFA figures), though hips, elbows, and eyes are still worth screening for in any breeder's line.</p>
<p>The honest verdict: a spectacular partner for an owner who runs, hikes, competes, or otherwise has real daily work to hand the dog. A recipe for a frustrated household — and a frustrated dog — for anyone hoping the merle coat comes with a low-key temperament attached. It does not.</p>`,
    famousHeading: 'Famous Australian Shepherds',
    famous: `<p>The Australian Shepherd's biggest cultural moment came not from the show ring but from the rodeo circuit. In the 1950s and 60s, rancher and trick-dog trainer Jay Sisler toured Aussies named Stub, Shorty, and Queenie through venues as far-flung as Madison Square Garden and the Calgary Stampede, teaching them to walk on their hind legs, jump rope, and ride skateboards — a repertoire polished enough that Disney built features around the act, including 1973's "Stub: The Best Cowdog in the West." A decade or so later, an Aussie named Hyper Hank, partnered with owner Eldon McIntire, became one of flying-disc sport's first stars, performing at halftime of Super Bowl XII in New Orleans and later at the White House for the Carter family — a fairly remarkable career arc for a dog whose day job was supposed to be sheep.</p>
<p>More recently, the breed has become an unofficial mascot of the outdoorsy-celebrity set: Susan Sarandon, Bruce Willis, Demi Moore, and Amanda Seyfried have all owned Australian Shepherds, with Seyfried's Finn a recurring, extremely photogenic presence on her social media. It's a fitting modern update on a breed that has always done its best work a half-step ahead of the camera, whether the camera was at a rodeo, a stadium, or a phone.</p>`,
    relatedBreeds: [
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'toy-aussie', name: 'Toy Aussie' },
      { slug: 'aussiedoodle', name: 'Aussiedoodle' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'border-collie', name: 'Border Collie' },
    ],
    breedTagName: 'Australian Shepherd',
  },

  'golden-retriever': {
    name: 'Golden Retriever',
    headKeyword: 'Golden Retriever',
    metaDescription: "The Golden Retriever: the breed most people picture when you say \"friendly dog,\" built in the Scottish Highlands to retrieve gently and love unconditionally. A field guide, with stage notes.",
    facts: {
      'Group': 'Sporting',
      'Size': 'Males 23–24 in · Females 21.5–22.5 in',
      'Weight': 'Males 65–75 lb · Females 55–65 lb',
      'Temperament': 'Friendly, intelligent, eager to please, food-motivated',
      'Life expectancy': '10–12 years',
      'Coat': 'Dense, water-repellent double coat; wavy or straight; heavy seasonal shedding',
      'Colors': 'Light golden to dark golden',
      'AKC recognized': 'Yes — 1925',
      'Origin': "Scottish Highlands, 1868 — bred by Dudley Marjoribanks, 1st Baron Tweedmouth",
    },
    lede: `Ask a stranger to sketch "friendly dog" from memory and you will, more often than not, get a Golden Retriever — feathered tail mid-wag, ears back, an expression set permanently to delighted. That reputation isn't marketing. It's close to the literal design brief. In 1868, a Scottish nobleman named Dudley Marjoribanks — Lord Tweedmouth — bred a yellow retriever named Nous to a Tweed Water Spaniel named Belle on his Highlands estate, chasing a gundog steady enough to carry a shot bird back to hand without so much as denting the feathers. A century and a half later, the retrieving instinct is still fully intact. So, disproportionately, is the gentleness.`,
    spotlight: `<p>A Golden Retriever does not walk onto the Dog Show stage so much as flood it. The tail arrives roughly half a second before the rest of the dog and does not stop once it gets there — it is less a body part than a standing weather event, capable of clearing a coffee table in a single pass. Viewers clock the coat first, that warm range from pale cream to deep honey-gold catching the studio lights, and then the face does the rest of the work: soft eyes, an open panting grin, an expression that reads, with total sincerity, as pure joy at being looked at.</p>
<p>What separates the Golden from most of the crowd-pleasers we host is the mouth. This is a retriever bred over generations for what trainers call a "soft mouth" — the ability to carry a live, unharmed bird gently enough to set it down without a mark on it. On stage that instinct shows up as a dog that will happily mouth a toy, a sleeve, or a producer's clipboard with real enthusiasm and precisely zero pressure. It is, unexpectedly, one of the more reassuring things you can watch a large dog do. Give one an actual object to hold and the whole dog visibly relaxes, as though it has finally been assigned the job it was born for.</p>
<p>They are also, for a dog this size, remarkably quiet. Golden Retrievers rank low for nuisance barking — the breed would rather solve a stranger's presence by fetching them something than by raising an alarm about it. On a stage built around noise and spectacle, the calm is its own kind of contrast.</p>
<p>Bone counts run high and steady — no spikes, no lulls, just a dependable stream of goodwill every time one takes the stage. The Golden Retriever is the closest thing this show has to a sure bet.</p>`,
    ownerFitHeading: 'Is a Golden Retriever right for you?',
    ownerFit: `<p>The Golden Retriever's reputation for being easy is mostly earned and occasionally misleading. Read past the "great family dog" headline before committing.</p>
<p><strong>Shedding.</strong> Heavy, and not a footnote. That water-repellent double coat "blows" twice a year, carpeting furniture and clothing in fine golden fluff, and sheds at a lower background rate the rest of the time. A Golden Retriever household owns a good vacuum cleaner, or wishes it did.</p>
<p><strong>Energy and food drive.</strong> Moderate to high, and paired with a genuinely bottomless appetite. Goldens are famously food-motivated — wonderful for training, dangerous for the waistline. Obesity is one of the more common and most preventable problems in the breed; measure the food, not the eyes.</p>
<p><strong>Health — the hard conversation.</strong> This is the fact that matters more than any other on this page: roughly 60–65% of Golden Retrievers will develop cancer in their lifetime, most commonly hemangiosarcoma and lymphoma, making cancer the breed's leading cause of death by a wide margin. Hip dysplasia (affecting up to roughly a fifth of the breed) and a heart condition called subvalvular aortic stenosis are the other names worth knowing. None of this is a reason to avoid the breed — it's a reason to ask a breeder for OFA hip, elbow, heart, and eye clearances, and to keep up with veterinary screening throughout the dog's life.</p>
<p><strong>Temperament.</strong> About as advertised: patient with children, sociable with strangers, low on guarding instinct (a Golden makes a poor guard dog and an excellent greeter of burglars). They dislike being left alone for long stretches and do best woven tightly into family life.</p>
<p><strong>Trainability.</strong> Among the easiest of all breeds, provided the food motivation is channeled rather than ignored. Obedience, agility, therapy work, and guide-dog service all lean heavily on Goldens for a reason.</p>
<p>If you have the time for daily exercise, the tolerance for fur on everything you own, and the willingness to take the breed's cancer risk seriously rather than hoping around it, a Golden Retriever will reward you with one of the most uncomplicated, devoted companionships in all of dogdom.</p>`,
    famousHeading: 'Famous Golden Retrievers',
    famous: `<p>The Golden Retriever's most famous ambassador lived in the White House. Liberty, President Gerald Ford's Golden Retriever, was a fixture of the mid-1970s presidency — Ford himself often walked her on the South Lawn, and her litter of White House-born puppies in 1975 became a minor national event in its own right, tracked by the press with the enthusiasm usually reserved for actual news. Ford's evident fondness for Liberty is widely credited with giving the breed's popularity a real lift in America. A decade later, Ronald Reagan kept a Golden of his own named Victory, though Victory lived out at the Reagan ranch in California rather than in Washington with the boss.</p>
<p>On screen, the Golden Retriever has done heavier lifting than almost any other breed. Comet, the family dog on the sitcom "Full House," was a Golden. Shadow, the elderly voice of reason in "Homeward Bound: The Incredible Journey," was a Golden. And Buddy — the basketball-dribbling, football-kicking star of the "Air Bud" franchise — was played by a real Golden Retriever reportedly discovered doing exactly those tricks in his own backyard. Few breeds have been this thoroughly cast as America's default good dog, on screen and off.</p>`,
    relatedBreeds: [
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'mini-golden-retriever', name: 'Mini Golden Retriever' },
      { slug: 'golden-mountain-dog', name: 'Golden Mountain Dog' },
      { slug: 'labrador-retriever', name: 'Labrador Retriever' },
      { slug: 'poodle', name: 'Poodle' },
    ],
    breedTagName: 'Golden Retriever',
  },

  'labrador-retriever': {
    name: 'Labrador Retriever',
    headKeyword: 'Labrador Retriever',
    metaDescription: "The Labrador Retriever: America's longest-reigning most popular breed, built in Newfoundland to haul nets from the North Atlantic and now mostly retired to hauling tennis balls. A field guide, with stage notes.",
    facts: {
      'Group': 'Sporting',
      'Size': 'Males 22.5–24.5 in · Females 21.5–23.5 in',
      'Weight': 'Males 65–80 lb · Females 55–70 lb',
      'Temperament': 'Friendly, outgoing, eager to please, high food drive',
      'Life expectancy': '11–13 years',
      'Coat': 'Short, dense, water-resistant double coat',
      'Colors': 'Black, yellow, chocolate',
      'AKC recognized': 'Yes — 1917',
      'Origin': "Newfoundland, Canada — descended from the St. John's Water Dog, refined in 19th-century England",
    },
    lede: `There is, statistically, a good chance you already know a Labrador Retriever — the breed held the American Kennel Club's most-registered-breed title for a record thirty-one consecutive years, from 1991 to 2022, before finally handing the crown to the French Bulldog. The fishermen of Newfoundland who built its ancestor, the St. John's Water Dog, were not aiming for that kind of fame; they needed a strong, biddable, water-tolerant dog to haul nets and retrieve fish from the icy North Atlantic, full stop. English sportsmen imported the breed in the early 1800s, refined it into the dog we know today, and — in one of the great unresolved mix-ups of dog naming — called it after the wrong Canadian territory. Labradors come from Newfoundland. Nobody has ever managed to fix this.`,
    spotlight: `<p>A Labrador Retriever on our stage is, more or less, the platonic ideal of a dog encountering an audience: whole body wagging, tail working like a rudder that has come loose from the boat, mouth open in what can only be described as a grin. There is no breed here more instantly, unreservedly pleased to be looked at, and the enthusiasm reads through a screen exactly as well as it reads across a living room.</p>
<p>The three coat colors — black, yellow, chocolate — each draw their own devoted following in the chat, and viewers are quick to claim, with zero scientific backing and total conviction, that the colors run different personalities: yellows mellow, blacks serious, chocolates a little wild. No controlled study has ever confirmed it. The anecdote refuses to die anyway, and we are not the ones to argue with a chat room united behind a shared theory.</p>
<p>What no one disputes is the food motivation. A Labrador watching a bone-toss on this stage tracks it with the single-minded focus of a dog that understands, on some level, exactly how this economy works. It is, without exaggeration, the breed most likely to make direct and sustained eye contact with whoever last threw a bone, as though filing the information away for later.</p>
<p>Bone counts spike hard and reliably. Few dogs campaign for the audience's approval quite this openly, or quite this well.</p>`,
    ownerFitHeading: 'Is a Labrador Retriever right for you?',
    ownerFit: `<p>The Labrador's thirty-one-year reign as America's favorite dog was not an accident — it is, for the right household, close to the easiest large breed there is. Read the fine print anyway.</p>
<p><strong>The appetite has a genetic cause.</strong> Roughly a quarter of all Labradors carry a mutation in the POMC gene that disrupts the "I'm full" signal to the brain — University of Cambridge researchers found affected dogs stay hungrier between meals and burn about 25% less energy at rest than Labradors without it. This is not a training failure or a lack of willpower on the dog's part; it is wiring. Obesity is one of the breed's most common and most manageable problems, and it starts with a measuring cup, not a diet plan.</p>
<p><strong>Energy.</strong> High, especially before age three. Labradors were bred to work a full day in cold water and need a genuine daily outlet — a run, a swim, a serious fetch session — or they will find their own project, usually involving your furniture.</p>
<p><strong>Trainability.</strong> Outstanding, and closely tied to that same food drive. Labradors dominate guide-dog, therapy, search-and-rescue, and detection work worldwide because they are this easy to motivate with a treat and a "good dog."</p>
<p><strong>Health.</strong> Hip and elbow dysplasia are common enough that any reputable breeder screens for both. Exercise-induced collapse (EIC) — a genetic condition that can cause sudden hind-leg weakness or collapse after intense exercise or excitement — affects a minority of the breed and is now covered by a simple DNA test; ask for it. Ear infections are frequent in a dog that swims as often as this one does.</p>
<p><strong>Temperament.</strong> Reliably good with children, other dogs, and strangers, which is exactly why it spent three decades as the default family dog. It is not a natural guard dog — a Labrador's response to an intruder is more likely to be enthusiasm than alarm.</p>
<p>If you can meet the exercise needs and manage the food bowl with real discipline, a Labrador Retriever gives back one of the steadiest, most good-natured companionships available in a dog.</p>`,
    famousHeading: 'Famous Labrador Retrievers',
    famous: `<p>The Labrador's best-known modern story is a cautionary one, and it comes with thirteen years of daily proof that "worst dog" and "best dog" can be the same animal. John Grogan's 2005 memoir "Marley & Me" turned his chaotic, furniture-destroying, thunderstorm-terrified yellow Lab into a bestseller and, in 2008, a film starring Owen Wilson and Jennifer Aniston — an entire cultural moment built on the premise that a badly behaved Labrador is still, somehow, the family's favorite member.</p>
<p>At the opposite end of the temperament spectrum was Endal, a black Labrador assistance dog in the UK who could operate ATMs, load washing machines, and — most famously — was credited with pulling his unconscious owner into the recovery position and covering him with a blanket after a car accident, work that earned him the PDSA's Gold Medal for animal bravery and a reputation as one of the most decorated dogs in the world. On the geopolitical end of the spectrum, a black Labrador named Konni spent years as one of Vladimir Putin's most photographed companions, turning up at more than one head-of-state meeting entirely unbothered by the cameras. Between Marley's chaos and Endal's competence sits most of the breed's actual reputation: a dog capable of either, usually somewhere in between.</p>`,
    relatedBreeds: [
      { slug: 'labradoodle', name: 'Labradoodle' },
      { slug: 'chocolate-lab', name: 'Chocolate Lab' },
      { slug: 'golden-retriever', name: 'Golden Retriever' },
      { slug: 'australian-labradoodle', name: 'Australian Labradoodle' },
      { slug: 'poodle', name: 'Poodle' },
    ],
    breedTagName: 'Labrador Retriever',
  },

  'siberian-husky': {
    name: 'Siberian Husky',
    headKeyword: 'Siberian Husky',
    metaDescription: "The Siberian Husky: bred by the Chukchi of northeastern Siberia to run a team, not take an order. A field guide to the breed behind Balto and the Iditarod, with stage notes.",
    facts: {
      'Group': 'Working',
      'Size': 'Males 21–23½ in, 45–60 lb · Females 20–22 in, 35–50 lb',
      'Temperament': 'Friendly, outgoing, mischievous, independent, high-energy',
      'Life expectancy': '12–14 years',
      'Coat': 'Thick double coat; sheds constantly, "blows" the undercoat completely twice a year',
      'Colors': 'Black & white, red & white, grey & white, sable, pure white, agouti — often with a dark facial mask; eyes brown, blue, or one of each',
      'AKC recognized': 'Yes — 1930, Working Group',
      'Origin': 'Siberia, bred over centuries by the Chukchi people; imported to Nome, Alaska in 1908',
    },
    lede: `Ask a Siberian Husky to sit and it will treat the request as an opening bid, not an instruction — the Chukchi people of northeastern Siberia spent centuries breeding a dog that could run all day beside a human partner, not one that would leap to obey a human boss, and the distinction has survived the trip intact. A Russian fur trader imported the first nine Siberians to Nome, Alaska in 1908, hoping their speed would win him sled-race prize money. It did. Within two decades the breed had gone from regional curiosity to national legend, on the strength of one extraordinary winter relay through a diphtheria outbreak that every Husky owner can still recite from memory.`,
    spotlightHeading: 'Why we love the Siberian Husky on stage',
    spotlight: `<p>The first thing the chat notices about a Siberian Husky is rarely the coat — it's the eyes. Huskies are one of the few breeds that regularly show brilliant blue eyes, and a striking number carry one blue eye and one brown, a trait called heterochromia that reads, under studio lighting, like a special effect nobody arranged on purpose. Viewers who have never met a Husky in person spend the first several seconds simply staring back.</p>
<p>What happens next is the personality. A Husky presented with an audience does not perform so much as negotiate. It will make its own assessment of the situation — is this stage worth the effort, is that far corner more interesting, would a full-volume opinion improve matters — and act accordingly. When it does object, it rarely barks; Huskies "talk," a rising, warbling almost-word that sounds uncannily like a complaint being lodged in a language just short of English.</p>
<p>Underneath the theatre is a dog built to run in a team, and it shows even standing still: a Husky on our stage keeps checking who else is in the frame, the way a teammate checks a lineup rather than the way a pet checks for approval. There is also, reliably, a moment of pure escapology — a Husky testing the edges of the set, the doorway, the cable run, anything that looks like an exit — because three thousand years of breeding never quite got around to installing a respect for boundaries. Bone counts run hot and fast for the eyes, then stay hot for the sheer unpredictability of what the dog decides to do next.</p>`,
    ownerFitHeading: 'Is a Siberian Husky right for you?',
    ownerFit: `<p>Gorgeous, brilliant, and one of the most-surrendered breeds in America for reasons that are entirely predictable if you read the fine print first.</p>
<p><strong>Energy and exercise.</strong> Huskies were bred to pull a sled for hours across genuine distance, and a walk around the block does not begin to touch that inheritance. Plan on real daily exercise — running, hiking, or proper working activities — or expect the dog to invent its own outlet, usually a hole in your fence.</p>
<p><strong>The escape-artist reputation is earned, not exaggerated.</strong> Huskies jump fences, dig under them, and slip leashes with a determination that has surprised a great many confident first-time owners. A secure, tall enclosure with a buried bottom edge is not optional, and recall off-leash is never guaranteed once something interesting moves.</p>
<p><strong>Prey drive.</strong> Bred in part to hunt as well as haul, many Huskies chase small animals with real seriousness. Cats and small dogs need slow, careful introductions; wildlife encounters off-leash need real caution.</p>
<p><strong>Independence and training.</strong> Huskies are intelligent and famously unbothered by your preferences. They understand a command and then decide, visibly, whether it's worth their while. Obedience is achievable with patience and consistency; blind obedience is not on offer.</p>
<p><strong>Shedding and climate.</strong> The coat sheds year-round and "blows" completely, in dramatic quantity, twice a year — brushing several times a week is the minimum, daily during a blowout. Built for Siberian winters, Huskies tolerate cold beautifully and heat poorly; shade, water, and common sense are mandatory once the temperature climbs.</p>
<p><strong>Social needs.</strong> Bred to work in a team, Huskies do not thrive as a dog left alone all day in a backyard. They tend to bond to the whole household rather than a single person, get along well with other dogs when properly introduced, and are prone to separation-related howling and destruction if left isolated for long stretches — a second dog or a genuinely present household solves more Husky behavior problems than any training class.</p>
<p><strong>Health.</strong> Generally a robust, long-lived working breed. Hip dysplasia and inherited eye conditions — progressive retinal atrophy and juvenile cataracts among them — are the main concerns; ask any breeder for hip and eye clearances on both parents before you commit.</p>
<p><strong>The verdict:</strong> a spectacular, whip-smart companion for an active owner with serious fencing and a sense of humor about being out-argued — and a hard pass for anyone drawn in by the wolf-blue eyes alone.</p>`,
    famousHeading: 'Famous Siberian Huskies',
    famous: `<p>Every Husky's fame traces back, one way or another, to the winter of 1925. When diphtheria threatened Nome, Alaska, twenty sled-dog teams relayed antitoxin serum 674 miles across the Iditarod Trail in brutal cold. Balto, a black Siberian Husky bred and driven by Leonhard Seppala's rival musher Gunnar Kaasen, led the final and most celebrated leg — he was cast in bronze in New York's Central Park within the year, and the statue remains one of the park's most-visited. (Seppala's own lead dog on the run's hardest, most dangerous stretch was Togo, whose distinctive coat coloring gets its own telling on our Agouti Husky page — the two dogs, and the two fandoms, have been arguing about who deserves more credit for a century.)</p>
<p>The breed's screen career has stayed close to its working roots. Disney's 2006 family adventure "Eight Below" cast six Siberian Huskies alongside two Alaskan Malamutes as sled dogs stranded in Antarctica, leaning on the same stamina and pack loyalty that got the 1925 serum through. The Iditarod itself, first run in 1973 in tribute to that relay, keeps the Husky's working legend a live, televised event every March rather than a museum piece.</p>`,
    relatedBreeds: [
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'agouti-husky', name: 'Agouti Husky' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'giant-schnauzer', name: 'Giant Schnauzer' },
      { slug: 'alaskan-malamute', name: 'Alaskan Malamute' },
    ],
    breedTagName: 'Siberian Husky',
  },

  dachshund: {
    name: 'Dachshund',
    headKeyword: 'Dachshund',
    metaDescription: "The Dachshund: a badger-hunting hound with a written breed standard dating to 1879, still shaped exactly like a bad idea that turned out to work. A field guide, with stage notes.",
    facts: {
      'Group': 'Hound',
      'Size': 'Standard 16–32 lb, ~8–9 in at shoulder (Miniature is 11 lb and under — see our Mini Dachshund page)',
      'Temperament': 'Clever, bold, stubborn, devoted, vocal',
      'Life expectancy': '12–16 years',
      'Coat': 'Three types — smooth, longhaired, wirehaired',
      'Colors': 'Red, black & tan, cream, chocolate, dapple, piebald, brindle',
      'AKC recognized': 'Yes — breed standard written 1879; first AKC registration 1885',
      'Origin': "Germany — bred to hunt badgers underground (\"Dachs\" = badger, \"Hund\" = dog)",
    },
    lede: `In 1879, German breed clubs sat down and wrote out, in exacting technical language, the specifications for a dog built to follow a badger into its own tunnel and win the ensuing argument: short legs for the dig, a barrel chest for leverage, a nose built for tracking, and enough raw nerve to finish the job underground and out of sight of any human who might help. The American Kennel Club registered its first Dachshund six years later, in 1885, and the design has not needed revising since. This page covers the full-size Standard Dachshund — for the under-eleven-pound Miniature version of the same blueprint, see our Mini Dachshund page.`,
    spotlightHeading: 'Why we love the Dachshund on stage',
    spotlight: `<p>A Standard Dachshund carries real weight behind that low-slung shape — up to thirty-two pounds of genuine hunting hound, not a lapdog scaled down for effect — and it shows the moment one crosses our stage nose-first. This is a scent hound before it is anything else, and a Dachshund that catches an interesting trail across the studio floor will follow it with total, oblivious commitment, audience be damned.</p>
<p>The voice is the other giveaway. Dachshunds don't so much bark as bay — a deep, surprisingly loud, almost hound-dog howl built to carry across a field and down a tunnel, wildly out of proportion to the body producing it. The first time a Dachshund lets one rip mid-broadcast, the chat reliably asks whether a much larger dog has wandered in off-camera.</p>
<p>Then there's the bearing. A Dachshund holds itself like a dog that has never once considered its own size a limitation, because for two centuries of German breed history, it wasn't one. The three coats add their own variety act — a smooth-coated Dachshund moves like a small seal, a longhaired one trails ear feathering that seems designed for slow motion, and a wirehaired one arrives already looking like it has opinions about the weather. Viewers who arrive expecting a novelty leave having watched something closer to a small, extremely confident badger-hunting specialist clock in for work.</p>`,
    ownerFitHeading: 'Is a Dachshund right for you?',
    ownerFit: `<p>Charming, characterful, and built around one serious structural caveat that has to come first, before temperament or grooming or anything else.</p>
<p><strong>The back.</strong> That long spine is the breed's defining vulnerability. The DachsLife 2015 study of the breed found roughly 19–24% of Dachshunds show clinical signs of intervertebral disc disease (IVDD) in their lifetime — with the Standard Smooth-Haired variety hit hardest of all the coat types, at nearly a quarter of dogs affected. A single bad jump off a sofa can herniate a disc. The household has to adapt for life: ramps instead of jumps, stairs minimized, careful lifting that supports chest and rear together, and strict weight control, since every extra ounce loads that same spine. This is the one fact about the breed that matters more than any other.</p>
<p><strong>Digging and prey drive.</strong> Bred to go to ground after a badger, a Dachshund left to its own devices will excavate your flowerbeds with real professional focus. A securely fenced yard and an outlet for that instinct — a dig pit, scent-work games — save the landscaping.</p>
<p><strong>Stubbornness.</strong> Dachshunds are clever and self-directed; they learn a command, then visibly weigh whether obeying it serves their interests today. Housetraining is famously slow. Patient, reward-based, consistent training wins; battles of will do not.</p>
<p><strong>Voice.</strong> A Dachshund's bay carries. Apartment neighbors will know when something interesting has happened.</p>
<p><strong>Coat upkeep.</strong> The lowest-maintenance of the three is the smooth coat — an occasional wipe-down covers it. Longhaired Dachshunds need regular brushing to keep the feathering from matting, and wirehaired ones need hand-stripping a couple of times a year to keep the coat's texture correct, which most owners outsource to a groomer who knows the breed.</p>
<p><strong>Small-dog dental and weight concerns.</strong> Like most small breeds, Dachshunds are prone to dental crowding and tartar buildup — regular brushing or dental chews matter — and because obesity is one of the single biggest controllable risk factors for triggering a back injury, keeping a Dachshund lean is not a cosmetic choice but a genuine spinal-health measure.</p>
<p><strong>The verdict:</strong> a devoted, genuinely funny, surprisingly tough little hound for an owner willing to protect that back for sixteen years and let the stubborn streak be a personality trait rather than a flaw.</p>`,
    famousHeading: 'Famous Dachshunds',
    famous: `<p>The Dachshund has the unusual distinction of being an Olympic mascot. Waldi, designed for the 1972 Munich Games by Otl Aicher, was the first official mascot in Olympic history — chosen, organizers said, because the breed's resistance, tenacity, and agility matched what an athlete needed. Munich's marathon route was even plotted, reportedly, to trace Waldi's own outline: start at the "neck," loop through the "body," finish at the "tail."</p>
<p>The shape itself has been famous on its own terms for longer. Pixar's "Toy Story" gave the toy box its own Dachshund in Slinky Dog, whose stretchable metal-coil midsection is a sight gag that only works because the breed's actual silhouette already looks like nature's version of the toy. And a century before that, the Dachshund's very German-ness briefly made it a liability: during the First World War, American owners floated "liberty pup" as a patriotic replacement name for their dogs, rather than abandon a breed anti-German sentiment had turned suspicious. The nickname never stuck. The dogs, mercifully, outlasted it, and the breed's popularity recovered fully well before the century was out — proof, if any were needed, that a good dog eventually wins the argument regardless of the politics of the moment.</p>`,
    relatedBreeds: [
      { slug: 'mini-dachshund', name: 'Mini Dachshund' },
      { slug: 'french-bulldog', name: 'French Bulldog' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'corgi', name: 'Corgi' },
    ],
    breedTagName: 'Dachshund',
  },

  aussiedoodle: {
    name: 'Aussiedoodle',
    headKeyword: 'Aussiedoodle',
    metaDescription: "The Aussiedoodle: an Australian Shepherd and a Poodle, two of the hardest-working brains in dogdom, crossed into one coat. A field guide to the breed, with stage notes.",
    facts: {
      'Group': 'Designer mix (Australian Shepherd × Poodle)',
      'Size': 'Toy under 20 lb/~14 in · Mini ~30–40 lb/~20 in · Standard up to ~75 lb/~25 in',
      'Temperament': 'Playful, energetic, highly intelligent, work-driven, eager to please',
      'Life expectancy': '10–12 years',
      'Coat': 'Straight-to-wavy through tightly curled, depending on which parent’s genes dominate',
      'Colors': 'Black, blue merle, red merle, chocolate, cream, apricot, tricolor',
      'AKC recognized': 'No — designer mix (mixed-breed dogs may compete via AKC Canine Partners)',
      'First bred': 'Late 1990s–2000s, United States — no single credited originator',
    },
    lede: `Breed two of the most naturally driven working brains in all of dogdom and you do not, strictly speaking, get relaxation. The Aussiedoodle pairs the Australian Shepherd — a ranch dog that has never once clocked out — with the Poodle, a retriever so clever it invented its own reputation for vanity. Neither parent breed believes in idle hands. The resulting puppy inherits a herding instinct with nowhere left to herd, a problem-solving mind with nothing yet to solve, and a coat that could go three different directions depending on which grandparent showed up strongest.`,
    spotlight: `<p>On stage, an Aussiedoodle rarely just sits — it patrols. Ask any regular viewer and they'll tell you: this is the dog most likely to reposition itself three times in a single segment, angling for a sightline on literally everything happening in the studio, because somewhere in its genetic code is a dog whose entire job used to be keeping track of two hundred sheep at once. A single glowing camera and a chat scrolling by is, for this breed, a mild professional underachievement.</p>
<p>The coat does the rest of the work. Depending on which grandparent's genes won out, an Aussiedoodle arrives looking like a slightly fluffier Australian Shepherd or a merle-coated Goldendoodle cousin, and either way the effect on camera is the same: a dog that looks soft enough to hug and moves like it's still being paid by a rancher. Merle Aussiedoodles in particular photograph like they were colour-graded on purpose, all marbled greys and coppers, occasionally with one ice-blue eye that the chat cannot stop mentioning.</p>
<p>Give one a bone-throw to react to and the herding brain kicks in immediately — a slight crouch, a level stare, the unmistakable posture of a dog assessing whether the bone is trying to escape. It isn't. The Aussiedoodle checks anyway. That instinct has nowhere useful to go on a stage with no sheep in it, so it gets redirected, gamely, at whichever object moves fastest — usually the bone, occasionally another dog's tail.</p>`,
    ownerFitHeading: 'Is an Aussiedoodle right for you?',
    ownerFit: `<p>The honest short version: wonderful dog, real commitment, and the commitment is bigger than the "designer lap dog" marketing sometimes implies.</p>
<p><strong>Energy.</strong> This is the single biggest misconception buyers walk in with. Even a Mini or Toy Aussiedoodle, built from a small Poodle parent, still carries a working herding dog's engine — daily exercise needs sit closer to "working dog" than "companion breed," and an under-exercised Aussiedoodle will find its own jobs, which tend to involve your furniture, your other pets, or the mail carrier. A yard and a walk are the minimum; a dog sport (agility, flyball, herding trials) is the ideal.</p>
<p><strong>Grooming.</strong> Unpredictable by design. Coat texture depends on which parent's genes came through stronger, from loosely wavy to properly curly, and it's genuinely hard to know which you'll get until the adult coat comes in. Curlier coats shed less but need daily brushing and a professional trim every six to eight weeks; looser coats shed more but need less upkeep. Budget for the higher-maintenance outcome and be pleasantly surprised if you get the easier one.</p>
<p><strong>Trainability.</strong> Very high — arguably too high. Aussiedoodles pick up commands fast and get bored just as fast, and a bored Aussiedoodle invents its own entertainment. Short, varied training sessions beat long repetitive ones.</p>
<p><strong>Health.</strong> Hip and elbow dysplasia are the main structural concerns, at roughly the rate you'd expect for a medium-to-large mixed working breed. More specific to this cross: roughly half of Aussiedoodles carry at least one copy of the MDR1 gene mutation inherited from the Australian Shepherd side, which can cause severe reactions to ivermectin and several other common medications — worth a cheek-swab test, and worth mentioning to any vet before a new prescription. Progressive retinal atrophy and patellar luxation (mainly in the smaller sizes) also turn up in some lines.</p>
<p><strong>Merle-to-merle breeding.</strong> If you're buying rather than adopting, ask whether both parents are merle. Two merle-patterned parents bred together risk "double merle" puppies with a substantially higher rate of blindness and deafness — a responsible breeder never pairs two merles.</p>
<p>Add it up and the Aussiedoodle rewards owners who wanted a working dog's brain in a slightly gentler package, and mildly punishes anyone who wanted a low-key lap dog and read "Poodle" as the whole story.</p>`,
    famousHeading: 'Famous Aussiedoodles',
    famous: `<p>The Aussiedoodle is a genuinely young breed — first crossed sometime in the late 1990s or early 2000s, with no single credited originator the way the Bernedoodle has Sherry Rupke or the Labradoodle has Wally Conron — and it has not yet produced an individual dog famous enough to have its own Wikipedia page. No film role, no royal owner, no viral rescue story that's held up to a second look. We checked; we'd tell you if there were one.</p>
<p>What the breed does have is a legitimate way onto a competitive field: since 2009, the American Kennel Club's Canine Partners program has let mixed-breed dogs like the Aussiedoodle compete in AKC agility, rally, and obedience trials and earn the very same titles a purebred does. Given an Australian Shepherd's working drive and a Poodle's competitive obedience pedigree — the breed Stanley Coren's canine-intelligence rankings put second only to the Border Collie — an Aussiedoodle that finds its way into an agility ring has a genuine shot at being good at it. The famous one, individually, just hasn't shown up yet. Given the parents involved, we wouldn't bet against it.</p>`,
    relatedBreeds: [
      { slug: 'australian-shepherd', name: 'Australian Shepherd' },
      { slug: 'poodle', name: 'Poodle' },
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'toy-aussie', name: 'Toy Aussie' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
    ],
    breedTagName: 'Aussiedoodle',
  },

  sheepadoodle: {
    name: 'Sheepadoodle',
    headKeyword: 'Sheepadoodle',
    metaDescription: "The Sheepadoodle: an Old English Sheepdog and a Poodle, crossed into one shaggy, clownish, lower-shedding companion. A field guide to the breed, with stage notes.",
    facts: {
      'Group': 'Designer mix (Old English Sheepdog × Poodle)',
      'Size': 'Mini 30–55 lb/15–20 in (Mini Poodle parent) · Standard 55–85 lb/18–24 in (Standard Poodle parent)',
      'Temperament': 'Affectionate, playful, easygoing, clownish, adaptable',
      'Life expectancy': '12–15 years',
      'Coat': 'Wavy to curly, dense, grows continuously rather than shedding out seasonally',
      'Colors': 'Black-and-white "panda" pattern most common; solid black, solid white, and merle also occur',
      'AKC recognized': 'No — designer mix',
      'First bred': 'Designer-dog boom of the 2000s; popularity took off after 2007 and again after 2017',
    },
    lede: `Every Sheepadoodle has, a couple of branches up its family tree, a dog who was famous before designer mixes were even a marketing category: the Old English Sheepdog immortalised as the shaggy "Dulux Dog" on British television since 1961. Cross that instantly recognisable mop of a herding dog with a Poodle, and you get the modern Sheepadoodle — a dog that trades some of the Sheepdog's sheer bulk of coat for a lower-shedding version of the same good-natured, clownish personality, in a body that's usually a size or two more manageable.`,
    spotlight: `<p>On stage, a Sheepadoodle's first move is usually to make itself look bigger than it is by way of hair alone — that dense, continuously-growing coat puffs out into a genuine spectacle under studio lighting, and a well-groomed "panda" Sheepadoodle, all crisp black-and-white patches, reads on camera less like a dog and more like a plush toy that unionised. Viewers regularly ask, in chat, whether it's real.</p>
<p>It is, and underneath the coat is a dog with almost no edges left. The Old English Sheepdog side was bred, historically, to herd livestock to market without losing its temper at anyone — livestock, drovers, or the odd child underfoot — and that patience survived the cross intact. Add a Poodle's quick problem-solving mind and the result is a dog that performs like it already knows the bit is funny: leaning its full, considerable weight against the nearest leg, tipping its head until the fringe parts over one eye, or flopping over mid-segment as if the whole show has simply become too pleasant to remain upright for.</p>
<p>Given a bone to chase, a Sheepadoodle rarely sprints — it lumbers, cheerfully, entirely unconcerned about dignity, and gets there anyway.</p>`,
    ownerFitHeading: 'Is a Sheepadoodle right for you?',
    ownerFit: `<p>The Sheepadoodle is one of the easier-tempered doodles on this list, but the coat is a real, recurring cost that catches new owners off guard.</p>
<p><strong>Grooming.</strong> This is the headline issue. Like a Poodle's, a Sheepadoodle's coat grows continuously rather than shedding out on a seasonal cycle, which means it doesn't self-maintain the way a Sheepdog's or a Labrador's coat does. Left alone, it mats — badly, and close to the skin, which can become painful and even require a vet visit to resolve. Budget for professional grooming every four to six weeks, brushing several times a week in between, and accept that the coat is a permanent line item in the dog's upkeep, not a one-time cost.</p>
<p><strong>Size and space.</strong> Standard Sheepadoodles (Standard Poodle parent) run up to 85 pounds — a genuinely large dog that wants floor space and a couch to occupy most of. Mini Sheepadoodles (Mini Poodle parent), at 30 to 55 pounds, suit smaller homes while keeping most of the temperament.</p>
<p><strong>Energy.</strong> Moderate, and more flexible than most doodles on this site — a Sheepadoodle is happy with a daily walk and some play rather than a job to do, reflecting the Sheepdog side's droving-dog stamina without its herding drive. This is a doodle for people who want a companion more than an athlete.</p>
<p><strong>Temperament.</strong> About as close to bombproof as the designer-dog world offers — patient with children, generally good with other pets, rarely aggressive when properly socialized. The flip side is a mild tendency toward separation anxiety; Sheepadoodles bond hard and don't love being left alone for long stretches.</p>
<p><strong>Trainability.</strong> High, and unusually forgiving of a first-time owner's mistakes. The Poodle side supplies the quick uptake; the Sheepdog side supplies the patience to sit through a repetitive session without getting bored or defensive about it. Puppy adolescence still happens — expect some selective deafness between eight and eighteen months — but a Sheepadoodle rarely turns stubborn the way a more independent working breed can.</p>
<p><strong>Health.</strong> Hip dysplasia and progressive retinal atrophy turn up in both parent breeds and can appear in the cross; the coat's insulating density also means a Sheepadoodle can overheat faster than a shorter-coated breed, so watch for that in hot weather and skip the aggressive midday exercise once summer arrives. Reputable breeders screen both parents' hips and eyes before breeding, and it's a fair question to ask before you put down a deposit.</p>
<p>If the grooming bill and the shedding-fur bill get swapped for each other, most owners consider it a fair trade for a dog this even-tempered.</p>`,
    famousHeading: 'Famous Sheepadoodles',
    famous: `<p>The Sheepadoodle's most genuinely famous representative is Bunny, a Sheepadoodle in Washington state who learned, starting as a puppy in 2020, to communicate using a board of sound-emitting buttons — words like "outside," "play," and "ouch," pressed in sequences that researchers and journalists alike have spent years arguing over. Bunny's owner, Alexis Devine, has documented the whole project since it began; the dog has since drawn coverage from outlets including Salon and ABC News, has her own Wikipedia page, and has been studied by cognitive scientists trying to work out what dogs may or may not be capable of expressing.</p>
<p>The other reliably-cited Sheepadoodle is Bayley, whose black-and-white "panda" coat and round dark eyes turned out to be an almost exact match for Snoopy — Charlie Brown's cartoon Beagle, of all things, despite the two breeds having nothing in common on paper. A single side-by-side photo comparison went viral in the early 2020s, and Bayley's own account has carried the resemblance to a real following since.</p>
<p>Further up the family tree, the coat's fame predates the cross entirely: an Old English Sheepdog has been advertising Dulux paint in the UK since 1961, which makes the Sheepadoodle's mop-topped good looks, in a sense, inherited celebrity.</p>`,
    relatedBreeds: [
      { slug: 'poodle', name: 'Poodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'saint-berdoodle', name: 'Saint Berdoodle' },
      { slug: 'old-english-sheepdog', name: 'Old English Sheepdog' },
    ],
    breedTagName: 'Sheepadoodle',
  },

  corgi: {
    name: 'Corgi',
    headKeyword: 'Corgi',
    metaDescription: "The Pembroke Welsh Corgi: a thousand-year-old cattle heeler in a comically small body, and — thanks to one very famous owner — the most photographed dog in the British monarchy. A field guide, with stage notes.",
    facts: {
      'Group': 'Herding',
      'Size': 'Up to 30 lb (dogs) · up to 28 lb (bitches) · 10–12 in at shoulder',
      'Temperament': 'Alert, affectionate, intelligent, famously stubborn',
      'Life expectancy': '12–15 years',
      'Coat': 'Medium-length double coat, straight and weather-resistant; heavy seasonal shedder',
      'Colors': 'Red, sable, fawn, or black and tan, usually with white markings',
      'AKC recognized': '1934 (as a breed distinct from the Cardigan Welsh Corgi)',
      'Origin': 'Pembrokeshire, Wales — a cattle drover’s "heeler," possibly with 12th-century Flemish-weaver dogs in the mix',
    },
    lede: `The Welsh word for corgi is usually translated as "dwarf dog," a name coined by someone who plainly never watched one work. For centuries the Pembroke Welsh Corgi earned its keep on the hill farms of Pembrokeshire by driving cattle three and four times its height — darting in low, nipping a heel, and skipping the returning kick because its whole body was built too close to the ground to catch. It is, by any reasonable measure, a comically small dog with an enormous job description. Somewhere in the twentieth century it also became, without trying especially hard, the most photographed dog in the British monarchy.`,
    spotlight: `<p>On the Dog Show stage, the Corgi's herding wiring never quite clocks off, and there is nothing on Earth for it to herd. What results is a dog that treats the whole studio as loosely under its jurisdiction — head swiveling toward every new arrival, ears rotating like a pair of independently operated satellite dishes, one paw occasionally lifted as if it is about to issue a correction to somebody's positioning. Nobody has told the Corgi that this is a livestream and not a paddock. We have decided not to be the ones who break the news.</p>
<p>Then there is the trot. A Corgi at speed does not so much run as scuttle, its comparatively enormous ears leading the way while a body built like a loaf of bread on four stubby legs does its determined best to keep up. Bone-throws set it off instantly — a full-body wiggle, a low charge, a stop-and-stare that says, quite clearly, that the bone had better not try anything.</p>
<p>The other reliable crowd reaction is the rear view. Whole corners of the internet have organized themselves around what a Corgi looks like walking away, and our chat is no exception — someone mentions "the fluff" within roughly the first ten seconds of any Corgi's segment, and mostly they are right to.</p>`,
    ownerFitHeading: 'Is a Corgi right for you?',
    ownerFit: `<p>The Corgi's compact frame invites a comparison to a lap dog that the breed does not, in any respect, deserve.</p>
<p><strong>The back is the headline issue.</strong> That short-legged, long-backed build (chondrodysplasia — the same trait that shapes a Dachshund) leaves Corgis genuinely prone to intervertebral disc disease: premature wear on the cushioning discs between vertebrae that can, in a bad case, cause sudden paralysis and require emergency surgery. A meaningful share of the breed also carries the SOD1 gene mutation behind degenerative myelopathy, a slow, painless nerve disease that usually shows up between nine and fourteen years old as a gradual loss of coordination in the back legs. Neither condition is preventable outright, but keeping a Corgi lean does measurably lower the risk — which matters, because:</p>
<p><strong>Corgis get fat easily, and fat makes the back problem worse.</strong> This is a breed with a big appetite and a body poorly designed to carry extra weight on a spine already working overtime. Measured meals rather than free-feeding, and a vet's honest opinion on body condition, are not optional extras here — they are load-bearing.</p>
<p><strong>The herding instinct doesn't know the herding is over.</strong> A Corgi with nothing to herd will often improvise, and the classic outlet is nipping at the heels of running children, joggers, or bicycles — an instinct rather than aggression, but one that needs early redirection all the same.</p>
<p><strong>Exercise.</strong> Moderate to high, and frequently underestimated because of the short legs. A Corgi wants a real daily walk plus mental work — the breed excels at herding trials, agility, and flyball for an owner willing to give it a job.</p>
<p><strong>Shedding.</strong> Considerable. That weather-resistant double coat blows out seasonally in volumes that surprise first-time owners; regular brushing is the only real defense.</p>
<p><strong>Vocal.</strong> Alert-barking is a Corgi specialty — useful in a watchdog, less useful in a thin-walled apartment.</p>
<p><strong>The verdict:</strong> a whip-smart, big-personality companion for an owner who will manage its weight, its back, and its opinions about who is allowed near the front door — and who has already made peace with the fact that a dog this small should not, by any physical logic, be this much dog.</p>`,
    famousHeading: 'Famous Corgis',
    famous: `<p>No breed on this list owes more of its modern fame to one owner. Queen Elizabeth II received her first Pembroke Welsh Corgi, Susan, as an eighteenth-birthday gift in 1944, and the attachment was immediate and lifelong — Susan reportedly travelled hidden under blankets in the honeymoon carriage when the then-Princess married Prince Philip in 1947. (Susan wasn't technically the family's first: in 1933, breeder Thelma Gray brought a litter to show the future King George VI, and the family chose a puppy named Dookie.) Over a seventy-year reign, Elizabeth II went on to own more than thirty Pembrokes, breeding many of them herself, and effectively made the Corgi a synonym for the House of Windsor.</p>
<p>That fame outlived the Queen. "The Queen's Corgi" (2019), an animated comedy loosely inspired by her dogs, followed a fictional palace Corgi named Rex on a chaotic escape through London — reviews were unkind, but the premise alone tells you how thoroughly the breed and the monarchy had merged in the public imagination.</p>
<p>More recently, the Corgi has found a second act as one of the internet's favourite subjects — "corgi butt" photography is its own durable sub-genre, and Know Your Meme named the Corgi its top meme of 2013. Not bad, for a dog whose own name translates to "dwarf."</p>`,
    relatedBreeds: [
      { slug: 'dachshund', name: 'Dachshund' },
      { slug: 'mini-dachshund', name: 'Mini Dachshund' },
      { slug: 'australian-shepherd', name: 'Australian Shepherd' },
      { slug: 'cardigan-welsh-corgi', name: 'Cardigan Welsh Corgi' },
    ],
    breedTagName: 'Corgi',
  },

  'shih-tzu': {
    name: 'Shih Tzu',
    headKeyword: 'Shih Tzu',
    metaDescription: "The Shih Tzu: bred for centuries as the exclusive property of the Chinese imperial court, now a floor-coated companion with an unbothered stage presence. A field guide, with stage notes.",
    facts: {
      'Group': 'Toy',
      'Size': '9–16 lb · 9–10½ in at shoulder (8–11 in range)',
      'Temperament': 'Affectionate, outgoing, playful, alert without being aggressive',
      'Life expectancy': '10–16 years, with many living into their late teens',
      'Coat': 'Long, dense double coat; commonly clipped short in a "puppy cut" outside the show ring',
      'Colors': 'Any color acceptable — solid, particolor, and brindle all occur',
      'AKC recognized': '1969, Toy Group',
      'Origin': 'Tibet and China — descended from small Tibetan "lion dogs," refined at the Chinese imperial court',
    },
    lede: `For most of its existence, owning a Shih Tzu outside the Forbidden City's walls could get you executed. That isn't a figure of speech about how much the breed's fans love it today — it's the documented rule under which Ming and Qing dynasty palace eunuchs bred these dogs as the exclusive property of the imperial court, descended from Tibetan "lion dogs" and refined with Pekingese and Lhasa Apso blood into the round-faced, floor-coated companion we know now. The name translates, roughly, to "lion dog." The temperament, mercifully, did not come with the same enforcement policy.`,
    spotlight: `<p>On stage, a Shih Tzu behaves like a dog that has never once doubted it belongs there — which tracks, given that its entire evolutionary history is "professional palace companion." There's no stage fright, no hesitation at the lights, just an unbothered stroll to centre-frame and a settling-in that suggests the cameras are, if anything, overdue.</p>
<p>The face does most of the work. Wide-set dark eyes, a pushed-up nose, and a coat that — properly maintained — parts clean down the middle like a small, dignified curtain: the Shih Tzu was bred for exactly this kind of close-range scrutiny, and it shows. Viewers in chat reliably narrate the underbite as "unimpressed," which is a misreading; the Shih Tzu is not unimpressed. The Shih Tzu is at work.</p>
<p>Give one a bone-throw and the response is rarely athletic — this is not a breed built for a sprint — but it's reliably enthusiastic: a determined little trot toward the reward, with the confident air of a dog collecting something it was always owed. Groomed into the full show-length coat, a Shih Tzu on stage draws the kind of gasp usually reserved for a costume reveal. Most of ours arrive in the shorter "puppy cut" instead, and lose none of the composure for it.</p>`,
    ownerFitHeading: 'Is a Shih Tzu right for you?',
    ownerFit: `<p>This is a genuinely easygoing companion breed with a short but important list of physical limitations to plan around.</p>
<p><strong>Breathing and heat.</strong> Like other short-muzzled (brachycephalic) breeds, Shih Tzus can struggle to move air efficiently, especially in heat or humidity — snoring and noisy breathing are normal, but heavy panting on a hot walk is a signal to stop, not push through. Midday exercise in summer is a bad idea for this breed specifically.</p>
<p><strong>Eyes.</strong> Those large, prominent eyes are part of the appeal and part of the risk — they're exposed to scratches, dryness, and in serious cases proptosis (the eye bulging out of the socket under trauma). Keep the face fur trimmed back from the eyes and don't let rough play near the face go unsupervised.</p>
<p><strong>Grooming is not optional.</strong> The full coat mats close to the skin within days if left unbrushed, and a badly matted coat is a genuine welfare problem, not just a cosmetic one. Most owners either commit to daily brushing and keep the show coat, or clip it short in a "puppy cut" and brush less — either is fine; doing neither is not.</p>
<p><strong>Dental crowding.</strong> That compact skull leaves little room for a full set of teeth, and dental disease is close to universal without regular brushing and professional cleanings.</p>
<p><strong>Tear staining.</strong> Lighter-coated Shih Tzus in particular show every mark below the eyes, and the breed runs prominent enough eyes to produce plenty of them. Daily gentle wiping keeps the reddish-brown staining manageable; skipping it for a few weeks does not.</p>
<p><strong>Small-dog fragility.</strong> At well under twenty pounds, a Shih Tzu can be seriously hurt by a fall, a slammed door, or an overeager larger dog or toddler. Supervise closely around small children.</p>
<p><strong>Energy and training.</strong> Low-to-moderate exercise needs and a genuinely easygoing temperament make this a good fit for apartment living and first-time owners, though the same independence that made it a self-possessed palace dog for centuries can show up at training time as a mild stubborn streak. Patience and short sessions beat repetition.</p>
<p><strong>The verdict:</strong> an affectionate, adaptable companion for someone willing to manage a face built more for a portrait than a marathon — and to treat the grooming and the breathing both as real, ongoing commitments rather than afterthoughts.</p>`,
    famousHeading: 'Famous Shih Tzus',
    famous: `<p>The breed's fame starts in the Forbidden City rather than in front of a camera. Under the Ming and Qing dynasties, small "lion dogs" descended from Tibetan temple dogs — reportedly gifts from the Dalai Lama — were bred by palace eunuchs as the exclusive property of the Chinese imperial court; the dogs rarely left the palace grounds, and for long stretches an ordinary person caught owning one risked execution. It is, by a wide margin, the most severe protection any dog breed on this site has ever enjoyed.</p>
<p>Modern fame is gentler. In Christopher Guest's mockumentary "Best in Show" (2000), the Shih Tzu Miss Agnes — doted on by an especially fussy pair of owners — is one of the film's most memorable entrants, a gentle parody of exactly the kind of pampered small-dog handling real shows are full of. A more literal brush with stardom came via Bonny, a rescue Shih Tzu adopted just weeks before filming and cast in Martin McDonagh's "Seven Psychopaths" (2012), where her character's kidnapping drives the entire plot — Bonny worked alongside Christopher Walken, Sam Rockwell, and Colin Farrell after only five weeks of training. Off-screen, Mariah Carey has kept two Shih Tzus, Bing and Bong, for years — proof the breed's talent for looking thoroughly unbothered by fame translates just fine to real life.</p>`,
    relatedBreeds: [
      { slug: 'maltese', name: 'Maltese' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'lhasa-apso', name: 'Lhasa Apso' },
      { slug: 'pekingese', name: 'Pekingese' },
      { slug: 'yorkshire-terrier', name: 'Yorkshire Terrier' },
    ],
    breedTagName: 'Shih Tzu',
  },
  'yorkshire-terrier': {
    name: 'Yorkshire Terrier',
    headKeyword: 'Yorkshire Terrier',
    metaDescription: "The Yorkshire Terrier: bred to hunt rats in Yorkshire mill floors, groomed since Audrey Hepburn into a silk-coated lap icon. A field guide to the Yorkie, with stage notes.",
    facts: {
      'Group': 'Toy',
      'Size': 'Up to 7 lb · about 8 in at shoulder',
      'Temperament': 'Bold, affectionate, alert, feisty for its size',
      'Life expectancy': '11–15 years',
      'Coat': 'Long, straight, silky, low-shedding; often clipped short as a "puppy cut"',
      'Colors': 'Blue and tan (classic), also black and tan, black and gold, blue and gold',
      'AKC recognized': '1885, Toy Group',
      'Origin': 'Yorkshire, England — a mill-and-mine ratter bred down from working terriers',
    },
    lede: `Nobody set out to design a lap dog. The Yorkshire Terrier's ancestors were working terriers, brought north by Scottish mill workers in the mid-1800s and crossed with local Yorkshire breeds for one job only: going down a hole after a rat and coming back out having won. A dog named Huddersfield Ben, whelped in 1865, is the one modern breeders point to as the template — he never herded, never guarded, and never met a rat he respected — and from him came the long silky coat and compact, confident frame the breed carries today. The mills are gone. The confidence never left.`,
    spotlightHeading: 'Why we love the Yorkshire Terrier on stage',
    spotlight: `<p>A Yorkie does not appear to have received the memo about its own size. On the Dog Show stage it squares up to the whole operation — lights, cameras, a chat scrolling past at a rate no seven-pound animal should be expected to track — with the flat, unbothered confidence of a much larger dog that simply hasn't checked a mirror lately. This is not bravado. This is a terrier doing what terriers do, which is assume the room needs managing and getting on with it.</p>
<p>The coat helps the case enormously. Properly grown out, a Yorkshire Terrier's fall is straight, silky, and parts clean down the spine like something out of a shampoo advertisement it never auditioned for — and under stage lighting it does genuinely gleam. Most of ours arrive in a shorter, more practical trim, and lose none of the swagger for it; the walk stays the same either way, a brisk, high-stepping little strut that suggests somewhere there is a runway this dog is late for.</p>
<p>Throw a bone and the Yorkie's terrier wiring switches on instantly — a full charge, a decisive pounce, and a triumphant little shake of the head as if the bone had, at some point, needed correcting. Our chat reliably calls this "unbothered main character energy," and for once chat has undersold it.</p>`,
    ownerFitHeading: 'Is a Yorkshire Terrier right for you?',
    ownerFit: `<p>The Yorkshire Terrier is a genuinely portable, adaptable companion with a real terrier underneath the ribbon, and a specific list of small-dog fragilities to plan around.</p>
<p><strong>Fragility.</strong> At well under ten pounds, a Yorkie can be seriously injured by a fall from a couch, a slammed door, a rough toddler, or a larger dog that doesn't know its own strength. This is a supervise-around-small-children breed, not a hand-it-to-the-kids breed.</p>
<p><strong>Joints.</strong> Patellar luxation — a kneecap that slips out of its groove — is the single most common orthopedic finding in the breed, showing up as an occasional skip or hop mid-stride. Mild grades often need no treatment; a vet check confirms which grade you're dealing with.</p>
<p><strong>Breathing and the trachea.</strong> Toy-breed windpipes can weaken over time, producing a dry, honking cough, especially under excitement or on a leash pulling against the throat. A harness instead of a collar is the standard fix, not a suggestion.</p>
<p><strong>Blood sugar, especially in puppies.</strong> Yorkie puppies carry so little body fat that a skipped meal or a burst of excited play can drop their blood sugar fast, causing weakness or, in serious cases, seizures. Regular small meals matter more here than in most breeds; adults grow out of the worst of it.</p>
<p><strong>Liver shunt.</strong> A minority of Yorkies are born with a vascular shortcut that lets blood bypass the liver's filtering job — worth knowing about if a puppy is failing to thrive or gain weight normally, and a reason to buy from a breeder who screens for it.</p>
<p><strong>Teeth.</strong> That compact toy-breed jaw crowds a full set of adult teeth into very little space, and dental disease is close to universal without brushing and regular professional cleanings.</p>
<p><strong>Grooming and temperament.</strong> The full show coat is a genuine daily-brushing commitment; most pet owners clip it short instead and are much happier for it. Underneath the coat is a real terrier — alert, a touch stubborn, prone to announcing visitors at volume — which suits an owner who wanted a dog with actual opinions, not a decorative accessory that happens to breathe.</p>
<p><strong>Exercise and apartment life.</strong> A short daily walk plus some indoor play covers most of a Yorkie's physical needs, which makes the breed a genuinely good fit for apartment or city living. Do not mistake "low exercise needs" for "low maintenance," though — a bored, under-stimulated Yorkie will find its own entertainment, and a determined seven-pound terrier's idea of entertainment is not always compatible with your furniture.</p>
<p><strong>The verdict:</strong> a bold, adaptable, apartment-friendly companion for someone willing to treat "small" as a structural fact requiring care, not a marketing detail.</p>`,
    famousHeading: 'Famous Yorkshire Terriers',
    famous: `<p>The breed's most decorated resident is Smoky, a four-pound Yorkie found in an abandoned foxhole in the New Guinea jungle in 1944 and adopted by American Corporal William Wynne. Smoky survived twelve combat missions and more than 150 air raids, helped run a telegraph wire through a 70-foot pipe under an airbase runway — a job that would otherwise have taken days of digging under fire — and is credited as the first documented therapy dog on record, visiting wounded soldiers in hospital wards for the rest of the war. She is also widely credited with reviving American interest in a breed that had, until then, stayed a niche English curiosity.</p>
<p>Peacetime fame arrived courtesy of Audrey Hepburn, whose Yorkshire Terrier Mr. Famous appeared alongside her in a scene in "Funny Face" (1957) and rode in the bicycle basket between takes with a bow in his hair. Hepburn is widely credited with starting Hollywood's small-dog-as-fashion-statement habit, and Mr. Famous — later succeeded by a second Yorkie, Assam of Assam, after Mr. Famous was fatally struck by a car — was where that habit began. Small wonder the breed has stayed a red-carpet fixture ever since.</p>`,
    relatedBreeds: [
      { slug: 'maltese', name: 'Maltese' },
      { slug: 'shih-tzu', name: 'Shih Tzu' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'pomeranian', name: 'Pomeranian' },
      { slug: 'teacup-yorkie', name: 'Teacup Yorkie' },
    ],
    breedTagName: 'Yorkshire Terrier',
  },
  pomeranian: {
    name: 'Pomeranian',
    headKeyword: 'Pomeranian',
    metaDescription: "The Pomeranian: a 30-pound sled dog, shrunk by royal decree into a five-pound cloud of opinions. A field guide to the Pom, with stage notes.",
    facts: {
      'Group': 'Toy',
      'Size': '3–7 lb (4–6 lb ideal) · 6–7 in at shoulder',
      'Temperament': 'Lively, bold, extroverted, alert, intelligent',
      'Life expectancy': '12–16 years',
      'Coat': 'Thick double coat with a fluffy standoff outer layer and soft undercoat',
      'Colors': 'Orange, red, cream, black, blue, sable, and more — one of the widest color ranges of any breed',
      'AKC recognized': '1900, Toy Group',
      'Origin': 'Pomerania (modern Poland/Germany) — descended from larger Spitz-type sledding and herding dogs',
    },
    lede: `The Pomeranian's ancestors pulled sleds and herded sheep at something like thirty pounds — a working Spitz dog built for cold weather and long hours, not a lap. Queen Victoria changed that math. After falling for a small red sable Pomeranian on a trip to Italy in 1888, she spent the rest of her reign breeding the line down, and by some estimates halved the breed's size within a few decades of royal enthusiasm. What survived the shrinking was, improbably, the entire original personality — the Pomeranian still carries itself like a sled dog that simply hasn't been informed of its own dimensions.`,
    spotlightHeading: 'Why we love the Pomeranian on stage',
    spotlight: `<p>A Pomeranian arrives on the Dog Show stage looking, structurally, like a dandelion that has been given legs and opinions. The famous standoff coat — a soft dense undercoat with a longer, fluffier outer layer standing straight out from the body — catches stage light in a way that makes even a five-pound dog read as a genuine presence, and the breed knows it. Poms do not slink onto a stage. Poms arrive.</p>
<p>The tail is doing most of the showmanship. Carried flat and plumed over the back like a fox's, it is in near-constant motion, punctuating every head-tilt and bark with an extra flourish nobody asked for and everybody enjoys. And the bark itself is a whole personality — a small, sharp, confident sound that a Pomeranian will deploy at a passing shadow, a new arrival in chat, or simply the general injustice of not currently holding the floor.</p>
<p>Bone-throws produce a full-body pounce disproportionate to the dog's actual mass, followed by a triumphant little strut back to center stage that says, unmistakably, this was never in doubt. Our chat has taken to calling this "unearned confidence," which is both accurate and, for a Pomeranian, exactly the point.</p>`,
    ownerFitHeading: 'Is a Pomeranian right for you?',
    ownerFit: `<p>The Pomeranian is a genuinely big personality in a genuinely small body, and the size is the part that needs real planning.</p>
<p><strong>Joints.</strong> Luxating patella — a kneecap that slips its groove — is the breed's most common orthopedic issue, graded 1 through 4 by severity; mild cases show only an occasional skip mid-stride, while advanced cases need surgical correction. Ask a breeder whether the parents have been checked.</p>
<p><strong>Breathing.</strong> Small toy-breed windpipes can weaken with age into tracheal collapse — a dry, honking cough that worsens with excitement or collar pressure. A harness rather than a collar is standard practice for this breed, not an optional accessory choice.</p>
<p><strong>The coat, and the coat loss.</strong> That famous double coat needs brushing several times a week to stay mat-free, and the Pomeranian is also the poster breed for alopecia X — a poorly understood, non-itchy hair-loss condition that thins the coat and darkens the exposed skin. It's cosmetic rather than dangerous, but it can be a surprise if nobody warned you it exists.</p>
<p><strong>Teeth.</strong> A compact jaw crowds a full set of adult teeth into very little space, and dental disease is close to universal without a regular brushing routine and professional cleanings.</p>
<p><strong>Fragility and temperament.</strong> At well under ten pounds, a Pomeranian can be badly hurt by a fall, a slammed door, or an over-enthusiastic child or larger dog — this is a supervise-closely breed, not a hand-to-the-toddler breed. The confident, alert temperament that makes the breed such fun also makes it a determined watchdog with a genuine bark habit; owners in thin-walled apartments should plan for that honestly rather than hope it trains out entirely.</p>
<p><strong>Exercise and training.</strong> Physical needs are modest — a short walk and some indoor play will do — which suits apartment living well. Training is a different matter: Pomeranians are intelligent enough to learn quickly and stubborn enough to decide learning isn't currently a priority. Short, consistent, reward-based sessions started early work far better than long ones started late, and a Pomeranian that isn't given a job to do will happily invent one, usually involving the doorbell.</p>
<p><strong>The verdict:</strong> an intelligent, adaptable companion for an owner who wants real personality in a portable package, and who treats the coat, the knees, and the size itself as ongoing commitments rather than a one-time cute purchase.</p>`,
    famousHeading: 'Famous Pomeranians',
    famous: `<p>Royal patronage is where the modern Pomeranian's fame starts. Queen Victoria's decades of breeding down the size — and her habit of showing her own Poms at dog shows under her own name — did more than any single event to turn a working Spitz dog into a fashionable companion breed, and Pomeranians have carried a faint whiff of royal approval ever since.</p>
<p>The breed also has an oddly specific claim on maritime history: when Titanic went down in 1912, one of the few animals to survive was Lady, a Pomeranian belonging to 24-year-old passenger Margaret Hays, who wrapped the dog in a blanket and carried her into a lifeboat — crew members apparently mistaking the bundle for an infant. Lady lived another eight years as a New York fixture, reportedly even accompanying Hays to the opera.</p>
<p>More recently, a Pomeranian named Boo became one of the internet's first bona fide dog celebrities — a Facebook page built around his teddy-bear face drew over 16 million followers, spun off children's books and plush toys, and earned him the unofficial title "World's Cutest Dog" before his death in 2019. Between a queen, a shipwreck, and a Facebook empire, it's a strange arc for a dog descended from sled-pullers — and the Pomeranian seems entirely unbothered by the whiplash.</p>`,
    relatedBreeds: [
      { slug: 'pomsky', name: 'Pomsky' },
      { slug: 'yorkshire-terrier', name: 'Yorkshire Terrier' },
      { slug: 'maltese', name: 'Maltese' },
      { slug: 'teacup-poodle', name: 'Teacup Poodle' },
      { slug: 'siberian-husky', name: 'Siberian Husky' },
    ],
    breedTagName: 'Pomeranian',
  },

  'border-collie': {
    name: 'Border Collie',
    headKeyword: 'Border Collie',
    metaDescription: "The Border Collie: the hillside herder who arrived at the dog show fifty years late, bringing a brain sharp enough to embarrass most humans and a work ethic that has never, ever clocked off. A field guide, with stage notes.",
    facts: {
      'Group': 'Herding',
      'Size': 'Males 19–22 in, 30–55 lb · Females 18–21 in, 27–45 lb',
      'Temperament': 'Intelligent, intense, eager to please, sensitive, focused, high-drive',
      'Life expectancy': '12–15 years',
      'Coat': 'Rough (medium length, feathered) or Smooth (short); both have weather-resistant double coats',
      'Colors': 'Black & white most common; also red & white, tricolor, merle, sable, and other patterns',
      'AKC recognized': 'Yes — 1995, Herding Group (previously in Miscellaneous 1955–1995)',
      'Origin': 'Scotland-England border region — bred for herding sheep over rugged hill country',
    },
    lede: `The Border Collie's arrival at the American Kennel Club dog show is one of the breed's most telling facts: it didn't happen until 1995, fourteen decades after the breed was already doing the hardest herding work in Scotland and England. The formal exclusion wasn't about aesthetics or pedigree — it was about purpose. A Border Collie on the show ring is a dog whose entire evolutionary history says it would rather be working, whose brain was built by shepherds for shepherds, and which has never, in a hundred and fifty years of breeding, pretended to want anything else. Enter a Border Collie in a dog show and you are, fundamentally, asking a genius if it minds hanging around while you attend to the paperwork.`,
    spotlight: `<p>A Border Collie arrives on the Dog Show stage with the peculiar intensity of an animal running a constant overhead calculation — the angle of the lights, the location of every viewer, what might be about to happen six seconds from now. This is not nervousness. This is a dog whose entire cognitive wiring is built to read a thousand tiny signals and execute a plan in real-time, whether or not anyone has asked it to do so.</p>
<p>The eyes are the headline. A Border Collie does not look at the camera the way a Goldendoodle looks at the camera — with warmth and a slight question mark. A Border Collie looks at the camera the way a chess grandmaster looks at the board: assessing, recalculating, wondering why you have moved your knight there when the pattern is so obvious it hurts. That stare is not unkind. It is, however, entirely focused on matters you cannot see.</p>
<p>What audiences find most striking is the motion — a Border Collie rarely walks on the stage so much as circle it, shoulders low and fluid, in a loose, controlled prowl. The whole body reads as spring-loaded, muscle distributed for instant directional change, every single limb suggesting that if somebody — anybody — ran for it in any direction, the Border Collie would be interested in intercepting them on principle. On film, this reads not as aggression but as contained brilliance: a dog running at about seventy percent of the work-intensity it was born carrying.</p>
<p>Bone counts for Border Collies run warm and steady. Viewers recognize the breed's intelligence immediately and send votes accordingly. The chat fills, reliably, with people describing their own Border Collies and what they accomplished — the agility titles, the herding trials, the genuinely impressive nonsense the dog taught itself when left unsupervised for an afternoon. An owner finally speaks and says, usually, "he never sleeps." Accurate.</p>`,
    ownerFitHeading: 'Is a Border Collie right for you?',
    ownerFit: `<p>The Border Collie is one of the most rewarding dogs alive and one of the most regretted purchases. The difference is measured in whether you read the next paragraph honestly before committing.</p>
<p><strong>This is not a dog. This is a job.</strong> Border Collies were bred for a century and a half to think independently, solve herding problems in real-time, and work for hours without a break. That wiring doesn't switch off in a suburban living room. A Border Collie without a genuine, consistent job — herding livestock, advanced obedience training, dog sport competition, serious daily structured work — becomes a destructive, anxious, obsessive problem. Not in a cute way. In a genuinely difficult, household-destabilizing way. This is not a dog you can leave in the house and trust will entertain itself. It will entertain itself, and you will not like which entertainment it invents.</p>
<p><strong>Exercise is a necessary but not sufficient solution.</strong> Border Collies need two to three hours of real activity daily — running is okay, but mental work is what they actually crave. An under-stimulated Border Collie will redirect its herding wiring onto children, other dogs, or your pet cats with an intensity that looks like aggression but is really just a nervous system that was never designed for boredom.</p>
<p><strong>They are emotionally sensitive to the point of brittleness.</strong> A Border Collie is devastated by harsh correction, deeply bonded to one or two people in the household, and prone to real anxiety if that person leaves or if the routine changes. This is not a dog for the chaotic household or the family that travels constantly.</p>
<p><strong>Intelligence is not always a gift.</strong> A Border Collie learns so fast that it often learns the wrong thing — a half-hour of leaving the back gate unsupervised teaches it how to open it, and you get one chance to manage that problem before it becomes a feature. They also know, with an accuracy that is unsettling, which rules apply to whom, and will test your consistency ruthlessly.</p>
<p><strong>Prey drive and herding instinct don't have an off switch.</strong> A Border Collie may herd children, smaller dogs, cats, or cyclists. It is not aggression; it is a genetic imperative. Early socialization and training manage it but don't eliminate it. Not every household is built to handle that.</p>
<p><strong>Trainability is nearly perfect, if you know what you're doing.</strong> The upside: a Border Collie learns complex commands faster than almost any breed on Earth. The downside: it learns them once and never forgets — including the times you accidentally trained it to do something you didn't mean to. The training relationship is a genuine partnership; the dog expects you to think as clearly as it does.</p>
<p><strong>Coat.</strong> The rough variety has feathering that mats without regular brushing; the smooth is lower-maintenance. Both shed heavily, especially seasonally. The shedding volume is disproportionate to the dog's actual size.</p>
<p><strong>Health.</strong> Hip dysplasia is the primary genetic concern — ask a breeder about the parents' hip scores. Otherwise a remarkably healthy, long-lived breed for its size.</p>
<p><strong>The honest verdict:</strong> if you are a competitive dog-sport person, an active farmer or rancher, or someone who genuinely understands what "job" means in this context, a Border Collie is one of the most capable, responsive, gratifying partners you'll ever own. If you are hoping for an intelligent dog that is also content to laze on the sofa, you do not want a Border Collie. Go look at a Poodle instead. The Border Collie's genius is not a charm to show off. It is a responsibility to meet, every single day, or the dog breaks.</p>`,
    famousHeading: 'Famous Border Collies',
    famous: `<p>Chaser — a Border Collie born April 28, 2004 and raised from puppyhood by behavioral psychologist Dr. John W. Pilley in Spartanburg, South Carolina — achieved something unprecedented in the recorded history of animal cognition. Using a process of inference and social learning, Chaser learned to identify 1,022 distinct toys by name, the largest tested memory of any non-human animal. When a toy was hidden behind a barrier and its name called out, Chaser could retrieve it correctly in approximately seven out of ten tries after even a month away from training. This wasn't learned-and-forgotten parlor tricks — it was genuine semantic understanding, verified by rigorous peer-reviewed research conducted at Emory University. Chaser died on July 23, 2019, at age 15, leaving a legacy that fundamentally changed how scientists understand canine intelligence.</p>
<p>Before Chaser, there was Rico, another Border Collie studied by the Max Planck Institute who could retrieve up to 200 objects by name and retain that knowledge for months. Rico proved Border Collies could learn by inference ("if I don't know that toy's name, and I just heard a new word, the new toy must be called that new word") — a cognitive leap previously thought unique to human children. Rico's research, published in *Science*, opened the entire field of canine cognitive study that Chaser would later dominate.</p>
<p>In entertainment, the Border Collie Fly in the 1995 film "Babe" gave audiences an unforgettable portrait of the breed as a respected, intelligent co-worker — not a pet or a service dog, but a genuine professional with her own opinions and her own code. That character captures the Border Collie's actual role in the world better than any documentary: a dog that works, thinks independently, and expects to be treated as a colleague rather than a subordinate.</p>
<p>Beyond research and film, Border Collies dominate agility competitions, obedience trials, and herding tests worldwide. The breed has simply never been remotely challenged for working titles — the competition is not between Border Collies and other breeds, it's between Border Collies and the boundaries of what's physically possible to ask a dog to do. That is the truest fame the breed has ever earned.</p>`,
    relatedBreeds: [
      { slug: 'australian-shepherd', name: 'Australian Shepherd' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'poodle', name: 'Poodle' },
    ],
    breedTagName: 'Border Collie',
  },

  beagle: {
    name: 'Beagle',
    headKeyword: 'Beagle',
    metaDescription: "The Beagle: a pack hound with a nose that outweighs its judgment, and a centuries-long track record of following scent straight through the fence. A field guide, with stage notes.",
    facts: {
      'Group': 'Hound',
      'Size': 'Two sizes — Under 13 inches / 13–15 inches; typically 18–30 lb depending on variety',
      'Temperament': 'Friendly, curious, driven, merry, intelligent, pack-oriented',
      'Life expectancy': '10–15 years',
      'Coat': 'Short, dense double coat; sheds seasonally',
      'Colors': 'Tricolor (black/white/tan), red/white, lemon/white, and variations',
      'AKC recognized': 'Yes — recognized 1885; first AKC registration was a Beagle named Blunder',
      'Scent receptors': '~220 million (humans have ~5 million)',
    },
    lede: `The Beagle is a hunting dog that hunts by principle, and principle is the thing most likely to catch it. Small enough to fit in a city apartment, it was bred to work in packs chasing rabbits and hares across the English countryside, which means it carries in its compact, sturdy frame the temperament of an animal designed for relentless pursuit and pack cooperation. It also carries the single-mindedness of a creature whose sense of smell is so overdeveloped that it has essentially outsourced decision-making to its nose, and that nose is capable of dragging the rest of the dog — and, historically, the fence, your plans, and any dinner left unattended — in whatever direction the scent highway leads.`,
    spotlight: `<p>The Beagle arrives on stage as a study in focus. Those floppy ears are not decoration — they work. The long ears dangle close to the ground, and the basal ridge where they attach acts as a scent-particle trap, funneling odor molecules directly toward the nose. On film this gives the Beagle a particular intentional look, head down, nose active, moment-to-moment utterly absorbed in whatever invisible information is available in the air. A Beagle does not perform for the camera the way a Goldendoodle performs. A Beagle investigates the camera as a source of potential information.</p>
<p>What reads on screen is a compact, sturdy dog — neither tall nor short, neither heavy nor lean, but built to last through a full day's hunt. The coat is short and easy to read; the color-pattern (the classic tricolor is most common, but the reds and lemons vary beautifully) photographs well under studio lights. The face itself is merry in a nearly impossible way — upright alert eyes, the floppy ears framing the expression, a body language that says nothing is as interesting as whatever comes next.</p>
<p>Bone counts run warm and steady. The Beagle doesn't command the instant spike a novelty breed does, but something about the whole package — the authenticity of the drive, the compact size, the obvious intelligence — keeps viewers engaged. Regulars in the chat have often met a Beagle IRL and can't stop anthropomorphizing at length.</p>`,
    ownerFitHeading: 'Is a Beagle right for you?',
    ownerFit: `<p>The Beagle is the gateway to the larger truth about hound ownership: a dog bred to track scent for miles without checking in with its handler is, functionally, a dog that does not listen to you. It is not stubbornness, exactly, and it is not stupidity — Beagles are clever creatures with better recall than many breeds — but it is an animal whose deepest drive, when activated, overrides training, the recall command, and sometimes the fence. If you are the kind of owner who can accept this and plan accordingly, a Beagle is a wonderful companion. If you are expecting a small Golden Retriever, you are about to be surprised.</p>
<p><strong>The nose is a feature and a problem.</strong> Beagles follow scent with what can only be described as religious devotion. A Beagle on a long line will spend the walk with its nose permanently in the grass, detecting, cross-referencing, and pursuing information invisible to you. This is why Beagles were used to find explosives in Iraq and Afghanistan and why the USDA employs dozens of them to detect contraband at borders. It is also why a Beagle must be on a leash or in a securely fenced yard, always, because a detected scent — a rabbit, a deer, literally anything with a smell — can overpower months of training in seconds flat.</p>
<p><strong>The ears are not cute; they're work.</strong> Those long floppy ears trap moisture and air in a dark, warm environment that fungi and bacteria find irresistible. Ear infections are common in the breed and require vigilant cleaning and prevention. A weekly ear-check and gentle cleaning, especially after swimming, is non-negotiable.</p>
<p><strong>Obesity is the silent killer.</strong> Beagles have, without exaggeration, an insatiable appetite. They are food-motivated to the point of obsession and will eat anything even remotely edible. Measured portions are not optional — many Beagles will eat twice their correct body weight if given access, and obesity compounds every other health issue the breed carries. A fat Beagle is a dog in serious pain and shortened life.</p>
<p><strong>Exercise is not optional.</strong> These are working dogs with real stamina. A short walk around the block meets nobody's needs — yours or the dog's. Plan for an hour or more of daily activity, ideally off-leash in a secure space (a fenced yard is non-negotiable given the scent-drive). A Beagle without adequate exercise becomes a household problem: destructive, escape-oriented, and convinced that your house is a hunting ground.</p>
<p><strong>Health notes.</strong> Beyond the ear infections and obesity: epilepsy (typically emerging between ages 2-5), hypothyroidism, patellar luxation, and cherry eye (treatable, usually surgically). Allergies are common and often linked to the ear infections. Choose a breeder who health-tests for epilepsy and hip dysplasia.</p>
<p><strong>They have opinions, and they express them at volume.</strong> Beagles bay — a distinctive, penetrating howl that's music to a hunter's ears and a genuine problem with close neighbors. This is not a breed that learns "quiet" because bay is genetically hardwired.</p>
<p><strong>The honest verdict:</strong> a remarkable, intelligent, genuinely affectionate companion for an owner who respects the breed's working drive, provides the exercise and boundaries it needs, and accepts that a Beagle will always, always be a dog with its own ideas about where it wants to be.</p>`,
    famousHeading: 'Famous Beagles',
    famous: `<p>Snoopy is perhaps the most famous Beagle in the world, and has been since October 4, 1950, when he debuted in Charles M. Schulz's Peanuts comic strip — an icon with staying power that outlasted the strip itself, which ran for fifty years. Schulz based Snoopy on one of his own childhood dogs, Spike, and the character evolved over decades from a literal dog sleeping on his doghouse roof to the philosophical, imaginative, occasionally delusional best friend of a depressed kid named Charlie Brown. In 2009, celebrating the American Kennel Club's 125th anniversary, Snoopy was voted the No. 1 dog in pop culture, a ranking that has likely held ever since.</p>
<p>But Snoopy's fame is cartoon fame, and real Beagles have earned their own glory on the show ring. Uno, registered as Ch. K-Run's Park Me in First, became the first Beagle ever to win Best in Show at the Westminster Kennel Club Dog Show in 2008 — a fifteen-inch specimen from Belleville, Illinois who won over a field of 2,626 competitors. Seven years later, in 2015, Miss P (Ch. Tashtins Looking for Trouble) became only the second Beagle to claim the same title, making her Uno's grand-niece and cementing the breed's place in Westminster's most prestigious honor roll.</p>
<p>The breed has never lacked for real-world prominence. President Lyndon B. Johnson kept two Beagles, Him and Her, who became minor celebrities in their own right, often photographed on the White House lawn. The modern celebrity Beagle record runs deep, from Barry Manilow's Bagel and Biscuit to countless beloved family dogs whose claims to fame are simply that they were born charming and good-natured, which is perhaps the truest measure of the breed's genuine worth.</p>`,
    relatedBreeds: [
      { slug: 'basset-hound', name: 'Basset Hound' },
      { slug: 'english-springer-spaniel', name: 'English Springer Spaniel' },
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'german-shepherd', name: 'German Shepherd' },
    ],
    breedTagName: 'Beagle',
  },

  boxer: {
    name: 'Boxer',
    headKeyword: 'Boxer',
    metaDescription: "The Boxer: a German working dog with the soul of a goofball, the build of a weight lifter, and a centuries-old talent for reading a room. A field guide, with stage notes.",
    facts: {
      'Group': 'Working',
      'Size': 'Males 22.5–25 in, ~70 lb · Females 21–23.5 in, ~60 lb',
      'Temperament': 'Affectionate, fun-loving, eager to please, playful, loyal, alert, dignified',
      'Life expectancy': '10–12 years',
      'Coat': 'Short, smooth, shiny double coat; sheds seasonally',
      'Colors': 'Fawn or brindle, always with white markings',
      'AKC recognized': 'Yes — 1904 (Non-Sporting Group 1924–1936); moved to Working Group 1936',
      'Origin': 'Munich, Germany — late 1800s, descended from the Bullenbeisser (bull-biter)',
    },
    lede: `The Boxer is what happens when you take a dog bred to bait bulls and guard monasteries, then refine it in 1880s Bavaria into something with the musculature of a boxer (hence the name) and the emotional intelligence of a golden retriever who has just realized it can tell jokes. The result is a creature that looks like it could win an actual boxing match, behaves like your most loyal friend, and will steal your dinner off the counter with the casual confidence of someone who has already decided the consequences are worth it. Boxers are, functionally, clowns in weight-lifter bodies.`,
    spotlight: `<p>The Boxer arrives on stage as a study in coiled energy barely contained by the laws of physics. That broad chest, those powerful shoulders, the muscular haunches — this is a dog built to drive, to leap, to work for hours. But the moment it enters frame, what viewers see is not menace. What they see is the mouth. The Boxer's underbite is a genetic feature of the breed — the lower jaw extends beyond the upper — and combined with the alert forward ears and intelligent eyes, it creates an expression that reads as perpetual gentle bemusement. This dog is built like a tank and convinced that whatever happens next will be charming.</p>
<p>Movement is where Boxers distinguish themselves on stage. They do not slink or circle. They move with a particular springy energy, bouncing almost, as though the ground is slightly more fun than expected. For a dog that weighs seventy pounds, there is remarkable grace — a lightness that reads as playfulness rather than nervousness. The short coat photographs beautifully; the brindle or fawn colorwork catches light in ways that solid colors cannot. When a Boxer settles and makes eye contact with the camera, the effect is immediate: alert, present, entirely undisturbed by the live audience.</p>
<p>Bone counts for Boxers run warm. There is something about the whole package — the obvious physicality combined with the visible personality, the seriousness of the build combined with the silliness of the expression — that keeps viewers engaged. The chat fills with people describing their own Boxers and their inexplicable house-training mishaps, their capacity to move five-pound objects with the deliberation of a heavyweight, their habit of sitting on your lap despite weighing as much as a small sofa. An owner speaks and usually adds, with fondness and exhaustion, "he never stops moving." Accurate.</p>`,
    ownerFitHeading: 'Is a Boxer right for you?',
    ownerFit: `<p>The Boxer is a wonderful dog and an exhausting dog. Whether it is wonderful enough to justify the exhaustion depends on your household and your tolerance for organized chaos.</p>
<p><strong>Energy is relentless.</strong> Boxers were bred to work, and that work ethic remains hardwired into the modern breed. This is not a dog that is satisfied with a walk around the block. A young Boxer — and they stay juvenile in temperament well into their third year — needs serious daily activity: running, play sessions, ideally some kind of structured activity or training. An under-stimulated Boxer becomes a creative problem-solver, and Boxer creativity tends to express itself as counter-surfing, furniture destruction, and the inexplicable moving of small objects from one room to another for reasons no human will ever understand.</p>
<p><strong>Health is the honest conversation.</strong> Boxers face three serious genetic concerns that every prospective owner must understand: Cancer is the most common cause of death in the breed, accounting for roughly 14% of all disorders and a significant cause of mortality. Boxer cardiomyopathy — an inherited heart condition that causes irregular heartbeat — affects approximately 48% of the breed according to breed-club health surveys, though not all carriers develop clinical symptoms. Hip dysplasia affects about 25% of the breed. Any Boxer owner must commit to regular veterinary screening and accept that the breed's lifespan is genuinely shorter than many others of similar size. Choose a breeder who screens parents for all three conditions and provides health certifications.</p>
<p><strong>Breathing issues are real.</strong> Boxers are a brachycephalic (flat-faced) breed. They are prone to overheating, breathing difficulty in heat or humidity, and exercise intolerance in high temperatures. This is not cosmetic — it is a structural concern that shortens many Boxers' active years and can cause genuine distress. Air conditioning and careful management of exercise during warm weather are non-negotiable.</p>
<p><strong>They are emotionally intelligent and emotionally needy.</strong> Boxers bond intensely to their families and do not handle isolation or change gracefully. A Boxer left alone for eight hours regularly may develop separation anxiety, destructiveness, or behavioral problems. This is a dog that needs to be part of the household, not relegated to a backyard or left crated for long periods.</p>
<p><strong>Trainability is excellent, with patience.</strong> Boxers are intelligent and eager to please, which makes them highly trainable — but they also retain adolescence-level stubbornness well into their third year. Early socialization and consistent training yield a well-mannered, responsive companion. Without it, you get a large, enthusiastic dog with very few manners.</p>
<p><strong>Coat maintenance is minimal.</strong> Short and smooth, the Boxer coat requires no grooming beyond regular brushing to manage seasonal shedding. This is one area where the breed is genuinely low-maintenance.</p>
<p><strong>The honest verdict:</strong> if you have the space, the time for daily exercise, the financial capacity to manage potential health emergencies, and the emotional availability to provide a Boxer the companionship it craves, you will have one of the most rewarding, entertaining, and genuinely loyal dogs in your life. If any of those conditions are not met, choose a different breed. A bored, isolated, or under-exercised Boxer is a genuine household problem.</p>`,
    famousHeading: 'Famous Boxers',
    famous: `<p>The Boxer has had an unusual relationship with fame. Decades before Boxers appeared in major films or claimed celebrity ownership, they were already proving themselves in the ring — the show ring, that is. Ch. Arriba's Prima Donna, nicknamed "Suzie," won Best in Show at the Westminster Kennel Club Dog Show in 1970, a record that still stands as the only female Boxer to ever claim the title. The judge, seeing Suzie in the ring, described her as "elegance personified." That single victory cemented the Boxer as one of the most successful breeds in Westminster history — only a handful of breeds have more Best in Show wins than the four claimed by Boxers.</p>
<p>In entertainment, Boxers have had a modest but respectable presence. The movie Good Boy! featured a Boxer named Wilson, and the breed has appeared in various television shows and commercials over the decades. But Boxer fame is not primarily a matter of film — it is a matter of household presence. Hugh Jackman, Ryan Reynolds, Cameron Diaz, Jessica Biel, and Justin Timberlake have all owned Boxers. Kim Kardashian has owned multiple Boxers. The breed carried the classic-film royalty cache of Humphrey Bogart and Lauren Bacall, who were so devoted to the breed that they owned three: George, Harvey, and Baby.</p>
<p>In recent years, Boxers have found a particular niche on social media. Boxer videos on TikTok rack up millions of views not because of tricks or dramatic moments, but because Boxers are, fundamentally, funny dogs. Videos of Boxers demanding attention from owners on phone calls, Boxers greeting neighbors with enthusiasm, Boxers confused by their own reflections — these go viral because the breed's physical presence combined with its emotional transparency creates a kind of comedy that needs no narration. A Boxer being a Boxer is enough. That authenticity has made the breed something of a social-media favorite among dog owners who value personality over spectacle.</p>`,
    relatedBreeds: [
      { slug: 'german-shepherd', name: 'German Shepherd' },
      { slug: 'cane-corso', name: 'Cane Corso' },
      { slug: 'belgian-malinois', name: 'Belgian Malinois' },
      { slug: 'labrador-retriever', name: 'Labrador Retriever' },
      { slug: 'american-bully', name: 'American Bully' },
    ],
    breedTagName: 'Boxer',
  },
};

const STYLES = `
@font-face{font-family:'Yang Bagus';src:url('/YangBagus.ttf') format('truetype');font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#f7f2e9;--bg-card:#ffffff;--bg-card-2:#fbf7ef;--accent:#5b46d6;--purple:#5b46d6;--text:#2a2150;--dim:rgba(42,33,80,0.75);--gold:#806104;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;line-height:1.6;}
a{color: var(--accent-text, #7a5a14);}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px;}
.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--purple);margin-bottom:8px;}
.eyebrow a{color:var(--purple);text-decoration:none;}
h1.breed-h1{font-family:'Yang Bagus',serif;color:#2a2150;font-size:44px;line-height:1.05;margin-bottom:16px;}
.lede{font-size:17px;color:rgba(42,33,80,0.92);margin-bottom:36px;}
.lede em{color:var(--text);font-style:italic;}
/* Breed hero image (top of page). Aspect-ratio reserves space → no layout shift. */
.breed-hero-fig{margin:0 0 28px;}
.breed-hero{display:block;position:relative;margin:0 0 28px;border-radius:14px;overflow:hidden;border:1px solid rgba(42,33,80,0.14);background:var(--bg-card);text-decoration:none;}
.breed-hero-fig .breed-hero{margin:0;}
.breed-hero img{width:100%;aspect-ratio:1/1;max-height:560px;object-fit:contain;background:#f2ead9;display:block;}
.breed-hero-cap{position:absolute;left:0;right:0;bottom:0;padding:24px 16px 12px;font-size:13px;color:#fff;background:linear-gradient(to top,rgba(10,6,23,0.88),rgba(10,6,23,0));}
.breed-hero-cap .nm{font-weight:700;color: var(--accent-text, #7a5a14);}
.breed-hero-credit{font-size:11px;color:var(--dim);padding:6px 2px 0;}
.breed-hero-credit a{color:var(--purple);}
.breed-hero-empty{display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(91,70,214,0.18),rgba(185,138,47,0.12));}
.breed-hero-empty-inner{font-family:'Yang Bagus',serif;color: var(--accent-text, #7a5a14);font-size:24px;line-height:1.15;text-align:center;padding:24px;}
.section{margin:36px 0;}
.section h2{font-family:'Yang Bagus',serif;color: #2a2150;font-size:26px;margin-bottom:14px;}
.section h3{font-size:16px;color:var(--text);margin:20px 0 8px;font-weight:600;}
.section p{font-size:15px;color:rgba(42,33,80,0.92);margin-bottom:12px;}
.section p strong{color:var(--text);}
/* Live show widget — always populated, no PartyKit dependency at render-time */
.live-widget{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(185,138,47,0.10),rgba(91,70,214,0.10));border:1px solid rgba(185,138,47,0.25);border-radius:12px;padding:14px 16px;margin:28px 0;}
.live-pip{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(185,138,47,0.7);animation:pulse 1.6s ease-out infinite;flex:0 0 auto;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(185,138,47,0.7);}70%{box-shadow:0 0 0 12px rgba(185,138,47,0);}100%{box-shadow:0 0 0 0 rgba(185,138,47,0);}}
.live-text{flex:1;font-size:14px;color:rgba(42,33,80,0.92);}
.live-text strong{color: var(--accent-text, #7a5a14);font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;display:block;margin-bottom:2px;}
.live-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;white-space:nowrap;}
/* Facts table */
.facts{background:var(--bg-card);border:1px solid rgba(42,33,80,0.11);border-radius:12px;padding:18px;margin:28px 0;}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;font-size:14px;}
.facts dt{color:var(--purple);font-weight:600;}
.facts dd{color:rgba(42,33,80,0.92);}
/* CTA */
.cta-block{text-align:center;background:linear-gradient(135deg,rgba(91,70,214,0.10),rgba(185,138,47,0.05));border:1px solid rgba(91,70,214,0.25);border-radius:12px;padding:28px 22px;margin:36px 0;}
.cta-block h2{font-family:'Yang Bagus',serif;color:var(--text);font-size:24px;margin-bottom:8px;}
.cta-block p{font-size:14px;color:rgba(42,33,80,0.92);margin-bottom:16px;}
.cta-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;}
.cta-btn-sub{font-size:12px;color:var(--dim);margin-top:10px;}
.cta-secondary{font-size:13px;color:var(--dim);margin:16px 0 0;}
.cta-secondary a{color: var(--accent-text, #7a5a14);text-decoration:none;font-weight:600;}
/* Free "watch" button at the foot of the show-bridge section */
.spotlight-watch{margin-top:6px;}
/* User dogs grid (bonus, hidden when N=0) */
.user-dogs{margin:36px 0;}
.user-dogs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px;}
.user-dog-card{background:var(--bg-card);border:1px solid rgba(42,33,80,0.11);border-radius:10px;padding:0;text-decoration:none;color:var(--text);overflow:hidden;display:block;}
.user-dog-card img{width:100%;aspect-ratio:1/1;object-fit:contain;display:block;background:var(--bg-card-2);}
.user-dog-card-name{font-size:13px;font-weight:600;padding:8px 10px 4px;}
.user-dog-card-owner{font-size:11px;color:var(--dim);padding:0 10px 10px;}
/* Related breeds */
.related-breeds{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.related-breed-chip{display:inline-block;background:var(--bg-card);border:1px solid rgba(91,70,214,0.3);border-radius:20px;padding:8px 16px;font-size:13px;text-decoration:none;color:var(--text);}
.related-breed-chip:hover{border-color:var(--purple);}
.related-breed-chip.soon{color:var(--dim);border-color:rgba(42,33,80,0.11);background:rgba(42,33,80,0.06);cursor:default;}
.related-breed-chip.soon em{font-style:normal;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--purple);margin-left:4px;}
@media(max-width:768px){
  .wrap{padding:18px 14px 40px;}
  h1.breed-h1{font-size:34px;}
  .lede{font-size:16px;}
  .facts dl{grid-template-columns:1fr;gap:4px;}
  .facts dt{margin-top:8px;}
  .live-widget{flex-direction:column;align-items:flex-start;gap:10px;}
  .live-btn{align-self:stretch;text-align:center;}
}
`;

function shell(headHtml, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${headHtml}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<script src="/consent.js" defer></script>
<script src="/analytics.js" defer></script>
<script src="/nav.js" defer></script>
<style>${STYLES}</style>
</head>
<body>
${bodyHtml}
<footer style="text-align:center;padding:26px 16px;background:#1e0f45;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px;">
    <a href="/about" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">About</a>
    <a href="/about#contact" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Contact</a>
    <a href="/dogs" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">All Dogs</a>
    <a href="/leaderboard" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Leaderboard</a>
    <a href="/privacy" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Privacy</a>
    <a href="#" data-cookie-settings style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Cookie settings</a>
    <a href="/terms" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Terms</a>
    <a href="/resources" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Guides</a>
    <a href="/breeds" style="font-size:13px;color:#b7a9e8;text-decoration:none;display:inline-block;padding:6px 2px;">Breeds</a>
  </div>
  <div style="font-size:12px;color:rgba(183,169,232,0.7);">The Dog Show &copy; 2026. All dogs are good dogs.</div>
</footer>
</body>
</html>`;
}

function sendNotFound(res, msg) {
  const head = `<title>Breed not found — The Dog Show</title><meta name="robots" content="noindex">`;
  const body = `<div class="wrap" style="text-align:center;">
<div class="eyebrow"><a href="/breeds">All breeds</a></div>
<h1 class="breed-h1">Breed not found</h1>
<p class="lede">${esc(msg)}</p>
<p style="margin-top:24px;"><a class="cta-btn" href="/breeds">Browse all breeds &rarr;</a></p>
</div>`;
  res.status(404);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(shell(head, body));
}

// Lightweight, no-throw fetch — used to optionally populate the bonus
// user-dogs section. If PartyKit is down or hasn't been deployed with the
// /dogs-by-breed endpoint yet, the section just stays hidden.
async function fetchUserDogs(breedTagName) {
  if (!breedTagName) return [];
  try {
    const url = `${PARTY}/dogs-by-breed?breed=${encodeURIComponent(breedTagName)}&limit=8`;
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) return [];
    const j = await r.json();
    if (!j || !j.ok || !Array.isArray(j.dogs)) return [];
    return j.dogs;
  } catch (e) {
    return [];
  }
}

function renderFactsHtml(facts) {
  return Object.entries(facts).map(
    ([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`
  ).join('');
}

function renderRelatedHtml(related) {
  // Only link to breeds that have a hub. Linking to non-existent slugs creates
  // dozens of internal 404s which harm crawl budget — render as plain chips
  // for the ones we haven't built yet. They're still useful as topical signal
  // (Google understands related-entity proximity in markup) without being
  // promises the user can act on.
  return related.map(r => {
    const exists = !!BREEDS[r.slug];
    if (exists) {
      return `<a class="related-breed-chip" href="/breeds/${esc(r.slug)}">${esc(r.name)}</a>`;
    }
    return `<span class="related-breed-chip soon">${esc(r.name)} <em>soon</em></span>`;
  }).join('');
}

function renderUserDogsSection(dogs, breedName) {
  if (!dogs || dogs.length === 0) return '';
  const grid = dogs.map(d => {
    const href = d.slug ? `/d/${esc(d.slug)}` : '#';
    const img = d.imageUrl ? esc(d.imageUrl) : '/og-image.png';
    const name = esc(d.dogName || 'A good dog');
    const owner = esc(d.username || 'Anonymous');
    return `<a class="user-dog-card" href="${href}">
<img src="${img}" alt="${name} — ${esc(breedName)}" loading="lazy">
<div class="user-dog-card-name">${name}</div>
<div class="user-dog-card-owner">by ${owner}</div>
</a>`;
  }).join('');
  const heading = dogs.length === 1
    ? `One ${esc(breedName)} has taken our stage`
    : `${dogs.length} ${esc(breedName)}s have taken our stage`;
  return `<div class="section user-dogs">
<h2>${heading}</h2>
<p>Real dogs from real owners. Click any to see their certificate of appearance.</p>
<div class="user-dogs-grid">${grid}</div>
<p style="margin-top:14px;font-size:13px;"><a href="/dogs.html?breed=${esc(breedName)}">See all ${esc(breedName)}s in the gallery &rarr;</a></p>
</div>`;
}

// Pick the dog to feature in the hero: highest-bones dog of this breed that
// has both a photo and a cert slug (so the hero can link to /d/{slug}); fall
// back to the highest with just a photo; null if none. userDogs is already
// sorted by totalBones desc by /dogs-by-breed.
function pickHeroDog(dogs) {
  if (!dogs || !dogs.length) return null;
  return dogs.find(d => d && d.imageUrl && d.slug)
      || dogs.find(d => d && d.imageUrl)
      || null;
}

// Hero image at the top of the page. Three states, in priority order:
//   1) A real submitted dog of this breed exists → use its photo and link to
//      its certificate page (introduces the cert feature + an internal link).
//   2) A sourced representative breed photo (breed.heroImage) → show it, with
//      optional attribution in breed.heroCredit (raw HTML, e.g. a CC byline).
//   3) Neither → a branded "be the first {breed}" prompt (no broken image),
//      which doubles as a soft conversion CTA until a photo or dog exists.
function renderHero(breed, heroDog) {
  if (heroDog && heroDog.imageUrl) {
    const name = esc(heroDog.dogName || 'This dog');
    const img = `<img src="${esc(heroDog.imageUrl)}" alt="${name}, a ${esc(breed.name)} on The Dog Show" loading="eager">`;
    if (heroDog.slug) {
      return `<a class="breed-hero" href="/d/${esc(heroDog.slug)}">
${img}
<div class="breed-hero-cap"><span class="nm">${name}</span> &mdash; a real ${esc(breed.name)} on our stage. See the certificate &rarr;</div>
</a>`;
    }
    return `<div class="breed-hero">
${img}
<div class="breed-hero-cap"><span class="nm">${name}</span> &mdash; a real ${esc(breed.name)} on our stage.</div>
</div>`;
  }
  if (breed.heroImage) {
    const alt = esc(breed.heroAlt || `${breed.name} — breed photo`);
    const credit = breed.heroCredit
      ? `<figcaption class="breed-hero-credit">${breed.heroCredit}</figcaption>` : '';
    return `<figure class="breed-hero-fig">
<div class="breed-hero"><img src="${esc(breed.heroImage)}" alt="${alt}" loading="eager"></div>
${credit}
</figure>`;
  }
  return `<a class="breed-hero breed-hero-empty" href="/?openModal=premium">
<span class="breed-hero-empty-inner">Be the first ${esc(breed.name)} on our stage &rarr;</span>
</a>`;
}

function renderBreedPage(breed, userDogs) {
  const url = `${SITE}/breeds/${esc(breed.slug)}`;
  // Until the per-breed OG generator is parameterized, fall back to the
  // sitewide brand OG image. (Plan §3 — defer to P1 polish.)
  const ogImg = `${SITE}/og-image.png`;

  // Schema.org: Article + DefinedTerm for breed attributes. There is no
  // native dog-breed type, so we follow the AKC pattern (Article + plain
  // text body) and add a structured attribute set via PropertyValue.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${breed.name} — Breed Guide & Stage Notes`,
    description: breed.metaDescription,
    image: ogImg,
    publisher: { '@type': 'Organization', name: 'The Dog Show', url: SITE },
    mainEntityOfPage: url,
    about: {
      '@type': 'Thing',
      name: breed.name,
      additionalProperty: Object.entries(breed.facts).map(([k, v]) => ({
        '@type': 'PropertyValue', name: k, value: v,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Breeds', item: `${SITE}/breeds` },
      { '@type': 'ListItem', position: 3, name: breed.name, item: url },
    ],
  };

  const head = `<title>${esc(breed.name)} — Breed Guide & Stage Notes | The Dog Show</title>
<meta name="description" content="${esc(breed.metaDescription)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(breed.name)} — The Dog Show breed guide">
<meta property="og:description" content="${esc(breed.metaDescription)}">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="The Dog Show">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(breed.name)} — The Dog Show breed guide">
<meta name="twitter:description" content="${esc(breed.metaDescription)}">
<meta name="twitter:image" content="${esc(ogImg)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`;

  // Reader-first show-bridge heading, auto-generated (replaces the old
  // company-voice "Why we love the {Breed} on stage"). See funnel note above.
  const spotlightHeading = `See ${pluralize(breed.name)} on the live show`;

  // Hero: a real submitted dog's photo (linked to its cert) when one exists,
  // else a sourced breed photo, else a branded "be the first" prompt.
  const heroDog = pickHeroDog(userDogs);

  const body = `<div class="wrap">
<div class="eyebrow"><a href="/breeds">Breeds</a> &middot; ${esc(breed.name)}</div>
<h1 class="breed-h1">${esc(breed.name)}</h1>
${renderHero(breed, heroDog)}
<div class="lede">${breed.lede}</div>

<aside class="live-widget" aria-label="The Dog Show is live now">
<span class="live-pip" aria-hidden="true"></span>
<div class="live-text"><strong>Live now</strong>Real dogs are on stage at The Dog Show right now &mdash; free to watch.</div>
<a class="live-btn" href="/show.html">Watch &rarr;</a>
</aside>

<div class="section facts">
<dl>${renderFactsHtml(breed.facts)}</dl>
</div>

<div class="section owner-fit">
<h2>${esc(breed.ownerFitHeading)}</h2>
${breed.ownerFit}
</div>

<div class="section famous">
<h2>${esc(breed.famousHeading)}</h2>
${breed.famous}
</div>

<div class="section spotlight">
<h2>${esc(spotlightHeading)}</h2>
${breed.spotlight}
<p class="spotlight-watch"><a class="live-btn" href="/show.html">Watch the show free &rarr;</a></p>
</div>

${renderUserDogsSection(userDogs, breed.name)}

<div class="cta-block">
<h2>See it live &mdash; free</h2>
<p>The Dog Show runs around the clock: real dogs, a real stage, viewers cheering them on with bones. No signup needed to watch.</p>
<a class="cta-btn" href="/show.html">Watch the show free &rarr;</a>
<p class="cta-secondary">Have a ${esc(breed.name)} of your own? <a href="/?openModal=premium">Put them on stage &rarr;</a> &middot; free to enter</p>
</div>

<div class="section related">
<h2>Related breeds</h2>
<div class="related-breeds">${renderRelatedHtml(breed.relatedBreeds)}</div>
</div>

</div>`;

  return { head, body };
}

module.exports = async function handler(req, res) {
  const slug = (req.query && req.query.slug) ? String(req.query.slug).toLowerCase() : '';
  if (!slug) return sendNotFound(res, 'No breed specified.');

  const breed = BREEDS[slug];
  if (!breed) {
    return sendNotFound(res, "We don't have a page for that breed yet. Browse the ones we do have.");
  }
  // Inject slug for inner-linking
  breed.slug = slug;

  // Bonus user-dogs section — best-effort. PartyKit endpoint may not exist
  // yet (needs deploy). Render falls back to no section gracefully.
  const userDogs = await fetchUserDogs(breed.breedTagName || breed.name);

  const { head, body } = renderBreedPage(breed, userDogs);
  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Modest cache — content rarely changes, but the live-dogs section can.
  // s-maxage is what Vercel's edge respects.
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400');
  res.send(shell(head, body));
};
