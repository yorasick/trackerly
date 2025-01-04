# Telegram Push-Ups Tracker

This script tracks push-up counts from messages in a Telegram group, maintaining a running total for each participant.

## Prerequisites

- Node.js (v12 or higher)
- A Telegram account
- Telegram API credentials (API ID and API Hash)

## Setup

1.Install the dependencies:

```bash
npm install
```

2. Clone `.env.example` file, rename it to `.env` and fill in the following variables:

```bash
API_ID=
API_HASH=
GROUP_ID=
```

3. Run the script:

```bash
node push-ups-tracker.js
```

4. Follow the prompts to log in to your Telegram account and start tracking push-ups.

5. The script will save the session string to a file named `push_up_totals.json`. You can use this session string to log in to your Telegram account without needing to re-enter your API ID and API Hash.

6. To start tracking push-ups again, simply run the script again. The script will load the session string from the `push_up_totals.json` file and continue tracking from where you left off.

7. To stop tracking push-ups, simply exit the script. The session string will be saved to the `push_up_totals.json` file, so you can resume tracking from where you left off later.
