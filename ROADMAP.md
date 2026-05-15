Make an app for the Virginia Whiskey Tournament 2026. Ideally make it extensible for future years, with the ability for a non-coder to drop in data about current, past, and future years, or to repurpose this for other tournaments.

We'd like the following roughly in order. Be sure to make a plan in TODO.md that allows multiple agents or people to work on this in parallel. CLAUDE.md and AGENTS.md should both be generated for this purpose. A plan in terms of tasks and phases should go into TODO.md.

There should be separate top level directories for the website and the Discord bot, but they should share data about the tournament. The data should be in a format that is easy to edit by non-coders, like markdown or JSON.

Don't take the following roadmap necessarily in order. Consider the whole thing and create a phased implementation plan where agents can work in parallel.

# Broad Roadmap Plan

Transform the data in BRACKET.md into something declarative with a normalized format that could easily be generated from a CSV exported from a spreadsheet. Take the raw data and convert that to a CSV so that the operator has a starting place. Make a script that converts that CSV to a JSON file - probably not necessary to populate this static data into a database.

Initially, we'd like to start with a static website where we can explore the bracket.

Then we'd like to have a hosted website where users can create accounts, make march-madness style brackets, and share them to socials. The website should also have statistics about the tournament derived from past years.

We want to be able to share any given bout, or the whole bracket as a link and a generated image to socials in vertical, square (or a series of square images), and horizontal bracket formats.

Finally, we'd like a Discord bot that can check who is in what round, what the voting dates are for which round, and whatever else related to checking progress.

I'm thinking a website where you can easily explore the bracket progress so far (updated in real time)
The website will let you make March-madness style brackets you can share to whatever socials you want (vertical for instagram stories, square for posts, horizontal for whatever people use horizontal for these days, but also because it's a bracket so horizontal seems better
Maybe have some statistics derived from past years of the tournament

A discord bot to check who is in what round, what the voting dates are for which round, and whatever else related to checking progress

Add the ability for the tournament admins to choose the winners for each bout, update dates, change the bracket structure if needed, and have that reflected on the website and the Discord bot in real time. This could be done with a simple admin interface on the website that updates the JSON data file, which is then read by both the website and the Discord bot.
