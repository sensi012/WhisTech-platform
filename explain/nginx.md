# `nginx` Folder Explanation

This folder contains the configuration for Nginx. Nginx acts as our **Reverse Proxy** or "Traffic Cop". It sits at the very front of our application, receives all incoming web traffic, and decides where it needs to go. 

---

### `nginx/nginx.conf`
This is the main configuration file that tells Nginx exactly how to behave.

#### The Basics
* **`user nginx; worker_processes auto;`**: Tells Nginx to run under a safe user account and use all available CPU cores.
* **`events { worker_connections 1024; }`**: Allows the server to handle up to 1024 connections at the exact same time per CPU core.

#### HTTP Settings (The Core Rules)
* **`include /etc/nginx/mime.types;`**: Tells Nginx how to recognize different file types (like images vs. HTML).
* **`log_format ...` and `access_log ...`**: Sets up logging so we can record every single visit to our website, including how long it took to respond.
* **`sendfile on; tcp_nopush on; tcp_nodelay on;`**: These are standard optimizations to make sending files over the internet as fast as possible.

#### Compression (Making things load faster)
* **`gzip on;`**: Turns on compression (like zipping a file). Before Nginx sends a file to the user's browser, it squishes it down so it downloads faster.
* **`gzip_types ...`**: Lists exactly which file types are allowed to be squished (text, CSS, Javascript, etc.).

#### Security Headers (Locking things down)
* **`add_header X-Frame-Options SAMEORIGIN;`**: Prevents hackers from putting our website inside a fake invisible box on their own website to trick users (Clickjacking).
* **`add_header X-XSS-Protection "1; mode=block";`**: Turns on built-in browser protections against Cross-Site Scripting (hackers injecting bad code).

#### Rate Limiting (Preventing Spam)
* **`limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;`**: Creates a rule named `api_limit`. It tracks users by their IP address and says "You are only allowed to make 30 requests per minute to the API."
* **`limit_req_zone $binary_remote_addr zone=general_limit:10m rate=200r/m;`**: Creates a rule for normal webpages, allowing 200 requests per minute.
* **`limit_req_status 429;`**: If someone breaks the rule, Nginx automatically kicks them out with a `429 Too Many Requests` error.

#### Upstreams (Our Destinations)
* **`upstream api_backend { server api:3000; }`**: Teaches Nginx where the backend API lives inside our Docker network (on port 3000).
* **`upstream frontend_backend { server frontend:80; }`**: Teaches Nginx where the React frontend lives.

#### The Server Block (Handling the Traffic)
* **`server { listen 80; ... }`**: Starts listening for incoming web traffic on the standard HTTP port (80).
* **`location = /health { ... }`**: A special hidden URL just for AWS to check if Nginx is alive and healthy.
* **`location /api/ { ... }`**: "If the user goes to a URL starting with `/api/`, send them to the `api_backend`."
  * It applies the `api_limit` rate limit here.
  * It attaches some secret labels (`proxy_set_header`) so the API knows the real IP address of the user.
* **`location / { ... }`**: "If the user goes to ANY OTHER URL, send them to the `frontend_backend`."
  * It applies the `general_limit` rate limit here.
