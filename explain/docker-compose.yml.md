# `docker-compose.yml` (Line by Line Explanation)

This is the **Base Docker Compose** file. It defines the blueprint for all four of our containers and how they connect to each other.

---

* **`services:`**: This marks the beginning of the list of containers we want to run.
* **`db:`**: Names the first container "db" (our database).
  * **`image: postgres:16.3-alpine3.20`**: Downloads the official PostgreSQL version 16.3. The `alpine` part means it's a super-lightweight version.
  * **`environment:`**: Sets environment variables (secret settings) for the database.
    * **`POSTGRES_DB: ${DB_NAME:-whistech}`**: Sets the database name. If `DB_NAME` isn't provided, default to `whistech`.
    * **`POSTGRES_USER: ${DB_USER:-whistech}`**: Sets the username.
    * **`POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}`**: Sets the password. If it is completely missing, Docker will throw an error and crash immediately to protect you.
  * **`volumes:`**: Maps data so it doesn't get deleted when the container shuts down.
    * **`- db_data:/var/lib/postgresql/data`**: Saves the actual database records to a permanent Docker volume named `db_data`.
    * **`- ./database/migrations:/docker-entrypoint-initdb.d:ro`**: Copies our SQL migration files into a special folder inside the database. When the database boots up for the first time, it automatically runs any SQL files found here. `:ro` means read-only.
  * **`healthcheck:`**: Automated monitoring to ensure the database is actually working.
    * **`test: ["CMD-SHELL", "pg_isready ..."]`**: The exact command Docker runs to check if the database is ready to accept connections.
    * **`interval: 10s` / `timeout: 5s` / `retries: 5`**: Check every 10 seconds, give up if it takes longer than 5 seconds, and declare it dead after 5 failures.
    * **`start_period: 20s`**: Give the database a 20-second grace period to boot up before starting the checks.
  * **`restart: unless-stopped`**: If the database crashes, Docker will automatically reboot it (unless a human manually clicks "stop").
  * **`networks: - backend`**: Connects this container exclusively to the `backend` network.

* **`api:`**: Names the second container "api".
  * **`build:`**: Tells Docker how to build the container from scratch.
    * **`context: ./services/api`**: Points to the folder containing the API code.
    * **`target: production`**: Tells it to build all the way to the final `production` stage in the Dockerfile.
  * **`environment:`**: Passes environment variables like the DB host, port, and password into the Node.js app so it can connect to the database.
  * **`depends_on: db: condition: service_healthy`**: **CRITICAL RULE**. This forces the API to wait. It will absolutely not boot up until the `db` health check passes successfully.
  * **`healthcheck:`**: Uses `wget` to ping the `/health` URL every 30 seconds to make sure the API hasn't frozen.
  * **`networks: - frontend, - backend`**: The API connects to the `backend` network (so it can talk to the database) AND the `frontend` network (so Nginx can talk to the API).
  * **`deploy: resources: limits/reservations`**: Ensures the API cannot use more than half of a CPU core (0.5) and 256MB of RAM.

* **`frontend:`**: Names the third container "frontend" (React app served by Nginx).
  * **`build: context: ./services/frontend, target: production`**: Builds the React Dockerfile all the way to the final stage.
  * **`depends_on: api: condition: service_healthy`**: Forces the frontend to wait until the API is fully awake before booting up.
  * **`healthcheck:`**: Pings `localhost:80` to ensure the React site is serving correctly.
  * **`networks: - frontend`**: Connects only to the `frontend` network. It CANNOT talk directly to the database.

* **`nginx:`**: Names the final container "nginx" (The traffic cop).
  * **`image: nginx:1.27.0-alpine3.19`**: Downloads a pre-built Nginx server.
  * **`ports: - "80:80"`**: **The only open door to the outside world.** It maps Port 80 on your computer/server to Port 80 inside the container.
  * **`volumes: - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro`**: Copies our custom Nginx routing rules into the container.
  * **`depends_on:`**: Waits for both the `frontend` and the `api` to be healthy before booting up.

* **`volumes: db_data: driver: local`**: Officially registers the permanent storage space for the database.
* **`networks:`**: Defines our virtual networks.
  * **`frontend: driver: bridge`**: A normal network for Nginx, Frontend, and API to communicate.
  * **`backend: driver: bridge, internal: true`**: **Security feature!** `internal: true` completely cuts this network off from the internet. Because the Database is only connected to this network, it is impossible for a hacker to reach the database directly from the outside world.
