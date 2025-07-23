# PlayerZero

A comprehensive leaderboard and stat tracking system for Pokemon GO players.

## Features

- **User Profiles & Authentication**: Complete profile setup with trainer details, stats, and screenshots
- **Real-time Leaderboards**: Weekly, monthly, and all-time rankings with filtering by country and team
- **Historical Period Tracking**: Automatic weekly/monthly resets with winner preservation
- **Stat Tracking**: Track XP, catches, distance, PokéStops, and Pokédex completion
- **Premium Features**: Advanced search, profile viewing, and detailed analytics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Historical Period System

The app now includes an advanced historical period tracking system that:

### Automatic Resets
- **Weekly Reset**: Every Monday at 0:00 UTC (Monday-Sunday weeks)
- **Monthly Reset**: Every 1st day of the month at 0:00 UTC
- **Winner Preservation**: Top 3 winners from each completed period are permanently saved

### Features
- View completed period results (Last Week, Last Month)
- Historical winners displayed prominently above current leaderboards
- Automatic period completion with winner calculation
- Comprehensive period boundary tracking

### Setup Instructions

#### 1. Database Migration
Run the historical periods migration:
```sql
-- Apply the migration file
supabase/migrations/20240322000000_add_historical_periods.sql
```

#### 2. Scheduled Function Setup
The system includes an automatic period completion function. To enable automatic resets:

1. Deploy the edge function:
```bash
supabase functions deploy period-completion
```

2. Set up a scheduled trigger (via external cron service or Supabase scheduled functions):
```bash
# Example: Daily check at 1:00 AM UTC
curl -X POST 'https://your-project.supabase.co/functions/v1/period-completion' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

3. Or set up via GitHub Actions/CI for automatic daily execution

#### 3. Manual Period Completion
You can also manually complete periods using SQL:
```sql
SELECT check_and_complete_periods();
```

### Period System Architecture

#### Tables
- `period_boundaries`: Tracks period start/end dates and completion status
- `period_winners`: Stores top 3 winners for each completed period

#### Views
- `last_week_winners`: Current week's historical winners
- `last_month_winners`: Current month's historical winners
- `current_weekly_leaderboard`: Live weekly rankings
- `current_monthly_leaderboard`: Live monthly rankings

#### Functions
- `get_current_week_start()`: Returns start of current week (Monday)
- `get_current_month_start()`: Returns start of current month
- `complete_period()`: Completes a period and records winners
- `check_and_complete_periods()`: Checks and completes any outstanding periods

## Development

### Prerequisites
- Node.js 18+
- Supabase CLI
- PostgreSQL (via Supabase)

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally
```bash
npm run dev
```

### Database Setup
```bash
supabase start
supabase db push
```

### Deploying Edge Functions
```bash
supabase functions deploy period-completion
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Styling**: CSS Custom Properties + Responsive Design
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Payments**: Stripe Integration

## Database Schema

### Core Tables
- `profiles`: User profiles and trainer information
- `stat_entries`: Historical stat tracking
- `period_boundaries`: Period management
- `period_winners`: Historical winners
- `notifications`: User notifications

### Key Features
- Row Level Security (RLS) enabled
- Automatic stat entry creation
- Period boundary management
- Winner calculation and preservation
- Real-time leaderboard views

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure migrations work
5. Submit a pull request

## License

This project is licensed under the MIT License.
