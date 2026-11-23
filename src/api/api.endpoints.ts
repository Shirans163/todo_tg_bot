import type { NextFunction, RequestHandler, Response, Request } from 'express';
import express from 'express';
import * as dbRepository from '../db/db.repository.ts';
import * as middlewares from './api.middlewares.ts'

const app = express();
app.use(express.json())
app.use(middlewares.authMiddleware)

const port = Number(process.env.ENDPOINTS_PORT);

// start server
async function startServer() {
    try {
        await dbRepository.initDatabase();

        app.listen(port, '127.0.0.1', () => {
            console.log(`Server started on port ${port}`);
        });

    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exitCode = 1;
    };
};

// ----- TASKS ENDPOINTS -----

// add task endpoint
app.post(`/api/:userId/tasks`, 
        middlewares.validateReq('body', {userId: {type: 'string', maxLength: 19, digitsOnly: true}, title: {type: 'string', maxLength: 255}, description: {type: 'string', maxLength: 255, mayBeNull: true}}),
        async (req: Request, res: Response) => {

            const body = req.body;

            const dbRes = await dbRepository.addTask(body.userId, body.title, body.description);

            res.status(201).json({
                message: 'Task created',
                data: dbRes
            });
});

// get task endpoint
app.get(`/api/:userId/tasks/:taskId`, 
        middlewares.validateReq('params', {userId: {type: 'string', maxLength: 19, digitsOnly: true}, taskId: {type: 'string', maxLength: 19, maxValue: 2147483647, digitsOnly: true}}),
        async (req: Request, res: Response) => {

            const params = req.params;

            const dbRes = await dbRepository.getTask(String(params.userId), Number(params.taskId));

            res.status(201).json({
                message: 'Task received',
                data: dbRes
            });
});

// get all task endpoint
app.get(`/api/:userId/tasks`, 
        middlewares.validateReq('params', {userId: {type: 'string', maxLength: 19, digitsOnly: true}}),
        async (req: Request, res: Response) => {

            const params = req.params;

            const dbRes = await dbRepository.getAllTasks(String(params.userId));

            res.status(201).json({
                message: 'Tasks received',
                data: dbRes
            });
});

// update task status endpoint
app.patch(`/api/:userId/tasks/:taskId`, 
        middlewares.validateReq('body', {status: {type: 'statusType'}, userId: {type: 'string', maxLength: 19, digitsOnly: true}, taskId: {type: 'number', maxValue: 2147483647}}),
        async (req: Request, res: Response) => {
        
        const body = req.body;

        const dbRes = await dbRepository.updateStatusTask(body.status, body.userId, body.taskId);

        res.status(201).json({
            message: 'Task status updated',
            data: dbRes
        });
});

// delete task endpoint
app.delete(`/api/:userId/tasks/:taskId`, 
        middlewares.validateReq('params', {userId: {type: 'string', maxLength: 19, digitsOnly: true}, taskId: {type: 'string', maxLength: 19, maxValue: 2147483647, digitsOnly: true}}),
        async (req: Request, res: Response) => {
            
            const params = req.params;

            const dbRes = await dbRepository.deleteTask(String(params.userId), Number(params.taskId));

            res.status(201).json({
                message: 'Task deleted',
                data: dbRes
            });
});

// ----- USERS ENDPOINTS -----

// get user
app.get(`/api/:userId`, 
        middlewares.validateReq('params', {userId: {type: 'string', maxLength: 19, digitsOnly: true}}),
        async (req: Request, res: Response) => {

            const params = req.params;

            const dbRes = await dbRepository.getUser(String(params.userId));

            res.status(201).json({
                message: 'User received',
                data: dbRes
            });
});

// delete user
app.delete(`/api/:userId`, 
        middlewares.validateReq('params', {userId: {type: 'string', maxLength: 19, digitsOnly: true}}),
        async (req: Request, res: Response) => {

            const params = req.params;

            const dbRes = await dbRepository.deleteUser(String(params.userId));

            res.status(201).json({
                message: 'User deleted',
                data: dbRes
            });
});

// add user
app.post(`/api/:userId`, 
        middlewares.validateReq('body', {userId: {type: 'string', maxLength: 19, digitsOnly: true}}),
        async (req: Request, res: Response) => {

            const body = req.body;


            const dbRes = await dbRepository.addUser(body.userId);


            res.status(201).json({
                message: 'User added',
                data: dbRes
            });
});

export const serverStart = () => startServer()