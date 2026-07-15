# Outreach Staging Log — breed backlink campaign

Tracks what's been drafted so the daily auto-stager never duplicates. **Companion to `breed-outreach-list-and-template.md`** (which holds the prospects + personalized messages).

## Cadence
- A scheduled task (`daily-breed-outreach-stager`) runs each weekday morning, stages the next batch of Gmail **drafts** (never sends), and updates this log.
- James reviews + sends from his Gmail. Deliverability: keep ~15-25 sends/day max from one mailbox.

## Breeds already processed (research + messages done) — 48
Bernedoodle, German Shepherd, Mini Golden Retriever, Australian Labradoodle, Labradoodle, Saint Berdoodle, Mini Aussie (Wave 0) · Goldendoodle, Pomsky, Teacup Poodle, Mini Dachshund, Golden Mountain Dog, Toy Aussie, French Bulldog, Cockapoo, Maltipoo, Cavapoo, Cane Corso, Dalmatian, Belgian Malinois, Bernese Mountain Dog, Maltese, Vizsla, Newfoundland, Giant Schnauzer, Chocolate Lab, Mini French Bulldog, Mini Australian Shepherd, American Bully, Agouti Husky (Wave 1) · Golden Retriever, Labrador Retriever, Poodle, Dachshund (standard), Corgi, Siberian Husky (Wave 2) · Australian Shepherd, Beagle, Rottweiler, Boxer, Border Collie, Great Dane (Wave 2 run 2) · Doberman Pinscher, Cavalier King Charles Spaniel, Yorkshire Terrier, Chihuahua, Shih Tzu, Pomeranian (Wave 2 run 3)

## Emails already staged as drafts (do NOT re-draft) — 71
**Wave 0 (sent by James):** info@lostcreekdoodles.com, info@anythinggermanshepherd.com, jamie@minigoldenpaws.com, info@bigheartedbreeders.com, heritagemanorlabradoodles@gmail.com, northboundlabradoodles@gmail.com, hello@creampufflabradoodles.com, amdoodles@gmail.com, Tom@PrizePnD.com, mydarlingdoodles@gmail.com, team@crockettdoodles.com, PaintedBlueAussies@gmail.com

**Wave 1 (staged 2026-06-23, James sending 2026-06-24):** support@goldenlifedoodles.com, Matthewslegacyfarm@gmail.com, blue@goldendoodles.com, Jessica@pettalkmedia.com, woof@ilovedachshunds.com, pg9365@juno.com, goldenmountainfarm@outlook.com, pups@goldenmtndogs.com, bernerpuppy.com@gmail.com, kary@flyingwalkerranch.com, magicaltoyaussies@gmail.com, reggiethecockapoo@gmail.com, info@felindrecockapoos.co.uk, Contact@PetMaltipoo.com, info@cavapoolove.com, lisa@dalamanti.co.uk, info@blackwoodcanine.com, darkmalinois18@gmail.com, tongtong_zhou@yahoo.com, kevintheberner@gmail.com, lovenewfoundlands@gmail.com, jordangiants@yahoo.com, David@HiddenPondLabradors.com, johnwcolumbus@gmail.com

**Wave 2 (staged 2026-07-14):** info@goldenretrieverlife.com, puppies@snowypineswhitelabs.com, gallivantlabradors@gmail.com, gigi@smokymtn.com, PetersonPoodlesofTexas@gmail.com, info@poodlesofpiedmont.com, hello@doxieplanet.com, info@dachshundsplanet.com, navycorgi@gmail.com, willothecorgi@gmail.com

**Wave 2 run 2 (staged 2026-07-14):** Wiggles@HappyAussie.com, maggie@thesofetch.com, omgbeagle@gmail.com, muhammadaliseo419@gmail.com, hello@adventuresoface.com, Contact@AllBoxerInfo.com, info@nordomboxer.com, penny@dentbros.co.uk, sam@sammilburncreative.com, dustin@mayfieldjones.com, info@southernpinesfamilydanes.com, sarahliedl@gmail.com, justforaminute@gmail.com

**Wave 2 run 3 (staged 2026-07-15):** admin@dobermanblog.com, info@thedobermannetwork.com, info@carlislecavaliers.com, adoptions@judyscavaliers.com, hello@yorkielove.com, artisanyorkies@gmail.com, cathy@ilovemychi.com, admin@chichisandme.com, salemchihuahuas@gmail.com, Contact@AllShihTzu.com, silhouettepomeranians@gmail.com, info@avalonpom.com

## Breed queue — process top-down, skip any already in "processed" above
**Wave 2 (next-value tail):** (1–18 DONE — see "processed" above; next queue head = #19 Shiba Inu)
1. ~~Golden Retriever~~ ✓
2. ~~Labrador Retriever~~ ✓
3. ~~Poodle~~ ✓
4. ~~Dachshund (standard)~~ ✓
5. ~~Corgi (Pembroke Welsh Corgi)~~ ✓
6. ~~Siberian Husky~~ ✓
7. ~~Australian Shepherd~~ ✓
8. ~~Beagle~~ ✓
9. ~~Rottweiler~~ ✓
10. ~~Boxer~~ ✓
11. ~~Border Collie~~ ✓
12. ~~Great Dane~~ ✓
13. ~~Doberman Pinscher~~ ✓
14. ~~Cavalier King Charles Spaniel~~ ✓
15. ~~Yorkshire Terrier~~ ✓
16. ~~Chihuahua~~ ✓
17. ~~Shih Tzu~~ ✓
18. ~~Pomeranian~~ ✓
19. Shiba Inu
20. Pug
21. Cocker Spaniel
22. Boston Terrier
23. Havanese
24. Bichon Frise
25. Great Pyrenees
26. Akita
27. Samoyed
28. Mastiff
29. Saint Bernard
30. Weimaraner
31. Rhodesian Ridgeback
32. German Shorthaired Pointer
33. Australian Cattle Dog
34. Shetland Sheepdog
35. Collie
36. Whippet
37. Miniature Schnauzer
38. Pit Bull
39. Staffordshire Bull Terrier
40. American Bulldog

**Long tail (after Wave 2, roughly most-popular first):** all remaining `breeds.js` entries not yet processed — Affenpinscher, Afghan Hound, Airedale Terrier, Alaskan Malamute, American Eskimo Dog, Basenji, Basset Hound, Black German Shepherd, Bloodhound, Border Terrier, Brittany, Bull Terrier, Bulldog (English), Bullmastiff, Cairn Terrier, Chesapeake Bay Retriever, Chinese Crested, Chow Chow, Coonhound, English Setter, English Springer Spaniel, Greyhound, Irish Setter, Irish Wolfhound, Italian Greyhound, Jack Russell Terrier, Lhasa Apso, Miniature Pinscher, Norwegian Elkhound, Old English Sheepdog, Papillon, Pekingese, Pocket Bully, Pointer, Portuguese Water Dog, Rat Terrier, Scottish Terrier, Shar Pei, Teacup Yorkie, West Highland White Terrier, XL Bully. (Skip "Mixed Breed" and "Other / Not sure".)

## Run log
- 2026-06-23 — Wave 0 (12) + Wave 1 (24) drafted manually. 36 emails staged. Queue seeded.
- 2026-07-14 — Wave 2, breeds 1-6 (Golden Retriever, Labrador Retriever, Poodle, Dachshund std, Corgi, Siberian Husky). 10 drafts staged (Golden Retriever Life, Snowy Pines, Gallivant, Smoky Mountain, Peterson Poodles, Poodles of Piedmont, DoxiePlanet, Dachshunds Planet, Navy Corgi, Willo the Corgi). Siberian Husky = 0 verified emails (all form/social/blocked) — recorded for manual outreach only. Corgi's 2 drafts (Navy/Willo) are dormant sites but real verified emails. Next queue head: Australian Shepherd (#7).
- 2026-07-14 (run 2) — Wave 2, breeds 7-12 (Australian Shepherd, Beagle, Rottweiler, Boxer, Border Collie, Great Dane). 13 drafts staged: The Happy Aussie, So Fetch! (Aussie); OMG Beagle (Beagle); The Rottweiler World, Adventures of Ace (Rottweiler); AllBoxerInfo, NorDom Boxer (Boxer); Dentbros Dogs, Buddy The White Border Collie (Border Collie); 7Sisters Great Danes, Southern Pines Family Danes, Wheaton Prairie Danes, Brickhouse Danes (Great Dane). Thin for verified emails: Beagle (1). No-blog-but-verified-email breeders: Wheaton Prairie, Brickhouse. Rest of each breed (form/DM/no-contact) recorded for manual outreach. Next queue head: Doberman Pinscher (#13).
- 2026-07-15 (run 3) — Wave 2, breeds 13-18 (Doberman Pinscher, Cavalier KCS, Yorkshire Terrier, Chihuahua, Shih Tzu, Pomeranian). 12 drafts staged: Doberman Blog, The Doberman Network (Doberman); Carlisle Cavaliers, Judy's Cavaliers (Cavalier); YorkieLove, Artisan Yorkies (Yorkie); I Love My Chi, ChiChis And Me, Salem's Finest (Chihuahua); AllShihTzu (Shih Tzu); Silhouette Pomeranians, Avalon Pomeranians (Pomeranian). Richest verified-email breed: Chihuahua (3). Thinnest for verified emails: Shih Tzu (1, and Contact@AllShihTzu.com carries a placeholder-phone caveat — verify before sending). Strong guest-post targets left as manual (form/masked email): Cavalier Gifts (Tonya Wilhelm), Miracle Shih Tzu (Janice Jones), Pomeranian HQ (Denise Leo), Pretty Pomeranian. Note: Yorkie's Mini Peludos is a translated Spanish-origin site (flagged, not drafted). Rest of each breed recorded for manual outreach. Next queue head: Shiba Inu (#19).
