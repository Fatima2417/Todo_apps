#!/bin/bash
# Prerequisites check script

echo "=== Phase 5A Prerequisites Check ==="
echo ""

# Check Docker
echo "1. Checking Docker..."
if command -v docker &> /dev/null; then
    echo "   ✓ Docker installed: $(docker --version)"
    if docker ps &> /dev/null; then
        echo "   ✓ Docker is running"
    else
        echo "   ✗ Docker is NOT running - Please start Docker Desktop"
    fi
else
    echo "   ✗ Docker not installed"
fi
echo ""

# Check Minikube
echo "2. Checking Minikube..."
if command -v minikube &> /dev/null; then
    echo "   ✓ Minikube installed: $(minikube version --short)"
    if minikube status &> /dev/null; then
        echo "   ✓ Minikube is running"
    else
        echo "   ✗ Minikube is NOT running"
    fi
else
    echo "   ✗ Minikube not installed"
fi
echo ""

# Check kubectl
echo "3. Checking kubectl..."
if command -v kubectl &> /dev/null; then
    echo "   ✓ kubectl installed: $(kubectl version --client --short 2>/dev/null)"
else
    echo "   ✗ kubectl not installed"
fi
echo ""

# Check Helm
echo "4. Checking Helm..."
if command -v helm &> /dev/null; then
    echo "   ✓ Helm installed: $(helm version --short)"
else
    echo "   ✗ Helm not installed"
fi
echo ""

# Check Dapr CLI
echo "5. Checking Dapr CLI..."
if command -v dapr &> /dev/null; then
    echo "   ✓ Dapr CLI installed: $(dapr version | grep 'CLI version')"
else
    echo "   ✗ Dapr CLI not installed"
fi
echo ""

# Check Python
echo "6. Checking Python..."
if command -v python &> /dev/null; then
    echo "   ✓ Python installed: $(python --version)"
else
    echo "   ✗ Python not installed"
fi
echo ""

# Check Node.js
echo "7. Checking Node.js..."
if command -v node &> /dev/null; then
    echo "   ✓ Node.js installed: $(node --version)"
else
    echo "   ✗ Node.js not installed"
fi
echo ""

echo "=== Check Complete ==="
