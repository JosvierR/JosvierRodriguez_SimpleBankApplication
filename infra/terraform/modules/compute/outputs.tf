output "instance_id" {
  value = aws_instance.api.id
}

output "public_dns" {
  value = aws_instance.api.public_dns
}
