# `services/api` Folder Explanation

This folder is the **Backend API**, the "brain" of the application. It receives requests from the frontend, checks if they are valid, and then saves or retrieves information from the database. It is built using **Node.js** and **Express**.

---

### 1. `Dockerfile`
This file is the recipe to package the API into a Docker container.
* It uses a **multi-stage build**: First, it installs all dependencies (even heavy development ones). Then, in the `production` stage, it creates a secure, restricted user named `whistech` so the app doesn't run as the dangerous `root` user. Finally, it copies only the necessary code and starts the server.

### 2. `package.json`
This is the "ID card" for the API. It lists all the third-party code libraries the API needs to work (like `express` for the web server, `pg` to talk to the database, `zod` for checking data, and `pino` for logging).

### 3. `src/index.js`
This is the starting point (the front door) of the API.
* It sets up **Express** (the web server).
* It adds security layers like **Helmet** (hides server details from hackers) and **Rate Limiting** (stops people from spamming the server).
* It sets up a `/health` URL so AWS can check if the server is alive.
* **Graceful Shutdown**: At the bottom, there is code that says "if the server is told to stop, don't crash immediately! Finish handling the current users, close the database connection safely, and *then* turn off."

### 4. `src/db/pool.js`
This file sets up the **Connection Pool** to the PostgreSQL database. Instead of opening and closing a new connection every single time a user asks for data (which is slow), a "pool" keeps a bunch of connections open and ready to use instantly.

### 5. `src/db/migrate.js`
This is a smart helper script. When the API starts up, this script looks inside the `database/migrations` folder and automatically runs any SQL files that haven't been run yet. This ensures the database tables always exist before the API tries to use them.

### 6. `src/middleware/requestId.js`
This is a tiny script that stamps a unique ID (like a tracking number) on every single request that comes in. If an error happens, we can search the logs for that exact ID to see exactly what went wrong.

### 7. `src/middleware/validate.js`
This is the "bouncer" at the door. It uses a library called `Zod` to create strict rules (Schemas). For example, it says "A task MUST have a title, and the priority MUST be low, medium, high, or critical." If a user sends bad data, this file blocks it and sends a `400 Bad Request` error *before* it ever reaches the database.

### 8. `src/routes/tasks.js`
This file contains the actual business logic for tasks (CRUD: Create, Read, Update, Delete).
* **`router.get('/')`**: Fetches a list of tasks. It supports searching by `status` or `priority`, and handles pagination (showing 20 items at a time).
* **`router.get('/:id')`**: Fetches a single specific task.
* **`router.post('/')`**: Creates a new task. It passes through the `validate` bouncer first.
* **`router.patch('/:id')`**: Updates a task. It only updates the fields the user actually provided.
* **`router.delete('/:id')`**: Deletes a task.

### 9. `tests/tasks.test.js`
These are the automated tests. When a developer changes the code, this file runs a fake user through the system to make sure creating, reading, updating, and deleting tasks still works perfectly against a real database.
