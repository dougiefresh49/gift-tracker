# Christmas Gift Tracker

A Next.js application built with the T3 Stack for tracking family Christmas gifts. Features real-time updates via Supabase, filtering, sorting, and budget tracking.

## Features

- **Stock View**: Browse all available gifts with search, filters, and sorting
- **Santa's List**: View secret Santa items (grayscale until hover)
- **My Picks**: See and manage your claimed gifts
- **Budgets**: Track spending limits with visual progress bars
- **Admin Panel**: Import master data, backup/restore, and manage database

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
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

1. Go to the **Admin** tab
2. Click **Run Master Import** to populate the database with the master gift list
3. Select your name from the dropdown in the header
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
├── components/       # React components
│   ├── forms/       # Form components
│   └── views/       # Tab view components
├── data/            # Static data (master import)
├── hooks/           # Custom React hooks
├── lib/             # Utilities (Supabase, schemas, types)
└── styles/          # Global styles
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Yes |

## Database Schema

The app uses three main tables:

- **profiles**: Family members
- **gifts**: Gift items with status, recipient, and claimer
- **budgets**: Spending limits between gifter and recipient pairs

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

