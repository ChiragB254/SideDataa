data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  account_id     = data.aws_caller_identity.current.account_id
  partition      = data.aws_partition.current.partition
  bucket_name    = var.release_bucket_name != "" ? var.release_bucket_name : "sidedata-releases-${local.account_id}"
  snapshot_tag   = { Snapshot = "${var.project}-daily" }
  oidc_url       = "https://token.actions.githubusercontent.com"
  github_sub     = "repo:${var.github_repo}:ref:${var.github_ref}"
  run_shell_doc  = "arn:${local.partition}:ssm:${var.aws_region}::document/AWS-RunShellScript"
  create_alerts  = var.alert_email != ""
  alarm_actions  = local.create_alerts ? [aws_sns_topic.alerts[0].arn] : []
  release_prefix = trimprefix(var.release_prefix, "/")
}

# ---------------------------------------------------------------------------
# Network: default VPC (exists in ca-central-1, checked read-only 2026-10-24).
# ---------------------------------------------------------------------------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnet" "web" {
  vpc_id            = data.aws_vpc.default.id
  availability_zone = var.availability_zone
  default_for_az    = true
}

resource "aws_security_group" "web" {
  name        = "${var.instance_name}-sg"
  description = "SideData web: HTTP/HTTPS in, all out. No SSH (use SSM Session Manager)."
  vpc_id      = data.aws_vpc.default.id

  tags = { Name = "${var.instance_name}-sg" }
}

# ::/0 rules are kept so IPv6 works the day the VPC/subnet gets an IPv6 CIDR.
# The default VPC currently has no IPv6 block, so they are inert today.
resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each = {
    http_v4  = { port = 80, cidr4 = "0.0.0.0/0", cidr6 = null }
    https_v4 = { port = 443, cidr4 = "0.0.0.0/0", cidr6 = null }
    http_v6  = { port = 80, cidr4 = null, cidr6 = "::/0" }
    https_v6 = { port = 443, cidr4 = null, cidr6 = "::/0" }
  }

  security_group_id = aws_security_group.web.id
  description       = "Public ${each.value.port == 80 ? "HTTP (ACME + redirect)" : "HTTPS"}"
  ip_protocol       = "tcp"
  from_port         = each.value.port
  to_port           = each.value.port
  cidr_ipv4         = each.value.cidr4
  cidr_ipv6         = each.value.cidr6

  tags = { Name = each.key }
}

resource "aws_vpc_security_group_egress_rule" "all_v4" {
  security_group_id = aws_security_group.web.id
  description       = "All outbound IPv4 (apt, ACME, S3, SSM, Resend)"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "all_v6" {
  security_group_id = aws_security_group.web.id
  description       = "All outbound IPv6"
  ip_protocol       = "-1"
  cidr_ipv6         = "::/0"
}
