#!/bin/bash

# Create directory for SSL certificates
mkdir -p ssl

# Generate a private key
openssl genrsa -out ssl/key.pem 2048

# Generate a CSR (Certificate Signing Request)
openssl req -new -key ssl/key.pem -out ssl/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate a self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in ssl/csr.pem -signkey ssl/key.pem -out ssl/cert.pem

# Remove the CSR as it's no longer needed
rm ssl/csr.pem

echo "Self-signed SSL certificates have been generated in the ssl directory."
