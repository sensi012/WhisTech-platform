# `terraform` Folder Explanation

This folder is our **Infrastructure as Code (IaC)**. Instead of a human manually logging into Amazon Web Services (AWS) and clicking buttons to create storage and security roles, we write code to do it. Terraform reads this code and automatically builds the AWS infrastructure for us.

---

### 1. `providers.tf`
This file tells Terraform exactly which cloud provider we are using (in this case, AWS). It also sets the default region (like `us-east-1` for North America). 

### 2. `backend.tf`
This file configures the "memory" of Terraform. 
When Terraform creates things on AWS, it needs a place to remember exactly what it built so it doesn't accidentally build duplicates later. This file tells Terraform to save its memory (called "state") safely inside a secure AWS S3 Bucket, instead of saving it on the developer's local computer.

### 3. `variables.tf`
This is like a fill-in-the-blank form. It lists all the flexible settings for our infrastructure, like the `project_name` (WhisTech), the `aws_region`, and the `github_repo` name. It sets the rules for what these blanks expect, but doesn't actually fill them in yet.

### 4. `terraform.tfvars`
This is where we actually fill in the blanks defined in `variables.tf`. It assigns the real values.
* e.g., `project_name = "whistech"`

### 5. `iam.tf` (Identity and Access Management)
This is the security file. It creates a highly secure "handshake" between GitHub and AWS called **OIDC** (OpenID Connect).
* Normally, to let GitHub Actions push code to AWS, you have to give GitHub a secret password. If a hacker steals that password, they own your AWS account.
* This file says: "AWS, trust this specific GitHub repository. When GitHub asks to upload a file, check its ID badge. If it matches, give it a temporary 15-minute pass." No passwords required!

### 6. `ecr.tf` (Elastic Container Registry)
This file creates the actual storage folders on AWS where we will keep our built Docker containers.
* It creates one repository for the `api` and one for the `frontend`.
* It also sets up **Lifecycle Policies**. Docker images take up a lot of space. This policy automatically deletes old, unused versions of our code so we don't end up paying a massive AWS storage bill.

### 7. `outputs.tf`
After Terraform finishes building everything, this file prints out a neat summary of the results. It outputs the exact web addresses of the new ECR repositories and the ID of the IAM role we created, so we can easily copy-paste them into our GitHub Actions configuration.
