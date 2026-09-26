# Step-by-Step Deployment Guide

This guide will walk you through launching the WhisTech Platform on your own laptop (Local Development) and launching it on the public internet (Production).

---

## Part 1: Running Locally (On your laptop)

Running locally is designed to be as simple as possible. Hot-reloading is enabled, so if you edit the code, the app will update instantly.

### Step 1: Prerequisites
Ensure you have **Docker Desktop** installed and running on your computer.

### Step 2: Set up your secret variables
1. In the main project folder, find the file named `.env.example`.
2. Copy it and rename the copy to exactly `.env`.
   *(This file holds your local passwords. Docker will automatically read it).*

### Step 3: Start the application
1. Open your terminal (Command Prompt, PowerShell, or Mac Terminal).
2. Navigate to the `WhisTech-platform` folder.
3. Run this single command:
   ```bash
   docker compose up --build
   ```
   *(Wait a minute or two for Docker to download the tools and build the React and Node containers).*

### Step 4: Use the app!
Everything is now running inside Docker. Open your browser and go to:
* **Frontend (React)**: `http://localhost:3001`
* **Backend API**: `http://localhost:3000`
* **Database**: `localhost:5432` (Connect using a tool like DBeaver. Username: `whistech`, Password: `changeme_in_production`).

**To stop the app:** Press `CTRL + C` in the terminal, or type `docker compose down`.

---

## Part 2: Running Outside the Local System (Production)

Deploying to production requires setting up cloud infrastructure (AWS) and letting our CI/CD robot (GitHub Actions) build the final, secure version of the code.

### Step 1: Prerequisites
* An **AWS Account** with the AWS CLI installed on your computer.
* A **GitHub Account** where this code is hosted.
* **Terraform** installed on your computer.

### Step 2: Build the Cloud Storage (Terraform)
We need to create secure folders on AWS (ECR) to hold our finished code, and create a security badge (IAM OIDC) so GitHub is allowed to talk to AWS.

1. Open your terminal and navigate to the `terraform/` folder.
2. Edit `terraform.tfvars` to match your actual GitHub username and project details.
3. Run the following Terraform commands:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
4. Type `yes` when prompted. Terraform will connect to AWS and build the ECR repositories and security roles. It will print out an `ECR_REGISTRY` URL and an `IAM_ROLE_ARN` when finished. Save these!

### Step 3: Trigger the GitHub Robot (CI/CD)
1. Push your code to the `main` branch on GitHub.
2. Go to the "Actions" tab on your GitHub repository.
3. You will see the robot automatically wake up. It will test the code, package it into production-ready Docker containers, and use the security badge to push those containers securely into your new AWS ECR storage.

### Step 4: Turn on the Live Server
Now that your finished code is sitting in AWS, you just need a server to run it on.

1. Rent a live cloud server (like an AWS EC2 instance, DigitalOcean Droplet, etc.) and log into it.
2. Install **Docker** on that live server.
3. Copy only two files to this server: `docker-compose.yml` and `docker-compose.prod.yml`.
4. Create a `.env` file on the server. **Do not use the example passwords!** Make up a highly secure database password, and paste in the `ECR_REGISTRY` URL you got from Terraform.
5. Turn the server on using the "Production Override" command:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

**Congratulations!** Your app is now live on the internet, locked down with production security limits, and serving real users.
