# WhisTech Platform: The Big Picture

Welcome to the WhisTech Platform! This document is meant to explain what this whole project is about in the simplest terms possible. 

Imagine you are building a modern web application, like a task management tool. You need a few things for it to work:
1. **A face:** The part users click on and see (The Frontend).
2. **A brain:** The part that processes rules, logic, and talks to the storage (The Backend API).
3. **A filing cabinet:** The place where all the data (like tasks and users) is saved permanently (The Database).

This project sets up all three parts, but it does so using modern, professional tools so it can run safely and reliably on the internet.

## The Three Tiers (The Core Application)
- **Frontend (React):** This is built using React. It creates the buttons and forms you see on the screen.
- **Backend API (Node.js & Express):** This handles the behind-the-scenes work. When the frontend says "save this task," the backend checks if the task is valid and then stores it.
- **Database (PostgreSQL):** This is a powerful SQL database that stores all the tasks.

## The Helpers (The Tools Making it Professional)
Just writing the code isn't enough to put an app on the internet. We need tools to run it, protect it, and deploy it.

- **Docker:** Think of Docker as a set of shipping containers. Instead of installing Node.js, React, and PostgreSQL on your computer manually, Docker puts each part into its own isolated "container" with everything it needs. This means if it runs on your computer, it will run exactly the same way on a server.
- **Nginx (Reverse Proxy):** This is like a traffic cop. It stands in front of the application. When a user visits the website, Nginx says, "Oh, you want the webpage? Go to the Frontend." or "Oh, you are trying to save a task? Let me send you to the Backend API."
- **GitHub Actions (CI/CD):** This is our robot assistant. Whenever we write new code and push it to GitHub, this robot wakes up. It tests the code to make sure we didn't break anything, scans it for security hackers/viruses (Trivy), and if everything is perfect, it packages the code up and prepares it for the internet.
- **Terraform:** This is Infrastructure as Code. Instead of clicking buttons on Amazon Web Services (AWS) to create a place to store our Docker containers, we write code that says "Create a storage repository on AWS." Terraform reads that code and builds the infrastructure for us automatically.

## How it All Connects
1. **You write code.** 
2. You push it to **GitHub**. 
3. **GitHub Actions** tests it and builds **Docker** containers. 
4. The containers are stored in **AWS** (created by **Terraform**).
5. When running, **Nginx** directs user traffic to the **Frontend** and **Backend**, which talks to the **Database**.

This setup is what professionals mean when they say "Production-Grade Containerised Platform." It's robust, secure, and automated.
