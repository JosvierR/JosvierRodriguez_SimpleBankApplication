module "network" {
  source    = "./modules/network"
  vpc_id    = var.vpc_id
  subnet_id = var.subnet_id
}

module "security" {
  source      = "./modules/security"
  name_prefix = local.name_prefix
  vpc_id      = module.network.vpc_id
}

module "s3_frontend" {
  source      = "./modules/s3_frontend"
  bucket_name = var.bucket_name
}

module "compute" {
  source               = "./modules/compute"
  name_prefix          = local.name_prefix
  instance_type        = var.instance_type
  subnet_id            = module.network.subnet_id
  security_group_id    = module.security.security_group_id
  application_revision = var.application_revision
  user_data_path       = "${path.module}/../aws/manual-console/01-ec2-user-data.sh"
}

module "cloudfront" {
  source                               = "./modules/cloudfront"
  name_prefix                          = local.name_prefix
  frontend_bucket_name                 = module.s3_frontend.bucket_name
  frontend_bucket_arn                  = module.s3_frontend.bucket_arn
  frontend_bucket_regional_domain_name = module.s3_frontend.bucket_regional_domain_name
  backend_origin_domain                = var.backend_origin_domain != "" ? var.backend_origin_domain : module.compute.public_dns
}

module "observability" {
  source      = "./modules/observability"
  environment = var.environment
}
