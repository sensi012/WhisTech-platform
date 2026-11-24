terraform {
  backend "s3" {
    bucket       = "whis-tech-terraform-state"
    key          = "whistech/container-platform/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}