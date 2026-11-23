import { type Context } from "grammy";
import { type Conversation } from "@grammyjs/conversations";
import * as fetchBuilders from './bot.handlers.ts';

type statusType = 'true' | 'in progress' | 'false'

// delete task conversation
async function deleteTaskConversation( conversation: Conversation, ctx: Context ) {
    await ctx.reply("Какую задачу вы хотите удалить?");

    while (true) {
        const response = await conversation.waitFor('message:text');
        const taskId = Number(response.message.text);

        if (Number.isInteger(taskId) && taskId > 0 ) {
            try {
                const req = await conversation.external(
                    () => fetchBuilders.noBodyFetchBuilder(`/api/${ctx.from?.id}/tasks/${taskId}`, 'DELETE'),
                );

                await ctx.reply(`Ответ от сервера: ${req.message}`);
                break;
            } catch (error) {
                console.error(error);
                await ctx.reply('Произошла ошибка при выполнении запроса');
                break;
            };
        };

        await ctx.reply('Пожалуйста, введите положительное целое число');
    };
};

// add task conversation
async function addTaskConversation ( conversation: Conversation, ctx: Context ) {
    await ctx.reply("Напишите заголовок задачи");
    const resTitle = await conversation.waitFor('message:text');

    await ctx.reply('Напишите описание задачи (либо "Далее" что бы пропустить)');
    const resDescription = await conversation.waitFor('message:text');

    const descriptionText = resDescription.message.text.trim();

    const description = descriptionText.toLowerCase() === 'далее' ? null : descriptionText;

    try {    
        const req = await conversation.external(
            () => fetchBuilders.bodyFetchBuilder(`/api/${ctx.from?.id}/tasks`, 'POST', {userId: String(ctx.from?.id), title: resTitle.message.text, description: description}),
        );

        await ctx.reply(`Ответ от сервера: ${req.message}`);
    } catch (error) {
        console.error(error);
        await ctx.reply('Произошла ошибка при выполнении запроса');
    };
};

// change task status conversation
async function changeTaskStatusConversation( conversation: Conversation, ctx: Context ) {
    await ctx.reply("Статус какой задачи вы хотите изменить?");

    while (true) {
        const response = await conversation.waitFor('message:text');
        const taskId = Number(response.message.text);

        if (Number.isInteger(taskId) && taskId > 0 ) {
            let status: statusType | null = null;
            while (true) {
                await ctx.reply('Какой статус вы хотите задать? (true, in progress или false)');
                const booleanRes = await conversation.waitFor('message:text');
                
                if ( booleanRes.message.text === 'true' ) {
                    status = 'true';
                    break;
                } else if ( booleanRes.message.text === 'false' ) {
                    status = 'false';
                    break;
                } else if ( booleanRes.message.text === 'in progress' ) {
                    status = 'in progress';
                    break;
                } else {
                    await ctx.reply('Пожалуйста, введите корректное значение');
                };
            };

            try {
                const req = await conversation.external(
                    () => fetchBuilders.bodyFetchBuilder(`/api/${ctx.from?.id}/tasks/${taskId}`, 'PATCH', {status: status, userId: String(ctx.from?.id), taskId: taskId}),
                );

                await ctx.reply(`Ответ от сервера: ${req.message}`);
                break;
            } catch (error) {
                console.error(error);
                await ctx.reply('Произошла ошибка при выполнении запроса');
                break;
            };
        };

        await ctx.reply('Пожалуйста, введите положительное целое число');
    };
};

export {
    deleteTaskConversation,
    addTaskConversation,
    changeTaskStatusConversation,
};