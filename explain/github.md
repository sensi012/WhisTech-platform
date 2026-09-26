# `.github` Folder Explanation

This folder is the home of **GitHub Actions**. GitHub Actions is a robot that lives on GitHub and runs tasks for us automatically whenever we push new code.

The files inside `.github/workflows/` tell the robot exactly what to do step-by-step.

---

### `ci.yml` (Continuous Integration)
This file is triggered whenever a developer opens a "Pull Request" (asking to merge their code). It acts as a strict security guard to ensure bad code never gets merged.

**What it does step-by-step:**
1. **`on: pull_request`**: Wakes up the robot when a pull request is created.
2. **`services: postgres`**: Spins up a temporary PostgreSQL database just for testing. This is awesome because it means we test our code against a *real* database, not a fake one.
3. **`Install dependencies` and `Run integration tests`**: Downloads the Node.js packages and runs the tests. It connects to the temporary database. If a test fails, the robot stops and yells at the developer.
4. **`Build API image`**: If tests pass, it packages the API into a Docker container.
5. **`Scan API image` (Trivy)**: This is a security scanner. It scans the inside of the Docker container looking for known viruses or outdated, hackable software. The rule `exit-code: '1'` means if it finds anything *HIGH* or *CRITICAL*, it fails the entire process and blocks the code from being merged.
6. **`Build frontend image` and `Scan frontend image`**: It repeats the building and scanning process for the React frontend.

---

### `publish.yml` (Continuous Deployment / Publishing)
This file is triggered only when code is officially merged into the `main` branch. Its job is to take the approved code, package it up, and send it to our cloud provider (AWS) so it can be run in production.

**What it does step-by-step:**
1. **`on: push: branches: [main]`**: Only wakes up for the main branch.
2. **`Configure AWS credentials (OIDC)`**: This is a very secure way to talk to AWS. Instead of saving a secret password in GitHub (which could be stolen), GitHub and AWS use a temporary handshake (OIDC) to prove who they are.
3. **`Log in to ECR`**: ECR is Amazon's Elastic Container Registry (a storage facility for Docker containers). 
4. **`Set image tags`**: It gives our new containers a unique name based on the exact Git commit ID (a short string of letters and numbers). This guarantees we always know exactly what version of code is inside the container.
5. **`Build and push API image`**: Builds the API container and uploads it to AWS ECR. It also adds an `sbom` (Software Bill of Materials), which is like a nutrition label listing every single piece of open-source code inside the container.
6. **`Trivy scan pushed API image`**: It scans the container one last time just to be absolutely sure it's safe.
7. **`Build and push frontend image`**: Builds the frontend container and uploads it to AWS ECR.
8. **`Deployment summary`**: Prints out a nice table on GitHub showing the exact versions that were published.
