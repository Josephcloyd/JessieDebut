# Setup and deployment

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com). Choose the Southeast Asia (Singapore) region so it is close to your guests.
2. Copy `.env.example` to `.env.local`.
3. From **Project Settings > API**, fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon or publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY` (the service-role or secret key). Keep this private. Never share it or add `NEXT_PUBLIC_` to its name.
4. Set `CRON_SECRET` to any long random string.

## 2. Create the database

Docker is not needed for this.

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
npx supabase db query --remote --file supabase/seed.sql
```

If you prefer the website, open the **SQL Editor** and run each file in `supabase/migrations/` in name order, then `supabase/seed.sql`.

## 3. Lock down sign-ups

In **Authentication > Sign In / Providers**, turn off **Allow new users to sign up**. Only accounts you create with the next step can exist.

## 4. Create the admin account

```bash
npm run create-admin -- you@example.com "a long, unique password"
```

Sign in at `/admin`. Passwords must be at least 12 characters. To add another admin, run the command again with their email.

## 5. Deploy to Vercel

1. Import the project in Vercel, or run `vercel` in this folder.
2. Add every variable from `.env.local` under **Settings > Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your real address with no trailing slash. Personal links and QR codes are built from it.
3. Deploy. Vercel reads `vercel.json` and runs the daily keep-alive job, which stops a free Supabase project from pausing.
4. In Supabase, under **Authentication > URL Configuration**, set the Site URL to the same address.

## 6. Prepare the invitation

1. **Event Information** and **Hero Section**: enter the real details and photos, then press **Save Changes**.
2. **Preview Website** to check, then **Publish Changes**.
3. **Gallery**, **18 Traditions**, **Program** and **Music**: these go live as you save.
4. **RSVP & Guests**: add guests. Each gets a personal link and QR code from the QR button.

## Running the full browser test

Run this against a test project or before real guests respond, because it adds and then removes test records. It also changes the venue name and publishes it, so re-enter your venue afterward.

```powershell
$env:E2E_ADMIN_EMAIL = "you@example.com"
$env:E2E_ADMIN_PASSWORD = "your password"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your service-role key"
npm run test:e2e
```

## Limits to keep in mind

- The free Supabase plan includes 1 GB of storage. Photos are resized to about 3 MB or less before upload.
- The site doesn't send email. Share invitations by personal link or QR code.
- Removing a hero or portrait image doesn't delete the old file, because the published page may still be using it.
