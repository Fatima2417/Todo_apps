# 🚀 Getting Started with Phase 5A

**Welcome!** This guide will help you get the Phase 5A Todo application running on your machine.

---

## ⏱️ Time Required

- **First-time setup**: 45-60 minutes
- **Subsequent starts**: 2-3 minutes

---

## 📋 What You'll Need

Before starting, ensure you have:

1. ✅ **Docker Desktop** - Running and accessible
2. ✅ **4GB+ RAM** - Available for Minikube
3. ✅ **10GB+ Disk Space** - For images and data
4. ✅ **Internet Connection** - For downloading components
5. ✅ **Terminal/Command Prompt** - For running commands

---

## 🎯 Three Simple Steps

### Step 1: Check Prerequisites (5 minutes)

Run the prerequisites checker:

```bash
cd "C:\Users\Hp\Documents\H_2_F - Phase 4 copy"
bash scripts/check-prerequisites.sh
```

**Expected Output**: All items should show ✓

**If any items show ✗**: Follow the installation instructions in [docs/SETUP-GUIDE.md](SETUP-GUIDE.md) Part 1

---

### Step 2: Follow the Setup Guide (40-50 minutes)

Open and follow the complete setup guide:

```bash
cat docs/SETUP-GUIDE.md
```

Or open it in your text editor/browser.

**The guide covers**:
- Installing all prerequisites
- Starting infrastructure (Minikube, Kafka, Dapr)
- Building Docker images
- Deploying all services
- Verifying everything works

**Pro Tip**: Follow the guide step-by-step. Don't skip steps!

---

### Step 3: Test the Application (5-10 minutes)

Once deployed, test all features using the demo script:

```bash
cat docs/phase5a-demo-script.md
```

**You'll test**:
- Creating tasks with priorities and tags
- Searching and filtering
- Sorting tasks
- Recurring tasks
- Due dates and reminders
- Browser notifications
- Event flow through Kafka

---

## 🆘 If Something Goes Wrong

1. **Check the troubleshooting guide**:
   ```bash
   cat docs/troubleshooting.md
   ```

2. **Common issues**:
   - Docker not running → Start Docker Desktop
   - Minikube won't start → Run `minikube delete` then `minikube start`
   - Pods not starting → Check logs: `kubectl logs <pod-name>`

3. **Get help**:
   - Review [docs/QUICK-REFERENCE.md](QUICK-REFERENCE.md) for commands
   - Check [docs/INDEX.md](INDEX.md) for all documentation

---

## 📚 Documentation Overview

Here's what each document does:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **INDEX.md** | Documentation index | Finding specific docs |
| **SETUP-GUIDE.md** | Complete installation | First-time setup |
| **QUICK-REFERENCE.md** | Command reference | Daily operations |
| **troubleshooting.md** | Problem resolution | When things break |
| **phase5a-demo-script.md** | Feature testing | After deployment |
| **kafka-management.md** | Kafka operations | Managing Kafka |
| **dapr-commands.md** | Dapr operations | Managing Dapr |

---

## 🎓 Learning Path

### For Beginners

1. **Day 1**: Install prerequisites and start Minikube
   - Follow SETUP-GUIDE.md Parts 1-2
   - Goal: Get Minikube running

2. **Day 2**: Deploy infrastructure (Kafka + Dapr)
   - Follow SETUP-GUIDE.md Parts 3-5
   - Goal: Get Kafka and Dapr running

3. **Day 3**: Build and deploy application
   - Follow SETUP-GUIDE.md Parts 6-8
   - Goal: Get application running

4. **Day 4**: Test and explore features
   - Follow phase5a-demo-script.md
   - Goal: Understand all features

### For Experienced Users

1. **Quick Setup** (1 hour):
   - Run through entire SETUP-GUIDE.md
   - Deploy everything in one session

2. **Exploration** (30 minutes):
   - Test features with demo script
   - Explore Dapr dashboard
   - Monitor Kafka messages

---

## ✅ Success Checklist

You'll know everything is working when:

- [ ] All pods show 2/2 Ready: `kubectl get pods`
- [ ] Frontend is accessible: `minikube service todo-frontend --url`
- [ ] You can create tasks in the UI
- [ ] Events appear in audit logs: `kubectl logs -l app=audit-service -c audit-service`
- [ ] Kafka topics exist: `kubectl get kafkatopics -n kafka`
- [ ] Dapr components loaded: `kubectl get components`
- [ ] Browser notifications work (after granting permission)
- [ ] Recurring tasks create next occurrence
- [ ] Search and filter work correctly

---

## 🎯 Quick Commands Reference

### Daily Operations
```bash
# Start everything
minikube start
minikube service todo-frontend --url

# Stop everything
minikube stop

# Check status
kubectl get pods
dapr status -k
```

### Monitoring
```bash
# View logs
kubectl logs -l app=todo-backend -c todo-backend -f

# Check resources
kubectl top pods

# Open dashboards
dapr dashboard -k
minikube dashboard
```

### Troubleshooting
```bash
# Restart deployment
kubectl rollout restart deployment todo-backend

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name>
```

---

## 🚀 After Setup

Once everything is running:

1. **Bookmark these docs**:
   - QUICK-REFERENCE.md for daily commands
   - troubleshooting.md for when things break

2. **Explore the features**:
   - Create tasks with different priorities
   - Add tags and filter by them
   - Set up recurring tasks
   - Test reminders and notifications

3. **Monitor the system**:
   - Watch Kafka messages
   - Check Dapr dashboard
   - View microservice logs

4. **Learn the architecture**:
   - Read PHASE5A-COMPLETION-SUMMARY.md
   - Understand event flow
   - Explore microservices

---

## 💡 Pro Tips

1. **Use aliases**: Add kubectl/helm aliases to your shell (see QUICK-REFERENCE.md)
2. **Keep terminals open**: Have separate terminals for logs, commands, and monitoring
3. **Use port-forwarding**: Easier than minikube service for debugging
4. **Check logs first**: Most issues are visible in pod logs
5. **Restart when stuck**: `kubectl rollout restart deployment` fixes many issues

---

## 🎉 You're Ready!

Now that you have this overview, start with:

```bash
cat docs/SETUP-GUIDE.md
```

And follow it step-by-step. Good luck! 🚀

---

## 📞 Need Help?

1. Check [troubleshooting.md](troubleshooting.md)
2. Review [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
3. Search [INDEX.md](INDEX.md) for specific topics
4. Check pod logs: `kubectl logs <pod-name>`

---

**Last Updated**: March 6, 2026
**Version**: 5.0.0
**Status**: Production Ready ✅
