# Listing Writer

A small website with its own AI. The page (public/index.html) talks to your server (server.js), and your server talks to the Claude API. The API key stays on the server and is never sent to visitors.

## Run it on your computer
1. Install Node.js 18 or newer (nodejs.org).
2. In this folder run: `npm install`
3. Copy `.env.example` to `.env`, then put your API key in it.
4. Run: `node --env-file=.env server.js`
5. Open http://localhost:3000

## Put it online
Use a host that runs Node apps, such as Render, Railway or Fly.io. Upload this folder (or connect a GitHub repo), set `ANTHROPIC_API_KEY` as an environment variable in the host's settings (never commit it), and use `npm start` as the start command.

## Before you charge people
- Add a login or password if you only want paying clients using it, otherwise anyone can spend your credits.
- Set a monthly spend limit in your Anthropic Console.
- Add a privacy note if you collect any customer details.
