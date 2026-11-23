import * as db from './api/api.endpoints.ts';
import * as bot from './bot/bot.main.ts';

if (process.env.API_SECRET === undefined) {
    console.log('API_SECRET undefined!')
} else {
    db.serverStart();
    bot.startBot();
};