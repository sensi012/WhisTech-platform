# `services/frontend` Folder Explanation

This folder is the **Frontend**, the "face" of the application. It creates the buttons, forms, and layout that users actually see on their screens. It is built using **React** and uses **Nginx** to serve the files.

---

### 1. `Dockerfile`
Just like the backend, this packages the frontend into a Docker container. 
* **Multi-stage build:** First, it uses Node.js to "build" the React app (converting all our organized code into highly optimized, squished HTML, CSS, and Javascript). 
* Then, it throws away Node.js and uses a super lightweight **Nginx** server just to host those final files.

### 2. `nginx.conf`
This is a tiny Nginx configuration specific to the frontend container. Its main job is to say "No matter what URL the user types in, always send them to `index.html`." This is required for React Router to work correctly.

### 3. `package.json`
The "ID card" for the frontend. It lists the required libraries like `react`, `react-dom`, and `axios` (used to talk to the backend).

### 4. `public/index.html`
This is the single HTML page that loads when someone visits the site. It’s mostly empty, except for a `<div id="root"></div>`. React uses this `root` div as a blank canvas to draw the entire application on.

### 5. `src/api/client.js`
This is the "telephone" used to talk to the Backend API.
* It uses `axios` to create a standard connection pointing to `/api`.
* **Interceptors:** If the backend throws an error (like "Title is required"), this file intercepts the error and cleans it up into a readable message before passing it to the React components.
* It exports an object `tasksApi` with simple commands like `.list()`, `.create()`, and `.delete()`.

### 6. `src/components/TaskBoard.jsx`
This is the main screen of the application! It's a complex React Component.
* **State (`useState`):** It remembers things, like the list of `tasks`, if it's currently `loading`, if there's an `error`, and what the user is typing in the `newTitle` box.
* **Fetching Data (`useEffect`):** As soon as the board appears on the screen, it automatically calls `tasksApi.list()` to fetch the tasks from the backend.
* **Forms:** It has a `<form>` for creating new tasks. When you click "Add task", it calls the API, clears the input box, and reloads the list.
* **The Columns:** It loops through three predefined columns ('To do', 'In progress', 'Done'). For each column, it filters the `tasks` list to find the matching tasks, and draws a `TaskCard` for each one.

### 7. `src/components/TaskCard.jsx`
This is the small card that represents a single task. It receives a `task` object as a "prop" (a piece of data passed from the `TaskBoard`). It renders the task's title, priority, and provides buttons to change the status or delete the task.

### 8. `src/index.js` & `src/App.jsx` & `src/index.css`
* **`index.js`:** The starting point. It finds the `<div id="root">` in the HTML and tells React to start drawing the `<App />` there.
* **`App.jsx`:** The main layout wrapper. Usually contains headers, footers, and the `<TaskBoard />`.
* **`index.css`:** The visual styling rules (colors, fonts, layout) that make the app look beautiful.
