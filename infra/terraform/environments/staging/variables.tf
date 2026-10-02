variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "bucket_name" {
  type = string
}

variable "backend_origin_domain" {
  type    = string
  default = ""
}

variable "application_revision" {
  type = string
}
