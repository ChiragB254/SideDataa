# Private release bucket. CI uploads releases/<git-sha>.tar.gz (or similar);
# the instance only reads.
resource "aws_s3_bucket" "releases" {
  bucket        = local.bucket_name
  force_destroy = var.bucket_force_destroy

  tags = { Name = local.bucket_name }
}

resource "aws_s3_bucket_ownership_controls" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    object_ownership = "BucketOwnerEnforced" # ACLs disabled
  }
}

resource "aws_s3_bucket_public_access_block" "releases" {
  bucket = aws_s3_bucket.releases.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "releases" {
  bucket = aws_s3_bucket.releases.id

  versioning_configuration {
    status = "Enabled"
  }
}

# SSE-S3 (AES256): no KMS key cost, and no kms:* permissions needed by CI/EC2.
resource "aws_s3_bucket_server_side_encryption_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  # Versioning must be on before noncurrent-version rules are meaningful.
  depends_on = [aws_s3_bucket_versioning.releases]

  rule {
    id     = "expire-releases"
    status = "Enabled"

    filter {
      prefix = local.release_prefix
    }

    expiration {
      days = var.release_retention_days
    }

    # Expired/overwritten versions are kept 7 more days, then purged, so
    # versioning does not silently grow storage forever.
    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }
  }

  rule {
    id     = "cleanup-delete-markers"
    status = "Enabled"

    filter {}

    expiration {
      expired_object_delete_marker = true
    }
  }
}

data "aws_iam_policy_document" "releases_bucket" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.releases.arn,
      "${aws_s3_bucket.releases.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "releases" {
  bucket = aws_s3_bucket.releases.id
  policy = data.aws_iam_policy_document.releases_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.releases]
}
