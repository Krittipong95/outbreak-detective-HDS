# Cinematic and offline language release · 10 November 2026

The Sites workflow guided responsive verification and release checks. Built-in ImageGen created the six assets below. Images remain in the workspace and are referenced by the game; no image service is called during play.

## Player-facing changes

- English catalogue bundled with the game: 3,568 entries plus reviewed terminology and dashboard phrases. Live translation API calls and the translation queue are removed.
- Pre-game language selection redraws immediately without reloading; selected language is remembered. Source templates retain variable values, markup and player names.
- Separate foreground foliage and lantern sprites move independently from the scenery. Water, ambient light and fireflies have their own animation layers. A persistent motion switch and system reduced-motion support are provided.
- Waist-up portraits work on narrow screens as well as desktop. The IT officer now has a unique portrait.
- Added separate office, laboratory and farm illustrations; school and hall illustrations from the previous release remain in use.
- Village preview available before starting a case. Dialogue framing, focus styles and English title typography are polished.

## Generated assets and final prompts

### img/cinema-foliage-v1.png

Use case: illustration-story. Asset type: transparent foreground layer for a Thai village visual novel. Wide landscape 16:9 canvas. Delicate lush tropical coconut palm fronds and banana leaves framing ONLY the upper left and upper right corners, each frond extending a little along the top edge. The central 75 percent and lower 75 percent must be empty transparent space, no landscape or sky. Painterly semi-realistic polished digital illustration, warm sunset rim light, natural green leaves with restrained amber highlights, sharp elegant silhouette, matches a beautiful rural Thai village game background. No people, no buildings, no ground, no text, no watermark. Isolated on a genuinely transparent background.

### img/cinema-lantern-v1.png

Use case: illustration-story. Asset type: isolated animated prop sprite. A single elegant Thai woven bamboo hanging lantern, glowing warm amber, suspended from a simple short dark cord attached to the very top center. Long vertical composition, all lantern edges visible, ample transparent padding. Beautiful detailed semi-realistic painterly game illustration, believable bamboo weave, restrained soft warm glow close to lamp. Lamp is vertical at rest, for rotating gently in a visual novel. No scene, no background, no letters, no people, no watermark. Genuinely transparent background.

### img/itofficer-v2.png

Use case: illustration-story. Asset type: transparent full-body character sprite for a Thai rural public-health investigation visual novel. One distinct friendly Thai male provincial IT officer age 30–35, short neatly cropped black hair, no glasses, medium warm brown skin, mature approachable features. Wearing a light blue collared field shirt with sleeves rolled to elbows, dark trousers, modest ID lanyard without readable text, carrying a small open laptop at waist level. Standing three-quarter turned gently toward viewer's left, whole body head to shoes visible, natural anatomy, calm small smile. Premium semi-realistic painterly digital illustration with warm amber sunset rim lighting, consistent with a beautiful Thai village game. Truly transparent background, no scene, no typography, no watermark. Character centered with clean cutout edges and small padding.

### img/scene-lab-v2.jpg

Use case: illustration-story. Asset type: 16:9 wide cutscene background for Thai rural public-health detective visual novel. Empty modest provincial microbiology laboratory in Thailand. Clean off-white counters, microscope on right, labeled-but-unreadable specimen racks, closed sample cooler, compact refrigerator, glass cabinets, window overlooking tropical trees with warm late-afternoon sunlight. Cool teal interior with restrained golden highlights, credible safe laboratory environment, no people, no visible pathogens. Premium detailed semi-realistic painterly digital illustration matching a cinematic Thai village game. Wide eye-level composition with clear central foreground for waist-up character sprites, no readable text or UI, no watermark.

### img/scene-office-v2.jpg

Use case: illustration-story. Asset type: 16:9 wide cutscene background for a Thai public-health detective visual novel. Empty modest health investigation office in rural Thailand at blue hour. Wooden desk with laptop showing simple unlettered charts, neatly stacked case folders, corkboard with small unlabeled map and colored pins, wall clock, shaded desk lamp casting warm amber light. Wide open window shows a darkening tropical canal village with coconut palms. Polished detailed semi-realistic painterly digital game art with warm gold and deep teal palette, calm investigative atmosphere, eye-level wide view with clear central foreground for waist-up characters. No people, no readable text or UI, no watermark.

### img/scene-farm-v2.jpg

Use case: illustration-story. Asset type: 16:9 wide location background for a Thai rural outbreak detective visual novel. Beautiful small Thai vegetable farm beside a narrow irrigation canal, orderly rows of leafy vegetables, modest bamboo washing and packing shed with baskets, a blue hose and closed clean water tank, coconut palms and distant misty green hills. Warm early morning sun with pale sky, calm and atmospheric. Premium detailed semi-realistic painterly digital game art matching a cinematic Thai canal village. No people, no readable text, no watermark. Eye-level wide establishing scene with foreground room for waist-up character sprites. Do not imply a disease source or show obvious contamination.

## Validation scope

The language tests cover opening chapters, generated event variants, choices and the seven field tabs without a translation network call. The cinematic tests check running animation frames, motion disabling and desktop/mobile framing. Existing simulation, save/resume, SQL, audio, terminology, layout and UI checks are also run. Machine-assisted catalogue entries received terminology overrides and representative flow checks; this is not a claim that every English sentence has received a human editorial review.
