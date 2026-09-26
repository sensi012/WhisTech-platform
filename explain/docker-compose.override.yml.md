# `docker-compose.override.yml` (Line by Line Explanation)

This file acts as a **"Local Development Cheat Code."** When you run `docker compose up` on your own laptop, Docker automatically merges this file with the base `docker-compose.yml`. It temporarily alters the rules so you can write and test code easily without having to rebuild the containers every 5 minutes.

---

* **`services:`**: Begins the list of services we are modifying.

* **`db:`**: Modifying the database rules.
  * **`ports: - "5432:5432"`**: In the base file, the database is hidden inside Docker. This line drills a temporary hole (port 5432) from your laptop directly into the database. This allows you to use a visual database tool (like DBeaver or pgAdmin) on your computer to look at the tables inside Docker.

* **`api:`**: Modifying the Node.js backend rules.
  * **`build: target: deps`**: The base file builds the container all the way to the final `production` stage (which deletes developer tools to save space). This line tells Docker: "Stop building at the `deps` stage." This ensures we keep our testing and development tools installed.
  * **`command: ["npx", "nodemon", "--watch", "src", "src/index.js"]`**: Overrides the default startup command. It uses a tool called `nodemon` to watch the `/src` folder. Every time you hit "Save" on your keyboard, `nodemon` instantly restarts the backend.
  * **`environment: NODE_ENV: development` & `LOG_LEVEL: debug`**: Tells the API to turn on "development mode," which prints out highly detailed error messages in the console to help you debug problems.
  * **`volumes: - ./services/api/src:/app/src:ro`**: **(The Magic Trick!)** This creates a live wormhole between your laptop's `src` folder and the container's `/app/src` folder. When you edit code on your computer, the container instantly sees the changes. `:ro` means Read-Only (the container can read your files, but can't accidentally delete them).
  * **`volumes: - ./database:/app/database:ro`**: Creates a live wormhole for your database migration scripts.
  * **`ports: - "3000:3000"`**: Exposes the API to your laptop's browser at `localhost:3000` so you can test it directly.

* **`frontend:`**: Modifying the React rules.
  * **`build: target: builder`**: Stops the Dockerfile build at Stage 1 (the Node.js kitchen). We do this because we want to use React's built-in development server (which supports live reloading) instead of the Nginx server used in production.
  * **`command: ["npm", "start"]`**: Starts the React development server.
  * **`environment: REACT_APP_API_URL: /api`**: Tells React exactly where to find the backend API.
  * **`environment: CHOKIDAR_USEPOLLING: "true"`**: A special fix specifically for Windows users. It forces Docker to double-check if you saved a file, ensuring hot-reloading always triggers correctly.
  * **`volumes: - ./services/frontend/src:/app/src:ro`**: The live wormhole for your React code. Edit a file on your laptop, and the browser instantly updates!
  * **`ports: - "3001:3000"`**: Maps the container's port 3000 to your laptop's port **3001**. You will view the website in your browser at `localhost:3001`. (We use 3001 on the outside so it doesn't crash into the API, which is using 3000).
