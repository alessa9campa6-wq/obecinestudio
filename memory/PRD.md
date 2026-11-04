# CineStudio – PRD
iPadOS-first Expo app + FastAPI/Mongo for filmmakers: pre-production → set → post (screenplay, storyboard w/ Apple Pencil, shotlist, location, budget, moodboard, cast, crew, lighting diagrams, color/LUT, weather/sun, slate, supervisor notes, time tracker, VFX/edit/grade, lens calculator, formats, frame guides, viewfinder, PDF exports). Language: Italian.

## Done
- Dynamic modules per project type (Film, Serie, Social…), Google + email login, camera/lens DBs
- Team roles: viewer / editor / admin (+ owner). Backend enforces (403), `my_role` in project responses; frontend read-only badge, hidden create buttons, mutation guard
- Account view modes (filmmaker, crew, cast, produttore, cliente, rental): featured tools, compact sidebar for cast/cliente/rental, dashboard hint, shared-project filter & role badges
- Storyboard: palm rejection (per-touch tracking, pencil priority), two-finger tap undo, redo, line tool, opacity, extended palette, grid guides, frame formats (16:9…9:16), multi-select delete, fullscreen, light table
- Cross-links: checklist ↔ equipment sync + import, location → lighting diagram, rental links on cards, equipment/location cost totals (cost × units × days)
- Viewfinder: Log space per brand + conversion to Rec.709 + creative LUT stacked, EXIF orientation fix on crop

## Backlog
- PDF export with images, no "cinestudio" watermark
- Social projects display bug
- Apple Sign-In, Perplexity, external PDF import, multiple crew roles, import from other projects, AR sun path, wifi cameras, location reviews
