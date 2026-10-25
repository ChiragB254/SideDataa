terraform {
  required_version = ">= 1.9.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # State is LOCAL on purpose for the first apply (single owner, single box).
  # Recommendation: move to an S3 backend with native locking once this is
  # live. See infra/README.md, section "State".
}

provider "aws" {
  region = var.aws_region

  # Guard rail: refuse to touch any account other than the owner's.
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Repo        = var.github_repo
    }
  }
}
