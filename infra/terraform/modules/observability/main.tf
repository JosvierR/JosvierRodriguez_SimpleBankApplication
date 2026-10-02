resource "aws_cloudwatch_log_group" "api" {
  name              = "/simple-bank/${var.environment}/api"
  retention_in_days = 14
}
