#!/bin/bash
# Strimzi Kafka Operator Installation Script for Minikube
# Phase 5A - Advanced Features

set -e

echo "=========================================="
echo "Installing Strimzi Kafka Operator"
echo "=========================================="

# Create kafka namespace
echo "Creating kafka namespace..."
kubectl create namespace kafka --dry-run=client -o yaml | kubectl apply -f -

# Install Strimzi operator
echo "Installing Strimzi operator..."
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Wait for operator to be ready
echo "Waiting for Strimzi operator to be ready..."
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

echo "=========================================="
echo "Strimzi operator installed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Apply Kafka cluster: kubectl apply -f k8s/strimzi/kafka-cluster.yaml -n kafka"
echo "2. Apply Kafka topics: kubectl apply -f k8s/strimzi/kafka-topics.yaml -n kafka"
echo ""
echo "Verify installation:"
echo "kubectl get pods -n kafka"
