# Root Folder Explanations

This folder contains the core configuration files that control how the entire project runs, both on your local computer for development, and when it is pushed to production. 

---

### `.env.example`
This is a template file. It shows developers what environment variables (secret settings) they need to have to run the app. It's safe to commit to GitHub because it contains fake passwords.
- **`DB_HOST=db`**: Connects to the database container.
- **`DB_NAME=whistech` & `DB_USER=whistech`**: The database name and username.
- **`DB_PASSWORD=changeme_in_production`**: A fake placeholder password.

### `docker-compose.yml`
This is the **Base Docker Compose file**. It defines all the services (containers) that make up the app:
- **`db`**: The PostgreSQL database. It sets up health checks to ensure the DB is fully ready before letting other things connect to it.
- **`api`**: The backend Node.js server. It connects to the `db`.
- **`frontend`**: The React application. It connects to the `api`.
- **`nginx`**: The traffic cop that sits in front and routes traffic to either the `frontend` or the `api`.
- **`networks`**: It creates a `backend` network (only API and DB can talk) and a `frontend` network (Nginx can talk to API and Frontend). This is for security!

### `docker-compose.override.yml`
This file is for **Local Development only**. When you run `docker compose up` on your computer, Docker merges this file with the base `docker-compose.yml`.
- It changes commands to use things like `nodemon` and `npm start` so the app hot-reloads when you change code.
- It maps files from your computer into the containers so you don't have to rebuild the containers every time you edit a file.

### `docker-compose.prod.yml`
This file is for **Production only**. You use it when running the app on a real server. 
- Instead of building the code from your computer, it downloads the pre-built, tested images from AWS ECR (`${ECR_REGISTRY}/whistech/...`).
- It applies strict resource limits (like CPU and RAM limits) so one container can't crash the whole server.

### `README.md`
The front page of the project on GitHub. It explains the project architecture, how to run it locally, and lists the CI/CD pipeline steps.

### `.gitignore`
Tells Git (the version control system) which files and folders to *ignore*. 
- For example, we ignore `.env` because we never want to accidentally upload our real passwords to GitHub!
- We ignore `node_modules/` because it's massive and can be generated anytime using `npm install`.

### `.terraform-version`
A tiny file that tells Terraform which version of its software to use, keeping everyone on the team consistent.
