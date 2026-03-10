# Kafka Management Commands

This guide covers common Kafka management tasks for the Phase 5A deployment using Strimzi on Minikube.

## Prerequisites

- Minikube running
- Strimzi operator installed
- Kafka cluster deployed

## Checking Kafka Status

### Check Kafka Cluster Status
```bash
kubectl get kafka -n kafka
```

Expected output:
```
NAME         DESIRED KAFKA REPLICAS   DESIRED ZK REPLICAS   READY   WARNINGS
todo-kafka   1                        1                     True
```

### Check Kafka Pods
```bash
kubectl get pods -n kafka
```

You should see:
- `strimzi-cluster-operator-*` - Strimzi operator
- `todo-kafka-kafka-0` - Kafka broker
- `todo-kafka-zookeeper-0` - Zookeeper instance
- `todo-kafka-entity-operator-*` - Entity operator for topics/users

### Check Kafka Logs
```bash
# Kafka broker logs
kubectl logs -n kafka todo-kafka-kafka-0 -f

# Zookeeper logs
kubectl logs -n kafka todo-kafka-zookeeper-0 -f

# Strimzi operator logs
kubectl logs -n kafka -l name=strimzi-cluster-operator -f
```

## Managing Kafka Topics

### List All Topics
```bash
kubectl get kafkatopics -n kafka
```

### Describe a Topic
```bash
kubectl describe kafkatopic task-events -n kafka
```

### Check Topic Configuration
```bash
kubectl get kafkatopic task-events -n kafka -o yaml
```

### Create a New Topic
```yaml
# new-topic.yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: new-topic
  namespace: kafka
  labels:
    strimzi.io/cluster: todo-kafka
spec:
  partitions: 3
  replicas: 1
  config:
    retention.ms: 604800000  # 7 days
    segment.bytes: 1073741824
```

```bash
kubectl apply -f new-topic.yaml
```

### Delete a Topic
```bash
kubectl delete kafkatopic <topic-name> -n kafka
```

## Testing Kafka Connectivity

### Run a Test Producer
```bash
kubectl run kafka-producer -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-console-producer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events
```

Type messages and press Enter. Press Ctrl+C to exit.

### Run a Test Consumer
```bash
kubectl run kafka-consumer -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-console-consumer.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --topic task-events --from-beginning
```

Press Ctrl+C to exit.

### Check Topic Messages Count
```bash
kubectl run kafka-get-offsets -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-run-class.sh kafka.tools.GetOffsetShell --broker-list todo-kafka-kafka-bootstrap:9092 --topic task-events
```

## Monitoring Kafka

### Check Consumer Groups
```bash
kubectl run kafka-consumer-groups -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-consumer-groups.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --list
```

### Describe Consumer Group
```bash
kubectl run kafka-consumer-groups -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-consumer-groups.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092 --describe --group <group-name>
```

### Check Kafka Metrics
```bash
# Port-forward to Kafka metrics endpoint
kubectl port-forward -n kafka svc/todo-kafka-kafka-bootstrap 9404:9404

# Access metrics at http://localhost:9404/metrics
```

## Troubleshooting

### Kafka Not Starting
```bash
# Check events
kubectl get events -n kafka --sort-by='.lastTimestamp'

# Check operator logs
kubectl logs -n kafka -l name=strimzi-cluster-operator --tail=100

# Check resource limits
kubectl describe pod todo-kafka-kafka-0 -n kafka
```

### Topic Not Created
```bash
# Check entity operator logs
kubectl logs -n kafka -l strimzi.io/name=todo-kafka-entity-operator -c topic-operator

# Verify topic resource
kubectl get kafkatopic <topic-name> -n kafka -o yaml
```

### Connection Issues
```bash
# Test from within cluster
kubectl run kafka-test -ti --rm --restart=Never --image=quay.io/strimzi/kafka:latest-kafka-3.6.0 -n kafka -- bin/kafka-broker-api-versions.sh --bootstrap-server todo-kafka-kafka-bootstrap:9092

# Check service endpoints
kubectl get endpoints -n kafka todo-kafka-kafka-bootstrap
```

### Performance Issues
```bash
# Check resource usage
kubectl top pod -n kafka

# Check disk usage (if using persistent volumes)
kubectl exec -n kafka todo-kafka-kafka-0 -- df -h

# Check network connectivity
kubectl exec -n kafka todo-kafka-kafka-0 -- netstat -an | grep 9092
```

## Cleanup

### Delete All Topics
```bash
kubectl delete kafkatopics --all -n kafka
```

### Delete Kafka Cluster
```bash
kubectl delete kafka todo-kafka -n kafka
```

### Uninstall Strimzi
```bash
kubectl delete -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
kubectl delete namespace kafka
```

## Useful Kafka Configurations

### Increase Retention Time
```yaml
spec:
  config:
    retention.ms: 2592000000  # 30 days
```

### Increase Partitions
```yaml
spec:
  partitions: 6  # Increase from 3 to 6
```

### Enable Compression
```yaml
spec:
  config:
    compression.type: "gzip"
```

## References

- [Strimzi Documentation](https://strimzi.io/docs/operators/latest/overview.html)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka CLI Tools](https://kafka.apache.org/documentation/#basic_ops)
