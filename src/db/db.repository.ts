import * as db from './db.init.ts';

interface iUsers {
    id: string;
    created_at: Date;
};

type statusType = 'true' | 'in progress' | 'false'

interface iTasks {
    id: number;
    user_id: string;
    title: string;
    description: string | null;
    completed: statusType;
    created_at: Date;
};

type tasksWithNumbering = {task_number: number} & iTasks;

// tables init
async function initDatabase(): Promise<void> {

    const tableUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT PRIMARY KEY,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await db.query(tableUsers);

    const tableTasks = `
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            completed VARCHAR(20) NOT NULL DEFAULT 'false',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await db.query(tableTasks);
};

// ----- TABLE TASKS FUNCTIONS -----

// add task (post)
async function addTask(userId: string, title: string, description: string | null): Promise<iTasks | undefined> {
    const res = await db.query(
        `INSERT INTO tasks (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [userId, title, description]
    );

    return res.rows[0];
};

// get task (get)
async function getTask(userId: string, taskId: number): Promise<tasksWithNumbering | undefined> {
    const res = await db.query(
        `SELECT * FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    ORDER BY id
                ) AS task_number
            FROM tasks
        ) AS numbered_tasks
        WHERE user_id = $1
        AND id = $2;`,
        [userId, taskId]
    );

    return res.rows[0];
};

// get all task (get)
async function getAllTasks(userId: string): Promise<tasksWithNumbering[] | []> {
    const res = await db.query(
        `SELECT * FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    ORDER BY id
                ) AS task_number
            FROM tasks
        ) AS numbered_tasks
        WHERE user_id = $1;`,
        [userId]
    );

    return res.rows;
};

// update task status (patch)
async function updateStatusTask(status: statusType, userId: string, taskId: number ): Promise<iTasks | undefined> {
    const res = await db.query(
        `UPDATE tasks SET completed = $1
        WHERE user_id = $2 AND id = $3
        RETURNING *`,
        [status, userId, taskId]
    );

    return res.rows[0];
};

// delete task (delete)
async function deleteTask(userId: string, taskId: number): Promise<tasksWithNumbering | undefined> {
    const res = await db.query(
        `WITH numbered_tasks AS (
            SELECT
                id,
                ROW_NUMBER() OVER (ORDER BY id) AS task_number
            FROM tasks
            WHERE user_id = $1
        )
        DELETE FROM tasks
        WHERE id = (
            SELECT id
            FROM numbered_tasks
            WHERE task_number = $2
        )
        AND user_id = $1
        RETURNING *;`,
        [userId, taskId]
    );

    return res.rows[0];
};

// ----- TABLE USERS FUNCTIONS -----

// add user
async function addUser(userId: string): Promise<iUsers | undefined> {
    const res = await db.query(
        `INSERT INTO users (id)
        VALUES ($1)
        ON CONFLICT (id) DO NOTHING
        RETURNING *;`,
        [userId]
    );

    return res.rows[0]
};

// get user
async function getUser(userId: string): Promise<iUsers | undefined> {
    const res = await db.query(
        `SELECT * FROM users
        WHERE id = $1`,
        [userId]
    );

    return res.rows[0];
};

// delete user
async function deleteUser(userId: string): Promise<iUsers | undefined> {
    const res = await db.query(
        `DELETE FROM users
        WHERE id = $1
        RETURNING *`,
        [userId]
    );

    return res.rows[0];
};


export {
    addTask,
    getTask,
    getAllTasks,
    updateStatusTask,
    deleteTask,
    getUser,
    deleteUser,
    initDatabase,
    addUser,
};