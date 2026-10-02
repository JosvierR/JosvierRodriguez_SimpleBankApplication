output "cloudfront_domain" {
  value = module.platform.cloudfront_domain
}

output "cloudfront_distribution_id" {
  value = module.platform.cloudfront_distribution_id
}

output "bucket_name" {
  value = module.platform.bucket_name
}

output "instance_id" {
  value = module.platform.instance_id
}

output "backend_origin" {
  value = module.platform.backend_origin
}
