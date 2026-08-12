# FencingTime

FencingTime is a web app for managing fencing club rosters and competitions. It tracks fencers and their ratings, organizes events by weapon/category/gender, handles event registration, and generates pool assignments and bouts.

🔗 **WIP Live site:** [fencingtime.abdelgawad.dev](https://fencingtime.abdelgawad.dev)

## Features

- **Fencers** — add, edit, and browse a roster of fencers, including club, gender, birthdate, and foil/épée/saber ratings
- **Events** — create and edit competitions (name, capacity, address, start time, weapon, category, gender)
- **Registration** — register fencers to events and view who's competing in each event
- **Pools** — view pool assignments and bouts for an event, including seeding and per-bout results

## Tech Stack

- **Frontend:** React 18 (Vite), React Router
- **Backend:** Vercel Serverless Functions (Node.js, `pg`)
- **Database:** PostgreSQL, hosted on Neon
- **Deployment:** Vercel, with `@vercel/analytics` and `@vercel/speed-insights`