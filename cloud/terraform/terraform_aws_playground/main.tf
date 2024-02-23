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

#### Variables
variable "subnet_prefix" {
    description = "cidr block for the subnet"
}


#### Resources

# VPC
resource "aws_vpc" "main-vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
      Name = "production"
  }
}

# GW
resource "aws_internet_gateway" "main-gw" {
  vpc_id = aws_vpc.main-vpc.id
}

# Route table
resource "aws_route_table" "example" {
  vpc_id = aws_vpc.main-vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main-gw.id
  }

  route {
    ipv6_cidr_block        = "::/0"
    gateway_id = aws_internet_gateway.main-gw.id
  }

  tags = {
    Name = "production"
  }
}

# Subnet
resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main-vpc.id
  cidr_block = var.subnet_prefix
  availability_zone = "eu-west-2a"

  tags = {
    Name = "Main"
  }
}

# Route table
resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.example.id
}

# Security group
resource "aws_security_group" "main-security-group" {
  name        = "allow_tls"
  description = "Allow TLS inbound traffic and all outbound traffic"
  vpc_id      = aws_vpc.main-vpc.id
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.main-security-group.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"

  tags = {
    Name = "Allow https"
  }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.main-security-group.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
  tags = {
    Name = "Allow http"
  }
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.main-security-group.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  tags = {
    Name = "Allow ssh"
  }
}

resource "aws_vpc_security_group_egress_rule" "allow_all_traffic_ipv4" {
  security_group_id = aws_security_group.main-security-group.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
  tags = {
    Name = "Allow all outgoing"
  }
}

resource "aws_network_interface" "web-server-nic" {
  subnet_id       = aws_subnet.main.id
  private_ips     = ["10.0.1.50"]
  security_groups = [aws_security_group.main-security-group.id]
}

resource "aws_eip" "lb" {
  network_interface = aws_network_interface.web-server-nic.id
  domain   = "vpc"
  associate_with_private_ip = "10.0.1.50"
  depends_on = [ aws_internet_gateway.main-gw ]
}

resource "aws_instance" "web" {
  ami = "ami-0e5f882be1900e43b"
  instance_type = "t2.micro"
  availability_zone = "eu-west-2a"
  key_name = "main-key"

  tags = {
    Name = "HelloWorld"
  }
  network_interface {
    network_interface_id = aws_network_interface.web-server-nic.id
    device_index = 0
  }

  user_data = <<-EOF
    #!/bin/bash
    sudo apt update -y
    sudo apt install apache2 -y
    sudo systemctl start apache2
    sudo bash -c 'echo your very first web server' > /var/www/html/index.html
    EOF
}

#### Output
output "server_public_ip" {
    value = aws_eip.lb.public_ip
}

output "server_private_ip" {
    value = aws_eip.lb.private_ip
}
