# `services/frontend/Dockerfile` (Line by Line Explanation)

This file packages the React frontend into a Docker container. It uses a **multi-stage build** to "bake" the website in a large kitchen, and then serve it from a tiny, fast display window.

---

### Stage 1: The Kitchen (Building the App)

* **`FROM node:20.15.1-alpine3.20 AS builder`**: Downloads a lightweight version of Node.js. The `AS builder` part gives this stage a nickname.
* **`WORKDIR /app`**: Creates a folder named `/app` inside the container and uses it as the prep table.
* **`COPY package*.json ./`**: Copies your `package.json` (the recipe listing the tools you need) into the container.
* **`RUN npm ci`**: "Clean Install". Looks at your recipe and strictly installs all the tools securely.
* **`COPY . .`**: Copies the rest of your actual source code (React components, CSS) into the container.
* **`ARG BUILD_DATE` & `ARG GIT_SHA`**: Tells Docker to expect two pieces of temporary information to be passed in from the outside when this build starts (used to track when the code was built).
* **`ENV REACT_APP_BUILD_DATE=$BUILD_DATE ...`**: Sets "Environment Variables". It takes those temporary `ARG` values and bakes them permanently into the React app. It also sets `REACT_APP_API_URL=/api` so the frontend knows where to find the backend.
* **`RUN npm run build`**: The actual "baking" step. Takes all your raw React code and compiles it down into a highly optimized, finished website inside a new folder called `build/`.

### Stage 2: The Display Window (Hosting the App)

* **`FROM nginx:1.27.0-alpine3.19 AS production`**: Starts Stage 2. Downloads a super lightweight **Nginx** web server. The heavy Node.js kitchen from Stage 1 is thrown away.
* **`RUN rm /etc/nginx/conf.d/default.conf`**: Deletes the default "Welcome to Nginx!" webpage.
* **`COPY nginx.conf /etc/nginx/conf.d/app.conf`**: Copies your custom Nginx routing rules from your project into the server.
* **`COPY --from=builder /app/build /usr/share/nginx/html`**: **Multi-stage magic!** Reaches back to the `builder` stage, grabs the finished `build/` folder (the baked cake), and copies it into Nginx's public folder so it can be served to users.
* **`RUN chown -R nginx:nginx ...`**: **Security Step!** Changes the ownership (`chown`) of all necessary Nginx files to a safe, limited user named `nginx` (instead of the dangerous 'root' user).
* **`RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid`**: Creates a specific file Nginx needs to track its own process, and gives the `nginx` user permission to use it.
* **`USER nginx`**: **Security Step!** Tells the container to stop being the superuser and run everything as the limited `nginx` user.
* **`EXPOSE 80`**: A label indicating this server receives web traffic on standard Port 80.
* **`HEALTHCHECK --interval=30s ...`**: Sets up an automatic heartbeat. Every 30 seconds, Docker tries to load your website (`http://localhost:80/`). If it fails 3 times, Docker marks the container as unhealthy.
* **`CMD ["nginx", "-g", "daemon off;"]`**: The final instruction: When the container is turned on, start Nginx and keep it running continuously in the foreground (`daemon off`) so the container doesn't accidentally shut down.
