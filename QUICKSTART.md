# Quick Start Guide

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Create Environment File

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pyxavkycmilynijabznx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_G27n4bKEm5mIyxXXJ8elKQ_LXOjuKBQ
```

## 3. Verify Database Setup

Make sure you've run the SQL schema in your Supabase SQL Editor (see `docs/supabase-schema.sql`).

## 4. Start Development Server

```bash
pnpm dev
```

## 5. Initial Data Import

1. Open http://localhost:3000
2. Go to the **Admin** tab (bottom navigation)
3. Click **Run Master Import** to populate the database
4. Select your name from the header dropdown
5. Start claiming gifts!

## Troubleshooting

### Build Errors About Environment Variables

If you see errors about missing environment variables during build, make sure:
- `.env.local` exists in the root directory
- The file contains both required variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
- You're running `pnpm dev` (not `pnpm build`) for development

### Database Connection Issues

- Verify your Supabase URL and key are correct
- Check that Row Level Security (RLS) policies are set to allow public access
- Ensure the tables (profiles, gifts, budgets) exist in your Supabase project

