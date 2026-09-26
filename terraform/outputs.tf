data "aws_caller_identity" "current" {}

output "ecr_registry" {
  description = "ECR registry URL — set as ECR_REGISTRY for docker compose prod"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "ecr_api_repository_url" {
  description = "Full ECR URL for the API image"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_frontend_repository_url" {
  description = "Full ECR URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "github_publish_role_arn" {
  description = "Add to GitHub Secret as AWS_ROLE_ARN for the publish workflow"
  value       = aws_iam_role.github_publish.arn
}

output "ecr_login_command" {
  description = "Authenticate Docker to ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}
