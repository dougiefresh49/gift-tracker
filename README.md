<p align="center">
  <img src="public/logo-full.webp" alt="Gift Tracker Logo" width="320"  />
</p>

<h1 align="center">Gift Tracker</h1>

<p align="center">
  A Next.js application built with the T3 Stack for tracking family Christmas gifts.<br/>
  Features real-time updates via Supabase, filtering, sorting, grouping, and budget tracking.
</p>

## Features

- **Stock View**: Browse all available gifts with search, filters, sorting, and grouping by gifter/recipient
- **Santa's List**: Toggle to view secret Santa items
- **My Picks**: See and manage your claimed gifts
- **Budgets**: Track spending limits with visual progress bars
- **Reconciliation**: Calculate and settle who owes what after gift exchanges
- **Multi-Recipient Gifts**: Assign gifts to multiple people with split budget costs
- **Return Tracking**: Mark items as needing return or already returned
- **Admin Panel**: Import master data, manage people, and budgets

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (UI Components)
- **Supabase** (Database & Realtime)
- **Zod** (Validation)
- **Lucide React** (Icons)

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_key_here
```

**Note**: The `.env.local` file is gitignored and should not be committed. Make sure to add these variables to your deployment platform (Vercel, etc.) as well.

3. Set up the database:

Run the SQL schema in your Supabase SQL Editor (see `docs/supabase-schema.sql`):

```sql
-- Copy the contents of docs/supabase-schema.sql
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Initial Setup

1. On first launch, select your name from the onboarding modal (or add yourself)
2. Optionally set up spending budgets for each recipient
3. Go to the **Admin** tab to import gifts via JSON paste
4. Start claiming gifts!

## Usage

### Claiming Gifts

- Click **Claim** to assign a gift to yourself
- Use the dropdown arrow to assign to another family member
- Click the **"For [Name]"** badge to quickly change the recipient

### Editing Gifts

- Click the pencil icon on any gift card to edit details
- Toggle "Santa Item" to move items between Stock and Santa's List

### Budgets

- Go to **Admin** → **Add Budget** to set spending limits
- View progress in the **Budgets** tab
- Visual warnings appear when over budget

### Backup & Restore

- **Export**: Copies all data to clipboard as JSON
- **Import**: Paste JSON backup to restore data
- **Wipe**: Deletes all data (use with caution!)

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── actions/          # Server Actions for database operations
├── components/       # React components
│   ├── forms/       # Form components
│   ├── ui/          # shadcn/ui components
│   └── views/       # Tab view components
├── contexts/         # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utilities (Supabase, schemas, types)
└── styles/          # Global styles
```

## Environment Variables

| Variable                                       | Description                   | Required |
| ---------------------------------------------- | ----------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Your Supabase project URL     | Yes      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Your Supabase publishable key | Yes      |

## Database Schema

The app uses the following tables:

- **profiles**: Family members
- **gifts**: Gift items with status, recipient, claimer, purchaser, and return status
- **budgets**: Spending limits between gifter and recipient pairs
- **gift_recipients**: Join table for multi-recipient gifts
- **gift_tags**: Tags for categorizing gifts
- **reconciliations**: Settlement records for gift exchanges

See `docs/supabase-schema.sql` for the full schema.

## Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## License

MIT
