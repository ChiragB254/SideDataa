output "elastic_ip" {
  description = "Public IPv4 of the web server. Point the GoDaddy A record for @ here."
  value       = aws_eip.web.public_ip
}

output "instance_id" {
  description = "EC2 instance id (for SSM sessions and the deploy workflow)."
  value       = aws_instance.web.id
}

output "release_bucket_name" {
  description = "Private S3 bucket for release artifacts."
  value       = aws_s3_bucket.releases.bucket
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for aws-actions/configure-aws-credentials (role-to-assume)."
  value       = aws_iam_role.github_deploy.arn
}

output "aws_region" {
  description = "Region of all resources."
  value       = var.aws_region
}

output "ssm_session_command" {
  description = "Open a root-capable shell on the box (needs the Session Manager plugin)."
  value       = "aws ssm start-session --region ${var.aws_region} --target ${aws_instance.web.id}"
}
