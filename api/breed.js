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

// ─── Content store ─────────────────────────────────────────────────────
// Pilot — Bernedoodle. Voice + structure are the template; clone for the
// next 19 P1 breeds (see plan §6). Each section is hand-written; do NOT
// build a parameterized "[Breed] is a [size] dog known for [trait]" filler.
// Google's helpful-content classifier eats those. (Plan §9 risk #1.)
const BREEDS = {
  bernedoodle: {
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
};

const STYLES = `
@font-face{font-family:'Yang Bagus';src:url('/YangBagus.ttf') format('truetype');font-display:swap;}
*{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:#0f0a22;--bg-card:#1a1035;--bg-card-2:#241a45;--accent:#FF8C42;--purple:#7B68EE;--text:#e0d8f0;--dim:rgba(255,255,255,0.45);--gold:#FFD700;}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;line-height:1.6;}
a{color:var(--accent);}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 60px;}
.eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--purple);margin-bottom:8px;}
.eyebrow a{color:var(--purple);text-decoration:none;}
h1.breed-h1{font-family:'Yang Bagus',serif;color:var(--accent);font-size:44px;line-height:1.05;margin-bottom:16px;}
.lede{font-size:17px;color:rgba(255,255,255,0.82);margin-bottom:36px;}
.lede em{color:var(--text);font-style:italic;}
.section{margin:36px 0;}
.section h2{font-family:'Yang Bagus',serif;color:var(--accent);font-size:26px;margin-bottom:14px;}
.section h3{font-size:16px;color:var(--text);margin:20px 0 8px;font-weight:600;}
.section p{font-size:15px;color:rgba(255,255,255,0.78);margin-bottom:12px;}
.section p strong{color:var(--text);}
/* Live show widget — always populated, no PartyKit dependency at render-time */
.live-widget{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(255,140,66,0.10),rgba(123,104,238,0.10));border:1px solid rgba(255,140,66,0.25);border-radius:12px;padding:14px 16px;margin:28px 0;}
.live-pip{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(255,140,66,0.7);animation:pulse 1.6s ease-out infinite;flex:0 0 auto;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,140,66,0.7);}70%{box-shadow:0 0 0 12px rgba(255,140,66,0);}100%{box-shadow:0 0 0 0 rgba(255,140,66,0);}}
.live-text{flex:1;font-size:14px;color:rgba(255,255,255,0.85);}
.live-text strong{color:var(--accent);font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;display:block;margin-bottom:2px;}
.live-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;text-decoration:none;white-space:nowrap;}
/* Facts table */
.facts{background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:18px;margin:28px 0;}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:8px 18px;font-size:14px;}
.facts dt{color:var(--purple);font-weight:600;}
.facts dd{color:rgba(255,255,255,0.82);}
/* CTA */
.cta-block{text-align:center;background:linear-gradient(135deg,rgba(123,104,238,0.10),rgba(255,140,66,0.05));border:1px solid rgba(123,104,238,0.25);border-radius:12px;padding:28px 22px;margin:36px 0;}
.cta-block h2{font-family:'Yang Bagus',serif;color:var(--text);font-size:24px;margin-bottom:8px;}
.cta-block p{font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:16px;}
.cta-btn{display:inline-block;background:var(--accent);color:#1a1035;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;}
.cta-btn-sub{font-size:12px;color:var(--dim);margin-top:10px;}
/* User dogs grid (bonus, hidden when N=0) */
.user-dogs{margin:36px 0;}
.user-dogs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px;}
.user-dog-card{background:var(--bg-card);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0;text-decoration:none;color:var(--text);overflow:hidden;display:block;}
.user-dog-card img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:var(--bg-card-2);}
.user-dog-card-name{font-size:13px;font-weight:600;padding:8px 10px 4px;}
.user-dog-card-owner{font-size:11px;color:var(--dim);padding:0 10px 10px;}
/* Related breeds */
.related-breeds{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.related-breed-chip{display:inline-block;background:var(--bg-card);border:1px solid rgba(123,104,238,0.3);border-radius:20px;padding:8px 16px;font-size:13px;text-decoration:none;color:var(--text);}
.related-breed-chip:hover{border-color:var(--purple);}
.related-breed-chip.soon{color:var(--dim);border-color:rgba(255,255,255,0.06);background:rgba(26,16,53,0.4);cursor:default;}
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
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V830P7PPHQ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-V830P7PPHQ');</script>
<script src="/analytics.js" defer></script>
<style>${STYLES}</style>
</head>
<body>
${bodyHtml}
<footer style="text-align:center;padding:24px 16px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px;">
    <a href="/about" style="font-size:12px;color:#5a4d80;text-decoration:none;">About</a>
    <a href="/about#contact" style="font-size:12px;color:#5a4d80;text-decoration:none;">Contact</a>
    <a href="/dogs" style="font-size:12px;color:#5a4d80;text-decoration:none;">All Dogs</a>
    <a href="/privacy" style="font-size:12px;color:#5a4d80;text-decoration:none;">Privacy</a>
    <a href="/terms" style="font-size:12px;color:#5a4d80;text-decoration:none;">Terms</a>
    <a href="/dog-photo-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Dog Photo Contest</a>
    <a href="/cutest-dog-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Cutest Dog Contest</a>
    <a href="/puppy-picture-contest" style="font-size:12px;color:#5a4d80;text-decoration:none;">Puppy Picture Contest</a>
    <a href="/dog-show-near-me" style="font-size:12px;color:#5a4d80;text-decoration:none;">Dog Show Near Me</a>
  </div>
  <div style="font-size:11px;color:#3d2d6b;">The Dog Show &copy; 2026. All dogs are good dogs.</div>
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

  const body = `<div class="wrap">
<div class="eyebrow"><a href="/breeds">Breeds</a> &middot; ${esc(breed.name)}</div>
<h1 class="breed-h1">${esc(breed.name)}</h1>
<div class="lede">${breed.lede}</div>

<aside class="live-widget" aria-label="The Dog Show is live now">
<span class="live-pip" aria-hidden="true"></span>
<div class="live-text"><strong>Live now</strong>Dogs are on stage at The Dog Show right now. Come and watch.</div>
<a class="live-btn" href="/show.html">Watch &rarr;</a>
</aside>

<div class="section spotlight">
<h2>${esc(breed.spotlightHeading)}</h2>
${breed.spotlight}
</div>

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

${renderUserDogsSection(userDogs, breed.name)}

<div class="cta-block">
<h2>Put your ${esc(breed.name)} in the show</h2>
<p>Upload a photo. Your dog appears on the live stage. Viewers around the world send bones. Pick "${esc(breed.name)}" in the breed picker.</p>
<a class="cta-btn" href="/#tiers">Enter Your Dog &rarr;</a>
<div class="cta-btn-sub">From $3.99 &middot; one-time</div>
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
