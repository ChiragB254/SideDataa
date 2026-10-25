resource "aws_sns_topic" "alerts" {
  count = local.create_alerts ? 1 : 0
  name  = "${var.project}-alerts"
  # Not KMS-encrypted on purpose: CloudWatch alarms cannot publish to a topic
  # encrypted with the AWS-managed aws/sns key. Alarm payloads hold no secrets.
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = local.create_alerts ? 1 : 0
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Fires when the system or instance status check fails for 3 consecutive
# minutes. Missing data = not breaching, so the first apply and deliberate
# stops do not alarm. Trade-off: a stopped instance (no metrics) is NOT
# alerted on, and neither is a dead Caddy/Node process. Cover both with an
# external HTTPS uptime check (see README).
resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "${var.instance_name}-status-check-failed"
  alarm_description   = "EC2 status check failed on ${var.instance_name} (${aws_instance.web.id})"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 3
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}
