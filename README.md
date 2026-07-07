# Company Research Assistant

AI-powered company research tool that crawls websites, searches public sources via Serper.dev, analyzes data with OpenRouter AI, identifies competitors, and generates downloadable PDF reports.

## Features

- **Dual input** — company name or website URL
- **Website crawling** — discovers Home, About, Products, Services, Contact, Pricing pages
- **Serper.dev search** — official website lookup, contact info, competitor research
- **OpenRouter AI** — user-selectable model for summaries, pain points, competitor analysis
- **ChatGPT-style UI** — interactive chat with live progress indicators
- **PDF reports** — one-click professional downloadable reports
- **Discord integration** (bonus) — auto-sends report + applicant details to a Discord channel

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Tailwind CSS, Lucide icons
- **Crawling:** Cheerio + native fetch
- **Search:** Serper.dev API
- **AI:** OpenRouter API
- **PDF:** PDFKit
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- [OpenRouter](https://openrouter.ai/) API key
- [Serper.dev](https://serper.dev/) API key
- (Optional) Discord Bot Token + Channel ID

### Installation

```bash
git clone <your-repo-url>
cd company-research-assistant
npm install
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
OPENROUTER_API_KEY=sk-or-v1-...
SERPER_API_KEY=your_serper_key
DISCORD_BOT_TOKEN=your_bot_token       
DISCORD_CHANNEL_ID=your_channel_id      
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
versal : https://company-research-assistant-one.vercel.app/

### Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter AI models |
| `SERPER_API_KEY` | Yes | API key for Serper.dev Google search |
| `DISCORD_BOT_TOKEN` | No | Discord bot token for report notifications |
| `DISCORD_CHANNEL_ID` | No | Discord channel ID to post reports |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (OpenRouter referer header) |

## Usage

1. Select an AI model from the sidebar
2. Enter a company name (e.g. `Microsoft`) or URL (e.g. `https://stripe.com`)
3. Press **Enter** to start research
4. Watch progress: Searching → Crawling → Collecting → Analyzing → Generating
5. View the report in chat and click **Download PDF**

### Discord Integration

1. Go to **Settings** (sidebar or `/settings`)
2. Enter your **Applicant Name** and **Applicant Email**
3. Set `DISCORD_BOT_TOKEN` and `DISCORD_CHANNEL_ID` in server environment variables
4. After each successful report, the app auto-posts to Discord with the PDF attached

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── config/      # Server config status
│   │   ├── discord/     # Discord notification
│   │   ├── models/      # OpenRouter model list
│   │   ├── pdf/         # PDF generation
│   │   └── research/    # Main research pipeline (SSE)
│   ├── settings/        # Discord & applicant settings
│   └── page.tsx         # Main chat interface
├── components/          # UI components
├── lib/
│   ├── crawler.ts       # Website crawler
│   ├── discord.ts       # Discord bot integration
│   ├── openrouter.ts    # AI analysis
│   ├── pdf-generator.ts # PDF report builder
│   ├── research.ts      # Research orchestration
│   ├── serper.ts        # Serper search
│   └── utils.ts         # Helpers
└── types/               # TypeScript types
```

## Deploy to Vercel

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Project Settings → Environment Variables
4. Deploy

```bash
npx vercel --prod
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/research` | Run full research pipeline (SSE stream) |
| GET | `/api/models` | List OpenRouter models |
| POST | `/api/pdf` | Generate PDF from report JSON |
| POST | `/api/discord` | Send report to Discord |
| GET | `/api/config` | Check which services are configured |

## License

MIT
