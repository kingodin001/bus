# Visual reference and implementation

The supplied IMG_0412.MP4 is 576 × 1280, 35.27 seconds, approximately 30 fps. The reference itself is not copied into the repository.

Observed: portrait composition; a colorful city menu and large blue open-top bus; cartoon toy-like vehicles; two dense colored passenger flows around an island; four standard parking spaces plus VIP and extras; arrow-based jam grid; soft shadows; blue beveled buttons; coin rewards and modal panels.

The game scene uses independently generated rounded extrusion geometry, original wheels/windows/lights, an orthographic camera, hemisphere + directional lights, cached materials and instanced passenger models. The scene uses the same overall top-to-bottom composition. Menu art is a static generated illustration; the gameplay is real-time 3D.

## Menu artwork

Asset: `app/src/main/assets/art/menu-city.png`
Generated with the built-in image-generation tool on 2026-10-18.

Prompt: Final portrait mobile game main-menu background. A cheerful chunky cobalt blue open-top city bus faces camera with a slight view of its left side; glossy dark blue windshield, small friendly driver, silver bumper, yellow headlights and cream rounded seats. A queue of small colorful toy-like passengers stands to the left by a bus stop, with a brown-haired girl in blue uniform. Bright pastel city, peach and blue buildings, sidewalks, rounded trees, blue sky and puffy clouds. Soft ambient occlusion, smooth beveled forms, saturated materials, professional casual-game 3D render. Quiet road space below the bus for a separately drawn Play button, readable upper side areas for menu icons. No words, numbers, logos, watermark or UI buttons.

The final illustration is bundled directly in the app. Gameplay assets were not replaced by pictures or mock screenshots.

## Intentional first-version scope

Three levels, local progression, in-game currency only. No paid subscriptions, ad SDK, original-game account system, extracted copyrighted files or claims of pixel-identical reproduction. The clip contains no usable audio, so the game uses newly synthesized effects.
