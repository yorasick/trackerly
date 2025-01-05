require('dotenv').config();

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
const fs = require('fs');

const API_ID = Number(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const GROUP_ID = Number(process.env.GROUP_ID);

const FILE_NAME = 'push_up_totals.json';

// Utility to prompt user input
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

(async () => {
    // Load session string from file if it exists
    let sessionString = '';
    let pushUpCounts = {};
    let lastOffsetId = 0;

    if (fs.existsSync(FILE_NAME)) {
        const data = JSON.parse(fs.readFileSync(FILE_NAME, 'utf8'));
        sessionString = data.sessionString || '';
        pushUpCounts = data.totals || {};
        lastOffsetId = data.lastOffsetId || 0;
    }

    const client = new TelegramClient(new StringSession(sessionString), API_ID, API_HASH, { connectionRetries: 5 });

    if (!sessionString || sessionString.trim() === '') {
        await client.start({
            phoneNumber: async () => prompt('Enter your phone number: '),
            password: async () => prompt('Enter your password: '),
            phoneCode: async () => prompt('Enter the code you received: '),
            onError: (err) => console.error(err),
        });
        console.log('Session initialized. Saving session string to file.');
        sessionString = client.session.save();
        fs.writeFileSync(FILE_NAME, JSON.stringify({ totals: pushUpCounts, lastOffsetId, sessionString }, null, 2));
    } else {
        await client.connect();
        console.log('Session restored using saved session string.');
    }

    console.log('You are logged in!');

    // Fetch the group entity
    // const me = await client.getMe();
    const group = await client.getEntity (GROUP_ID).catch(error => {
        console.error(`Failed to find group "${GROUP_ID}"`);
        throw error;
    });

    // Regular expression to match messages that contain only numbers
    const numberRegex = /^\d+$/;

    // Fetch messages from the group after the last processed offsetId
    let offsetId = lastOffsetId;
    while (true) {
        const messages = await client.getMessages(group, { limit: 100, reverse: true, minId: offsetId });

        if (messages.length === 0) break;

        for (const message of messages) {
            if (message.id <= lastOffsetId) {
                break;
            }

            if (message.text && numberRegex.test(message.text)) {
                const userName = message.sender?.username || message.sender?.firstName || `User ${message.senderId}`;
                const pushUps = parseInt(message.text, 10);

                if (!pushUpCounts[userName]) {
                    pushUpCounts[userName] = 0;
                }
                pushUpCounts[userName] += pushUps;
            }

            lastOffsetId = Math.max(lastOffsetId, message.id);
        }

        offsetId = messages[messages.length - 1].id;
    }

    console.log('Push-Up Totals:', JSON.stringify(pushUpCounts, null, 2));

    // Write updated totals, offsetId, and session string to the file
    fs.writeFileSync(FILE_NAME, JSON.stringify({ totals: pushUpCounts, lastOffsetId, sessionString }, null, 2));

    console.log('Push-Up totals and session string updated and written to push_up_totals.json');
    await client.disconnect();
})();