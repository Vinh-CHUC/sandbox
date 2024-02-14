terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "eu-west-2"
}

resource "aws_instance" "web" {
  ami           = ami-0e5f882be1900e43b
  instance_type = "t2.micro"
}
