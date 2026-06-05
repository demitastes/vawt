---
name: distillery-profile-pages
description: Create and update static VAWT distillery profile pages with source-backed details, clear product taxonomy, and consistent UX.
---

# Distillery Profile Pages

Use this skill when creating or updating static profile pages for distilleries participating in VAWT. Keep edits scoped to the requested profile page and any directly required data/assets. Do not invent facts, do not update tournament TODOs unless asked, and preserve unrelated work in the tree.

## Page Format

- Build profile pages as static, lightweight pages that fit the current site architecture. Prefer vanilla HTML/CSS/JS patterns already present in the repo.
- The first viewport must clearly identify the distillery: distillery name, location, concise status/role in VAWT, and primary visual or brand signal when available.
- Put official links near the top, visually emphasized and easy to tap:
  - Official website
  - Instagram
- Use a consistent structure:
  - Header/hero with name, location, and top official links
  - Snapshot facts such as founded year, city/state, ownership, visitor experience, and known production focus
  - VAWT-relevant whiskey/product section
  - Notes/sources section or source comments as established by the repo
- Keep copy concise and scan-friendly. These are profile pages, not marketing landing pages.

## UX Requirements

- Design for quick comparison across distilleries: stable headings, predictable section order, and compact factual blocks.
- Make official website and Instagram links prominent, preferably as the first interactive controls after the distillery identity.
- Use responsive layouts that work on desktop and mobile without overlapping text, clipped buttons, or horizontal scroll.
- Avoid decorative clutter. Use real product/place/brand visuals when available and source-appropriate; avoid generic whiskey stock imagery.
- Do not hide important facts behind hover-only interactions.
- External links should open safely with `target="_blank"` and `rel="noopener noreferrer"` when the existing project style permits.

## Source Handling

- Prefer primary sources first: official distillery site, official shop/product pages, official Instagram, press releases, TTB labels, and state tourism/business pages.
- Use reputable secondary sources only to fill gaps or corroborate: local journalism, established spirits publications, competition databases, or retailer pages for bottle details.
- Record source URLs in the page, nearby comments, or a companion data field if the repo has one. Future agents must be able to re-check claims.
- Do not use unsourced claims for founding dates, ownership, awards, mash bills, proof, age statements, availability, or tasting notes.
- If sources disagree, state the conservative fact or ask the user. Do not silently choose the more exciting version.
- Treat current availability, product lineup, hours, and social links as time-sensitive. Verify them close to the edit date.

## Product And Whiskey Taxonomy

- Separate products by category where possible:
  - Bourbon
  - Rye
  - American single malt
  - Wheat whiskey
  - Corn whiskey
  - Finished whiskey
  - Single barrel/store pick
  - Limited release
  - Non-whiskey spirits
- Preserve product names exactly as official sources style them.
- Capture product details only when sourced: proof/ABV, age statement, mash bill, barrel finish, release type, bottle size, and availability.
- Distinguish distillery-produced, sourced, contract-distilled, blended, and independently bottled products when the source makes that clear.
- If the VAWT entrant is a specific bottle, emphasize that bottle above the broader portfolio.

## Placeholders And Unclear Facts

When a required detail is unclear, use an explicit placeholder that asks the user instead of guessing:

```text
TODO: Ask user to confirm [specific fact].
```

Examples:

- `TODO: Ask user to confirm whether this profile should feature the flagship bourbon or the VAWT entrant bottle.`
- `TODO: Ask user to confirm the preferred official Instagram account.`
- `TODO: Ask user to confirm whether sourced whiskey should be listed separately from distilled-on-site products.`

Keep placeholders specific and actionable. Avoid vague placeholders such as `TODO: more info`.

## Verification Expectations

- Run the repo's existing static/responsive checks after layout, CSS, or JS changes. Start with `node test_responsive.js`; run visual tests when profile-page layout or responsive behavior changed.
- For new reusable tests, create permanent in-repo test files. Do not use one-off ad hoc test scripts.
- Manually check desktop and mobile rendering when changing profile UI.
- Verify that official website and Instagram links work and point to the intended distillery.
- Re-check all sourced claims before finalizing, especially time-sensitive product availability and social links.
- Final response should name the profile page changed, sources used or gaps left as placeholders, and tests run.
