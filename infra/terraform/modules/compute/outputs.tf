output "instance_id" {
  value = aws_instance.api.id
}

output "public_dns" {
  value = aws_instance.api.public_dns
}

output "requested_revision" {
  description = "Release requested by the operator. Systems Manager runs deploy-release.sh. This value does not replace the instance."
  value       = var.application_revision
}
