# ---------------------------------------------------------------------------
# Instance role: SSM Session Manager/Run Command + read releases from S3.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "web" {
  name               = "${var.instance_name}-instance"
  description        = "Instance role for ${var.instance_name}: SSM + read-only release bucket"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "web_ssm" {
  role       = aws_iam_role.web.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "web_releases_read" {
  statement {
    sid       = "ReadReleaseObjects"
    actions   = ["s3:GetObject", "s3:GetObjectVersion"]
    resources = ["${aws_s3_bucket.releases.arn}/${local.release_prefix}*"]
  }

  # Lets the box list releases (and get 404 instead of 403 for missing keys).
  statement {
    sid       = "ListReleasePrefix"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.releases.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${local.release_prefix}*"]
    }
  }
}

resource "aws_iam_role_policy" "web_releases_read" {
  name   = "release-bucket-read"
  role   = aws_iam_role.web.id
  policy = data.aws_iam_policy_document.web_releases_read.json
}

resource "aws_iam_instance_profile" "web" {
  name = "${var.instance_name}-instance"
  role = aws_iam_role.web.name
}

# ---------------------------------------------------------------------------
# GitHub Actions OIDC provider + deploy role.
# Read-only check on 2026-10-24: no OIDC providers existed in the account.
# ---------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url            = local.oidc_url
  client_id_list = ["sts.amazonaws.com"]
  # thumbprint_list omitted: AWS validates GitHub's OIDC TLS cert against its
  # trusted CA store, and the provider no longer requires thumbprints.

  tags = { Name = "github-actions" }
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = local.oidc_url
}

locals {
  github_oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Exact match: only pushes/workflow runs on main of this one repo.
    # A job that sets `environment:` gets a different sub and is rejected.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_sub]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name                 = "sidedata-github-deploy"
  description          = "Assumed by GitHub Actions (${local.github_sub}) to upload a release and trigger the on-box deploy via SSM"
  assume_role_policy   = data.aws_iam_policy_document.github_assume.json
  max_session_duration = 3600
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid       = "ReleaseObjects"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.releases.arn}/${local.release_prefix}*"]
  }

  # SendCommand is authorized per resource: both the instance and the document
  # must be allowed. Only AWS-RunShellScript, only this instance.
  statement {
    sid     = "RunDeployOnWebInstance"
    actions = ["ssm:SendCommand"]
    resources = [
      aws_instance.web.arn,
      local.run_shell_doc,
    ]
  }

  # These actions do not support resource-level permissions (AWS service
  # reference, checked 2026-10-24), so "*" is the narrowest possible; scoped
  # to the region instead.
  statement {
    sid = "ReadCommandResultsAndInstances"
    actions = [
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
      "ec2:DescribeInstances",
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}

# ---------------------------------------------------------------------------
# DLM execution role (the AWS default DLM role does not exist in the account).
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "dlm_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  name               = "${var.project}-dlm"
  description        = "Data Lifecycle Manager role for ${var.project} EBS snapshots"
  assume_role_policy = data.aws_iam_policy_document.dlm_assume.json
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}
