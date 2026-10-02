output "cloudfront_domain" {
  description = "Public CloudFront domain. Frontend and /api share this origin."
  value       = module.cloudfront.domain_name
}

output "cloudfront_distribution_id" {
  description = "Distribution id used for cache invalidation."
  value       = module.cloudfront.distribution_id
}

output "bucket_name" {
  description = "Private frontend bucket."
  value       = module.s3_frontend.bucket_name
}

output "instance_id" {
  description = "EC2 instance that runs Docker."
  value       = module.compute.instance_id
}

output "backend_origin" {
  description = "Hostname CloudFront uses for /api/*."
  value       = module.compute.public_dns
}
