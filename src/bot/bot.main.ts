import { Bot, GrammyError, HttpError, Keyboard, type Context, type NextFunction } from "grammy";
import { conversations, createConversation, type ConversationFlavor, type Conversation } from "@grammyjs/conversations";
import * as fetchBuilders from "./bot.handlers.ts";
import * as conversationsMod from "./bot.conversations.ts";

type MyContext = ConversationFlavor<Context>;
const bot = new Bot<MyContext>(process.env.API_TOKEN!);

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
};

bot.use(async (ctx: MyContext, next: NextFunction) => {
    if (!ctx.from) {
        return; 
    }
    await next();
});

bot.api.setMyCommands([
    { command: 'start', description: 'зарегистрироваться', },
    { command: 'menu', description: 'открыть меню', }
]);

bot.command('start', async (ctx: MyContext) => {
    try { 
        const dbRes = await fetchBuilders.bodyFetchBuilder(`/api/${ctx.from?.id}`, 'POST', {userId: String(ctx.from?.id)});

        if ( dbRes.data !== undefined ) {
            await ctx.reply(`Ответ от сервера: ${dbRes.message}`);
        } else {
            await ctx.reply('Пользователь с таким id уже существует');
        };
    } catch (error: any) {
        console.error(error);
        await ctx.reply('Произошла ошибка при выполнении запроса');
    };
});

bot.use(async (ctx: MyContext, next: NextFunction) => {
    try {
        const dbRes = await fetchBuilders.noBodyFetchBuilder(`/api/${ctx.from?.id}`, 'GET');
        if ( dbRes.data !== undefined ) { await next(); }
        else { await ctx.reply('Вы не зарегистрированны') };
    } catch (error) {
        await ctx.reply('Unkown error')
    };

});

bot.use(conversations());
bot.use(createConversation(conversationsMod.deleteTaskConversation));
bot.use(createConversation(conversationsMod.addTaskConversation));
bot.use(createConversation(conversationsMod.changeTaskStatusConversation));

bot.command('menu', async (ctx: MyContext) => {
    const menuKeyboard = new Keyboard().text('Просмотреть задачи').text('Добавить задачу').row().text('Удалить задачу').text('Изменить статус задачи').resized();
    await ctx.reply('Выберите действие', {
        reply_markup: menuKeyboard
    });
});

bot.hears('Просмотреть задачи', async (ctx: MyContext) => {
    try {
        const dbRes = await fetchBuilders.noBodyFetchBuilder(`/api/${ctx.from?.id}/tasks`, "GET")
        const response: string[] = [];

        if (dbRes.data.length === 0) {
            await ctx.reply('У вас пока нет задач');
            return;
        }
        
        for ( let i: number = 0; i < dbRes.data.length; i++ ) {
            let status = '⚫';
            if ( dbRes.data[i].completed === 'true' ) { status = '🟢' }
            else if ( dbRes.data[i].completed === 'in progress' ) { status = '🟡' }
            else if ( dbRes.data[i].completed === 'false' ) { status = '🔴' };
            i !== (dbRes.data.length - 1)
            ? response.push(`<b>#${dbRes.data[i].id} | ${status} - ${escapeHtml(dbRes.data[i].title)}</b>\n${dbRes.data[i].description !== null ? escapeHtml(dbRes.data[i].description) : ''}\n`)
            : response.push(`<b>#${dbRes.data[i].id} | ${status} - ${escapeHtml(dbRes.data[i].title)}</b>\n${dbRes.data[i].description !== null ? escapeHtml(dbRes.data[i].description) : ''}`);
        };

        await ctx.reply(response.join(''), {
            parse_mode: 'HTML',
        });
    } catch (error: any) {
        console.error(error);
        await ctx.reply('Произошла ошибка при выполнении запроса');
    };
});

bot.hears('Добавить задачу', async (ctx: MyContext) => {
    await ctx.conversation.enter("addTaskConversation");
});

bot.hears('Удалить задачу', async (ctx: MyContext) => {
    await ctx.conversation.enter("deleteTaskConversation");
});

bot.hears('Изменить статус задачи', async (ctx: MyContext) => {
    await ctx.conversation.enter("changeTaskStatusConversation");
});

bot.catch((err: any) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const error = err.error;

    if ( error instanceof GrammyError ) {
        console.error('Error in request:', error.description);
    } else if ( error instanceof HttpError ) {
        console.error('Could not contact Telegram:', error);
    } else {
        console.error('Unkown error', error);
    };
});

export const startBot = () => bot.start();