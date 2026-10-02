terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "simple-bank"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

module "platform" {
  source                = "../.."
  aws_region            = var.aws_region
  environment           = "production"
  instance_type         = var.instance_type
  bucket_name           = var.bucket_name
  backend_origin_domain = var.backend_origin_domain
  application_revision  = var.application_revision
}
