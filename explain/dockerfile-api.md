# `services/api/Dockerfile` (Line by Line Explanation)

This file is the recipe to package the Node.js backend into a Docker container. It uses a **multi-stage build** to keep the final container small and secure.

---

### Stage 1: The Tool Shed (Installing Dependencies)

* **`FROM node:20.15.1-alpine3.20 AS deps`**: Downloads a very lightweight version of Node.js (Alpine). We nickname this stage `deps` (dependencies).
* **`WORKDIR /app`**: Creates a folder named `/app` inside the container and sets it as our workspace.
* **`COPY package*.json ./`**: Copies `package.json` and `package-lock.json` from your computer into the `/app` folder. These files list the third-party libraries the backend needs.
* **`RUN npm ci --only=production && npm cache clean --force`**: Reads your list and strictly installs the libraries. `--only=production` tells Node.js *not* to install developer tools (like Jest or Nodemon) because we don't need them in the live app. `npm cache clean` sweeps up leftover trash to save space.

### Stage 2: The Live Server (Production Image)

* **`FROM node:20.15.1-alpine3.20 AS production`**: Starts Stage 2. It downloads a brand new, completely empty Node.js Alpine container. The `deps` stage we just created is put on hold.
* **`RUN addgroup -g 1001 -S whistech && adduser -u 1001 -S whistech -G whistech`**: **Security Step!** By default, Docker runs as the powerful "root" superuser. If a hacker breaks in, they get superuser powers. This line creates a brand new, limited, everyday user named `whistech`.
* **`WORKDIR /app`**: Creates the `/app` workspace folder in this new container.
* **`COPY --from=deps --chown=whistech:whistech /app/node_modules ./node_modules`**: **Multi-stage magic!** Reaches back into the `deps` stage, grabs the fully installed `node_modules` folder, and moves it into our new container. `--chown` hands ownership of these files to our safe `whistech` user.
* **`COPY --chown=whistech:whistech src/ ./src/`**: Copies your actual backend code (routes, database connections) from your computer into the container, again giving ownership to the `whistech` user.
* **`COPY --chown=whistech:whistech package*.json ./`**: Copies the recipe files over one last time for reference.
* **`USER whistech`**: **Security Step!** Tells the container: "Stop acting as the root superuser. For the rest of time, run everything as the limited `whistech` user."
* **`EXPOSE 3000`**: A label telling developers that this API listens for traffic on Port 3000.
* **`HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \ CMD wget -qO- http://localhost:3000/health || exit 1`**: An automated heartbeat check. Every 30 seconds, Docker pings the `/health` URL we set up in Express. The `--start-period=40s` gives the database 40 seconds to boot up first. If the API fails to respond 3 times in a row, Docker knows it crashed and restarts it.
* **`CMD ["node", "src/index.js"]`**: The final instruction: When the container is turned on, run `node src/index.js` to start the Express server and make the backend live!
