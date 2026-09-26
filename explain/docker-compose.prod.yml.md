# `docker-compose.prod.yml` (Line by Line Explanation)

This file contains the **Production Override Rules**. You only use this file when you are launching the application on a live cloud server (like AWS). It overrides the base `docker-compose.yml` to optimize the app for real-world traffic, strict security, and stability.

---

* **`services:`**: Begins the list of services we are modifying for production.

* **`api:`**: Modifying the backend API.
  * **`image: ${ECR_REGISTRY}/whistech/api:${IMAGE_TAG:?IMAGE_TAG is required}`**: In production, we *do not* build the code from scratch on the server. Instead, this line tells Docker to download a pre-built, fully tested Docker Image from our private AWS storage (ECR). The `${IMAGE_TAG}` ensures we download the exact right version of the code.
  * **`build: !reset null`**: Completely disables building from scratch.
  * **`environment: NODE_ENV: production` & `LOG_LEVEL: info`**: Turns off debugging messages. This makes the app run faster and prevents it from accidentally printing sensitive user data to the logs.
  * **`deploy: replicas: 2`**: Tells Docker to run **two** identical copies of the API at the same time. If one crashes, the other takes over instantly (High Availability).
  * **`deploy: resources: limits: cpus: '0.75', memory: 384M`**: Strict limits! It prevents the API from ever using more than 75% of a CPU core or 384MB of RAM. If it tries to use more, Docker will forcibly stop it to prevent it from crashing the whole server.
  * **`deploy: resources: reservations: cpus: '0.25', memory: 192M`**: Guarantees that the API is *always* allowed to use at least 25% CPU and 192MB of RAM, so other containers can't steal its resources.
  * **`restart_policy: condition: on-failure, delay: 5s, max_attempts: 3`**: If the API crashes (`on-failure`), wait 5 seconds, then try to reboot it. Give up if it crashes 3 times in a row.

* **`frontend:`**: Modifying the React frontend.
  * **`image: ${ECR_REGISTRY}/whistech/frontend:${IMAGE_TAG:?IMAGE_TAG is required}`**: Downloads the pre-built, production-ready React Image from AWS ECR.
  * **`build: !reset null`**: Disables building on the server.
  * **`deploy: resources: limits: cpus: '0.25', memory: 64M`**: The frontend is very lightweight (just Nginx serving static files), so we strictly limit it to a tiny amount of CPU and RAM.

* **`db:`**: Modifying the PostgreSQL database.
  * **`environment: POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}`**: Forces Docker to crash immediately if a real, secure password wasn't provided for the production database.
  * **`deploy: resources: limits: cpus: '1.0', memory: 512M`**: Databases need lots of power. This allows the DB to use a full CPU core and half a gigabyte of RAM.
  * **`deploy: resources: reservations: memory: 256M`**: Guarantees the database always has at least 256MB of RAM reserved just for it.

* **`nginx:`**: Modifying the traffic cop.
  * **`ports: - "80:80", - "443:443"`**: Opens Port 80 (standard HTTP web traffic) and Port 443 (secure HTTPS encrypted traffic) to the public internet.
  * **`deploy: resources: limits: cpus: '0.25', memory: 64M`**: Nginx is highly efficient, so we limit it to a tiny amount of server resources.
