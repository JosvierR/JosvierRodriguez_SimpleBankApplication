variable "aws_region" {
  description = "AWS region for the Simple Bank stack."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment name, such as staging or production."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for the Spring Boot and MongoDB host."
  type        = string
  default     = "t3.small"
}

variable "bucket_name" {
  description = "Private S3 bucket that stores the Vite build."
  type        = string
}

variable "backend_origin_domain" {
  description = "Optional public DNS name for the API origin. Empty uses the instance public DNS."
  type        = string
  default     = ""
}

variable "application_revision" {
  description = "Git SHA recorded on the instance. The user-data script checks out this release."
  type        = string
}

variable "vpc_id" {
  description = "VPC for the API security group. Empty uses the default VPC."
  type        = string
  default     = ""
}

variable "subnet_id" {
  description = "Public subnet for the EC2 instance. Empty uses the first default subnet."
  type        = string
  default     = ""
}
