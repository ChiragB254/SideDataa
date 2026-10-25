variable "aws_account_id" {
  description = "AWS account that is allowed to be managed. The provider refuses to run against any other account."
  type        = string
  default     = "499024812515"
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ca-central-1"
}

variable "project" {
  description = "Project tag value and name prefix."
  type        = string
  default     = "sidedata-site"
}

variable "environment" {
  description = "Environment tag value."
  type        = string
  default     = "prod"
}

variable "availability_zone" {
  description = "AZ whose default subnet hosts the instance. t4g.small is offered in ca-central-1a, 1b and 1d (checked 2026-10-24)."
  type        = string
  default     = "ca-central-1a"
}

variable "instance_name" {
  description = "Name tag of the web instance."
  type        = string
  default     = "sidedata-web"
}

variable "instance_type" {
  description = "EC2 instance type. Must be arm64 (Graviton) because the AMI is arm64."
  type        = string
  default     = "t4g.small"
}

variable "cpu_credits" {
  description = "Burstable credit mode. 'standard' throttles to baseline when credits run out (no surprise bill); 'unlimited' never throttles but bills surplus credits."
  type        = string
  default     = "standard"

  validation {
    condition     = contains(["standard", "unlimited"], var.cpu_credits)
    error_message = "cpu_credits must be 'standard' or 'unlimited'."
  }
}

variable "root_volume_size_gb" {
  description = "Size of the encrypted gp3 root volume in GiB."
  type        = number
  default     = 20
}

variable "enable_termination_protection" {
  description = "EC2 API termination protection. Set to false and apply before 'terraform destroy' or '-replace' of the instance."
  type        = bool
  default     = true
}

variable "ubuntu_ami_ssm_parameter" {
  description = "Canonical public SSM parameter that resolves the current Ubuntu 24.04 LTS arm64 gp3 AMI."
  type        = string
  default     = "/aws/service/canonical/ubuntu/server/24.04/stable/current/arm64/hvm/ebs-gp3/ami-id"
}

variable "domain" {
  description = "Apex domain served by Caddy. www.<domain> redirects to it."
  type        = string
  default     = "sidedataa.com"
}

variable "acme_email" {
  description = "Optional contact email for the Let's Encrypt/ZeroSSL ACME account (expiry notices). Not a secret. Empty = no email."
  type        = string
  default     = ""
}

variable "node_major" {
  description = "Pinned Node.js major version installed from the NodeSource apt repo (node_<major>.x)."
  type        = number
  default     = 22
}

variable "swap_size_mb" {
  description = "Size of /swapfile in MiB."
  type        = number
  default     = 2048
}

variable "unattended_reboot_time" {
  description = "UTC time (HH:MM) at which unattended-upgrades may reboot when a security update requires it. Empty string disables automatic reboots."
  type        = string
  default     = "08:00"
}

variable "release_bucket_name" {
  description = "Name of the private S3 bucket that holds release tarballs. Empty = sidedata-releases-<account id>."
  type        = string
  default     = ""
}

variable "release_prefix" {
  description = "Key prefix (no leading slash, with trailing slash) under which releases are stored."
  type        = string
  default     = "releases/"
}

variable "release_retention_days" {
  description = "Objects under release_prefix expire after this many days."
  type        = number
  default     = 60
}

variable "bucket_force_destroy" {
  description = "Allow 'terraform destroy' to delete a non-empty release bucket (all versions). Keep false except during teardown."
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "GitHub repository (owner/name, case-sensitive as GitHub reports it) allowed to assume the deploy role."
  type        = string
  default     = "ChiragB254/SideDataa"
}

variable "github_ref" {
  description = "Git ref allowed to assume the deploy role (exact sub claim match)."
  type        = string
  default     = "refs/heads/main"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set false if one already exists in the account (only one per URL is allowed); it is then looked up by URL. None existed on 2026-10-24."
  type        = bool
  default     = true
}

variable "snapshot_time_utc" {
  description = "Daily UTC time (HH:MM) at which DLM snapshots the root volume."
  type        = string
  default     = "07:00"
}

variable "snapshot_retain_count" {
  description = "Number of daily snapshots DLM keeps."
  type        = number
  default     = 7
}

variable "alert_email" {
  description = "Optional email for CloudWatch alarm notifications. When set, an SNS topic and email subscription are created (confirm the email AWS sends)."
  type        = string
  default     = ""
}
