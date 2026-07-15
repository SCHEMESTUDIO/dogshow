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
      { slug: 'mini-aussie', name: 'Mini Aussie' },
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'siberian-husky', name: 'Siberian Husky' },
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
    ],
    breedTagName: 'French Bulldog',
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
      { slug: 'goldendoodle', name: 'Goldendoodle' },
      { slug: 'australian-labradoodle', name: 'Australian Labradoodle' },
      { slug: 'bernedoodle', name: 'Bernedoodle' },
      { slug: 'cockapoo', name: 'Cockapoo' },
    ],
    breedTagName: 'Labradoodle',
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
      { slug: 'mastiff', name: 'Mastiff' },
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
};

const STYLES = `
@font-face{font-family:'Yang Bagus';src:url('/YangBagus.ttf') format('truetype');font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#f3eefb;--bg-card:#ffffff;--bg-card-2:#f8f5fd;--accent:#FF8C42;--purple:#7B68EE;--text:#2a2150;--dim:rgba(42,33,80,0.75);--gold:#806104;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;line-height:1.6;}
a{color: var(--accent-text, #c25a0e);}
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
.breed-hero img{width:100%;aspect-ratio:1/1;max-height:560px;object-fit:contain;background:#e9e2f5;display:block;}
.breed-hero-cap{position:absolute;left:0;right:0;bottom:0;padding:24px 16px 12px;font-size:13px;color:#fff;background:linear-gradient(to top,rgba(10,6,23,0.88),rgba(10,6,23,0));}
.breed-hero-cap .nm{font-weight:700;color: var(--accent-text, #c25a0e);}
.breed-hero-credit{font-size:11px;color:var(--dim);padding:6px 2px 0;}
.breed-hero-credit a{color:var(--purple);}
.breed-hero-empty{display:flex;align-items:center;justify-content:center;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(123,104,238,0.18),rgba(255,140,66,0.12));}
.breed-hero-empty-inner{font-family:'Yang Bagus',serif;color: var(--accent-text, #c25a0e);font-size:24px;line-height:1.15;text-align:center;padding:24px;}
.section{margin:36px 0;}
.section h2{font-family:'Yang Bagus',serif;color: #2a2150;font-size:26px;margin-bottom:14px;}
.section h3{font-size:16px;color:var(--text);margin:20px 0 8px;font-weight:600;}
.section p{font-size:15px;color:rgba(42,33,80,0.92);margin-bottom:12px;}
.section p strong{color:var(--text);}
/* Live show widget — always populated, no PartyKit dependency at render-time */
.live-widget{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(255,140,66,0.10),rgba(123,104,238,0.10));border:1px solid rgba(255,140,66,0.25);border-radius:12px;padding:14px 16px;margin:28px 0;}
.live-pip{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(255,140,66,0.7);animation:pulse 1.6s ease-out infinite;flex:0 0 auto;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,140,66,0.7);}70%{box-shadow:0 0 0 12px rgba(255,140,66,0);}100%{box-shadow:0 0 0 0 rgba(255,140,66,0);}}
.live-text{flex:1;font-size:14px;color:rgba(42,33,80,0.92);}
.live-text strong{color: var(--accent-text, #c25a0e);font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;display:block;margin-bottom:2px;}
.live-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;white-space:nowrap;}
/* Facts table */
.facts{background:var(--bg-card);border:1px solid rgba(42,33,80,0.11);border-radius:12px;padding:18px;margin:28px 0;}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;font-size:14px;}
.facts dt{color:var(--purple);font-weight:600;}
.facts dd{color:rgba(42,33,80,0.92);}
/* CTA */
.cta-block{text-align:center;background:linear-gradient(135deg,rgba(123,104,238,0.10),rgba(255,140,66,0.05));border:1px solid rgba(123,104,238,0.25);border-radius:12px;padding:28px 22px;margin:36px 0;}
.cta-block h2{font-family:'Yang Bagus',serif;color:var(--text);font-size:24px;margin-bottom:8px;}
.cta-block p{font-size:14px;color:rgba(42,33,80,0.92);margin-bottom:16px;}
.cta-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;}
.cta-btn-sub{font-size:12px;color:var(--dim);margin-top:10px;}
.cta-secondary{font-size:13px;color:var(--dim);margin:16px 0 0;}
.cta-secondary a{color: var(--accent-text, #c25a0e);text-decoration:none;font-weight:600;}
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
.related-breed-chip{display:inline-block;background:var(--bg-card);border:1px solid rgba(123,104,238,0.3);border-radius:20px;padding:8px 16px;font-size:13px;text-decoration:none;color:var(--text);}
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
<footer style="text-align:center;padding:24px 16px;border-top:1px solid rgba(42,33,80,0.11);background:#e9e2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px;">
    <a href="/about" style="font-size:12px;color:#5d5088;text-decoration:none;">About</a>
    <a href="/about#contact" style="font-size:12px;color:#5d5088;text-decoration:none;">Contact</a>
    <a href="/dogs" style="font-size:12px;color:#5d5088;text-decoration:none;">All Dogs</a>
    <a href="/leaderboard" style="font-size:12px;color:#5d5088;text-decoration:none;">Leaderboard</a>
    <a href="/privacy" style="font-size:12px;color:#5d5088;text-decoration:none;">Privacy</a>
    <a href="#" data-cookie-settings style="font-size:12px;color:#5d5088;text-decoration:none;">Cookie settings</a>
    <a href="/terms" style="font-size:12px;color:#5d5088;text-decoration:none;">Terms</a>
    <a href="/resources" style="font-size:12px;color:#5d5088;text-decoration:none;">Guides</a>
    <a href="/breeds" style="font-size:12px;color:#5d5088;text-decoration:none;">Breeds</a>
  </div>
  <div style="font-size:11px;color:#5d5088;">The Dog Show &copy; 2026. All dogs are good dogs.</div>
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
