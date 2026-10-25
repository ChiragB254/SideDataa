# Ubuntu 24.04 LTS arm64 AMI from Canonical's public SSM parameter.
data "aws_ssm_parameter" "ubuntu_ami" {
  name = var.ubuntu_ami_ssm_parameter
}

resource "aws_instance" "web" {
  # insecure_value: public, non-secret parameter; avoids a "sensitive" AMI id.
  ami                    = data.aws_ssm_parameter.ubuntu_ami.insecure_value
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnet.web.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.web.name

  disable_api_termination = var.enable_termination_protection
  monitoring              = false # basic 5-min metrics; status checks are 1-min regardless

  user_data = templatefile("${path.module}/templates/bootstrap.sh.tftpl", {
    domain                 = var.domain
    acme_email             = var.acme_email
    node_major             = var.node_major
    swap_size_mb           = var.swap_size_mb
    unattended_reboot_time = var.unattended_reboot_time
  })
  user_data_replace_on_change = false

  credit_specification {
    cpu_credits = var.cpu_credits
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  maintenance_options {
    auto_recovery = "default" # EC2 simplified automatic recovery on host failure
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    encrypted             = true # AWS-managed aws/ebs key
    delete_on_termination = true

    tags = merge(local.snapshot_tag, {
      Name = "${var.instance_name}-root"
    })
  }

  tags = { Name = var.instance_name }

  lifecycle {
    # - ami: the SSM parameter moves with every Canonical release; without this
    #   every plan would REPLACE the server. Upgrade deliberately with
    #   `terraform apply -replace=aws_instance.web`.
    # - user_data: only runs at first boot; changing it would stop/start the
    #   box for nothing. Re-run the bootstrap on the box instead (README).
    ignore_changes = [ami, user_data]
  }
}

resource "aws_eip" "web" {
  domain   = "vpc"
  instance = aws_instance.web.id

  tags = { Name = var.instance_name }
}

# Daily root-volume snapshots, keep N.
resource "aws_dlm_lifecycle_policy" "daily" {
  description        = "${var.project} daily root volume snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = local.snapshot_tag

    schedule {
      name      = "daily-keep-${var.snapshot_retain_count}"
      copy_tags = true

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = [var.snapshot_time_utc]
      }

      retain_rule {
        count = var.snapshot_retain_count
      }

      tags_to_add = {
        SnapshotCreator = "dlm"
      }
    }
  }

  tags = { Name = "${var.project}-daily-snapshots" }
}
