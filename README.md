# StockAlert Backend

StockAlert is a US stock market alerting SaaS backend built with FastAPI, Supabase (PostgreSQL + Auth), and standard Python `asyncio` for background polling. It allows retail investors to build a personal watchlist and receive automated, event-driven alerts for stock price movements directly to their **Telegram** app. 

Market data is sourced in real-time from **Finnhub**.

## Prerequisites
- Python 3.10+
- A Supabase Project (for PostgreSQL Database & Authentication)
- A Finnhub API Key (Free tier works perfectly)
- A Telegram Bot Token (from `@BotFather`)

## 1. Installation

Clone the repository and set up a virtual environment:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
# source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt
```

## 2. Environment Variables
Create a `.env` file in the root directory (or modify the existing one) with the following keys:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
FINNHUB_API_KEY=your_finnhub_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# Optional:
# FMP_API_KEY=your_fmp_api_key
```

## 3. Supabase Database Schema
Run the following SQL in your Supabase SQL Editor to generate the required tables. *(Ensure you have also set up a Supabase Auth Trigger to automatically insert a row into `profiles` upon user signup).*

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  telegram_chat_id text,
  telegram_enabled boolean default true,
  created_at timestamptz default now()
);

create table watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  symbol text not null,
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

create table alert_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  symbol text not null,
  rule_type text not null,
  threshold numeric,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table alert_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  symbol text not null,
  rule_type text not null,
  message text not null,
  triggered_at timestamptz default now(),
  notified boolean default false
);
```

## 4. Running the Server

Start the FastAPI application natively using `uvicorn`:

```bash
uvicorn app.main:app --reload
```

When the server starts, it automatically boots up an `asyncio` background task that polls the Finnhub API **every 15 minutes** during active US Market Hours (9:30 AM - 4:00 PM EST). 

## 5. Usage & Testing

1. Navigate to **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
2. **Authenticate yourself**: 
   - You must pass a Supabase JWT Token to the API. 
   - Run `python get_token.py` in your terminal to log in as your Supabase test user and generate a raw Bearer token.
   - Click the green **Authorize** padlock in Swagger UI and paste your token.
3. **Link your Telegram**: 
   - Use the `POST /notifications/telegram/link` endpoint and provide your personal Telegram Chat ID.
4. **Create an Alert Rule**:
   - Use `POST /watchlist/{symbol}/rules` to set a threshold (e.g. `0.01` for guaranteed triggering). 
   - Wait up to 15 minutes (or restart the server to force an instant poll check) to receive the push notification on your phone!
