terraform {
  backend "s3" {
    bucket         = "WhisTech-terraform-state"
    key            = "whistech/container-platform/terraform.tfstate"
    region         = "us-east-1"
    use_lockfile = True
}
}