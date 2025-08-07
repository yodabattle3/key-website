// index.js
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = express();
app.use(express.json());

const SELLER_KEY = "df8ca05cf976f28b6ca77d565d4f360c";
const WEBHOOK_URL = "https://discord.com/api/webhooks/1402897204984938557/NxVCabRoKVfgwXcT3Oqn8PYaOZDlSpvSeAVhk4TBuR5tyP76UEktF39dDuPNL034RJqF"; // For HWID logs

function randomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `YODA-${segment()}-${segment()}`;
}

// Slash command register
const commands = [
    new SlashCommandBuilder()
        .setName('generatekey')
        .setDescription('Generate a YODA key')
];
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
    );
    console.log("✅ Commands registered.");
})();

// Slash command handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'generatekey') {
        const mask = randomKey();
        const url = `https://keyauth.win/api/seller/?sellerkey=${SELLER_KEY}&type=add&expiry=1&mask=${mask}&level=1&amount=1`;
        const res = await fetch(url);
        const data = await res.text();
        await interaction.reply(`✅ Key generated: **${mask}**`);
        console.log(`Generated Key: ${mask} | Response: ${data}`);
    }
});

// Roblox POST route for HWID logging
app.post('/loghwid', async (req, res) => {
    const { key, hwid, username } = req.body;
    if (!key || !hwid || !username) return res.status(400).send('Missing fields');

    // Validate with KeyAuth
    const checkUrl = `https://keyauth.win/api/seller/?sellerkey=${SELLER_KEY}&type=info&key=${key}`;
    const checkRes = await fetch(checkUrl);
    const checkData = await checkRes.json();

    if (!checkData || checkData.message?.includes("Key not found")) {
        return res.status(403).send('Invalid key');
    }

    // Send log to Discord
    await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `🔑 Key Used!\n**Key:** ${key}\n**User:** ${username}\n**HWID:** ${hwid}`
        })
    });

    console.log(`HWID logged: ${hwid} for ${username}`);
    res.send('OK');
});

client.login(process.env.BOT_TOKEN);
app.listen(3000, () => console.log("🌐 API running on port 3000"));
