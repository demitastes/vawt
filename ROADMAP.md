Make a generic tournament platform for running bracket-style competitions, with the Virginia Whiskey Tournament 2026 as the first configured organizer/tournament. The platform should support current, past, and future tournaments, and should be reusable for other organizers without hardcoding VAWT-specific concepts into the core website, API, or Discord bot.

We'd like the following roughly in order. Be sure to make a plan in TODO.md that allows multiple agents or people to work on this in parallel. CLAUDE.md and AGENTS.md should both be generated for this purpose. A plan in terms of tasks and phases should go into TODO.md.

There should be separate top level directories for the website and the Discord bot, but they should share tournament data through a common API and database-backed tournament model. Markdown, CSV, and JSON should remain convenient import/export formats for non-coders, but the long-term source of truth should be the database so multiple tournaments can be created, routed, administered, and queried at the same time.

Don't take the following roadmap necessarily in order. Consider the whole thing and create a phased implementation plan where agents can work in parallel.

# Broad Roadmap Plan

Transform the data in BRACKET.md into something declarative with a normalized format that could easily be generated from a CSV exported from a spreadsheet. Take the raw data and convert that to a CSV so that the operator has a starting place. Make a script that converts that CSV to a JSON file as a seed/import path, then migrate tournament setup into database tables once the generic multi-tournament model is ready.

Initially, we'd like to start with a static website where we can explore the bracket.

Then we'd like to have a hosted website where users can create accounts, make march-madness style brackets, and share them to socials. The website should also have statistics about the tournament derived from past years.

We want to be able to share any given bout, or the whole bracket as a link and a generated image to socials in vertical, square (or a series of square images), and horizontal bracket formats.

Finally, we'd like a Discord bot that can check who is in what round, what the voting dates are for which round, and whatever else related to checking progress.

I'm thinking a website where you can easily explore the bracket progress so far (updated in real time)
The website will let you make March-madness style brackets you can share to whatever socials you want (vertical for instagram stories, square for posts, horizontal for whatever people use horizontal for these days, but also because it's a bracket so horizontal seems better
Maybe have some statistics derived from past years of the tournament

A discord bot to check who is in what round, what the voting dates are for which round, and whatever else related to checking progress

Add the ability for the tournament admins to choose the winners for each bout, update dates, change the bracket structure if needed, and have that reflected on the website and the Discord bot in real time. This could be done with a simple admin interface on the website that updates the JSON data file, which is then read by both the website and the Discord bot.

# Generic Tournament Platform Direction

The long-term product should treat VAWT as one configured tournament, not as the application identity. Core code should use generic organizer, tournament, participant, bout, vote, and bracket terminology. VAWT-specific display copy, participant metadata, and seed data should live in configuration/data.

Public website routes should identify tournaments by organizer and tournament, such as `/vawt/2026`. API routes should use the same identity, such as `/api/organizers/:organizerSlug/tournaments/:tournamentSlug`. Compatibility routes like `/api/tournaments/:year` may exist during migration, but new platform work should target organizer/tournament routes.

Short-term implementation should use the same route and command shapes even before the fully generic database model exists. VAWT 2026 can be the only seeded organizer/tournament at first, but the website should still route it as `/vawt/2026`, the API should expose organizer/tournament endpoints, and the Discord bot should resolve a configured tournament context instead of hardcoding a year into command behavior. Early compatibility adapters may load VAWT data from existing files behind those generic interfaces.

Tournament setup data should eventually be written into the database: organizers, tournaments, participants, rounds, bouts, advancement rules, schedules, results, display metadata, and any organizer-specific participant metadata. Markdown, CSV, and JSON should remain supported as seed, import, export, and review formats for non-coders rather than being the canonical runtime store.

The Discord bot should resolve tournament context automatically. A bot admin can configure a Discord guild default tournament, and can optionally configure per-channel tournament overrides for servers that run multiple tournaments. Commands should resolve context as channel override first, then guild default. Users should only pass an explicit tournament parameter for cross-tournament lookup commands.

Parallel workstreams should be planned so multiple agents can work safely at once:
- Genericize data, API, and schema naming away from VAWT/distillery terminology.
- Implement database-backed tournament setup and import/export paths.
- Update frontend routing and data loading for organizer/tournament URLs.
- Add Discord guild and channel tournament binding.
- Preserve VAWT 2026 as the first migrated dataset and route it at `/vawt/2026`.
