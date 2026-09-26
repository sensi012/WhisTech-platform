# `database` Folder Explanation

This folder contains the **Database Migrations**. Migrations are essentially version control for your database. Instead of manually clicking around to create tables, we write SQL code to do it. The system runs these files automatically when the app starts, guaranteeing the database always has the correct structure.

---

### `migrations/001_create_tasks.sql`
This file creates the main filing cabinet (table) for our tasks.

* **`-- WhisTech Platform — initial schema`**: A comment just explaining what the file is.
* **`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`**: This line tells PostgreSQL to turn on a special plugin called `pgcrypto`. We need this plugin so the database can generate random, unguessable ID numbers (UUIDs) for our tasks.
* **`CREATE TABLE IF NOT EXISTS tasks (`**: This says "create a table named 'tasks' if one doesn't already exist."
* **`id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`**: Creates an `id` column. `UUID` means it's a long random string. `PRIMARY KEY` means every task MUST have a unique ID. `DEFAULT gen_random_uuid()` tells the database to automatically create this random ID whenever we add a new task.
* **`title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),`**: Creates a `title` column (up to 255 characters). `NOT NULL` means a task *must* have a title. The `CHECK` rule ensures the title isn't just empty spaces.
* **`description TEXT,`**: Creates a column for a longer description. It's optional.
* **`status VARCHAR(20) NOT NULL DEFAULT 'todo'`**: Creates a `status` column. If we don't provide one, it defaults to 'todo'.
* **`CHECK (status IN ('todo','in_progress','done','cancelled')),`**: This is a strict rule that says the status can ONLY be one of these four exact words. If the API tries to save a status like 'sleeping', the database will reject it.
* **`priority VARCHAR(20) NOT NULL DEFAULT 'medium'`**: Similar to status, but for priority. Defaults to 'medium'.
* **`CHECK (priority IN ('low','medium','high','critical')),`**: Strict rule allowing only these four priorities.
* **`due_date TIMESTAMPTZ,`**: An optional column for a due date, saving the exact time and time zone.
* **`created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),`**: Automatically records exactly when the task was created using the `NOW()` function.
* **`updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`**: Records when the task was last updated. Initially set to the creation time.

---

### `migrations/002_add_indexes.sql`
This file speeds up our database and adds an automatic helper function.

* **`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);`**: This creates an "index". Think of an index like the index at the back of a textbook. If you want to find all tasks that are 'done', the database doesn't have to read every single row; it just looks at the index to find them instantly.
* **`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);`**: Speeds up searching for tasks by priority (e.g., finding all 'critical' tasks).
* **`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date) WHERE due_date IS NOT NULL;`**: Speeds up searching by due date, but only bothers to index tasks that actually have a due date.
* **`CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks (created_at DESC);`**: Speeds up sorting tasks by newest first (`DESC` means descending order).

#### The Automatic Helper (Trigger)
* **`CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$ ... $$ LANGUAGE plpgsql;`**: This defines a custom function. The code inside (`NEW.updated_at = NOW(); RETURN NEW;`) says: "Whenever a row is being saved, automatically change the `updated_at` time to the current exact time."
* **`DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;`**: Deletes the trigger if it already exists (so this file can be run safely multiple times).
* **`CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();`**: This links the function we just made to the `tasks` table. It tells the database: "Right *before* anyone updates a row in the tasks table, automatically run my `set_updated_at` function." This guarantees we never forget to record when a task was modified!
