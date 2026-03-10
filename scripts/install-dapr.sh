#!/bin/bash
# Dapr Installation Script for Minikube
# Phase 5A - Advanced Features

set -e

echo "=========================================="
echo "Installing Dapr on Minikube"
echo "=========================================="

# Check if Dapr CLI is installed
if ! command -v dapr &> /dev/null; then
    echo "ERROR: Dapr CLI not found!"
    echo "Please install Dapr CLI first:"
    echo "wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash"
    exit 1
fi

# Initialize Dapr on Kubernetes
echo "Initializing Dapr on Kubernetes..."
dapr init --kubernetes --wait

# Verify Dapr installation
echo "Verifying Dapr installation..."
dapr status -k

echo "=========================================="
echo "Dapr installed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Apply Dapr components: kubectl apply -f helm/todo-backend/templates/dapr-components/"
echo "2. Deploy services with Dapr sidecars"
echo ""
echo "Verify installation:"
echo "kubectl get pods -n dapr-system"
