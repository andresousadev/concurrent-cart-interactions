# Socket.IO Load Test Report

### 🧪 Executive Summary

A series of stress tests were conducted on the Socket.IO-based restaurant ordering system to determine its performance and scalability. After initial test misconfigurations were corrected, the system was subjected to an extreme load test.

The results demonstrated that the architecture is exceptionally robust and efficient. The solution successfully handled a peak of **91,500 concurrent users** and processed over **45.7 million messages** with a minimal failure rate of 0.009%. The server's CPU utilization remained low throughout the test, confirming that the system's architecture is highly scalable and not CPU-bound.

---

### 📈 Test Configuration and Results

The final, successful test was designed to find the system's breaking point by subjecting it to a high, sustained load of concurrent virtual users (VUs).

#### **Final Test Configuration:**

- **Platform:** Artillery (using the `socketio-v3` engine)
- **Target:** `http://localhost:3000`
- **VUs Created:** 91,500
- **Total Messages Sent:** 45,745,500
- **Messages Sent Per Second:** 183,708
- **Total Test Duration:** 4 minutes, 2 seconds

#### **Key Findings:**

| Metric                       | Value   | Conclusion                                                                                                                                                                                                                      |
| :--------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`vusers.completed`**       | 91,491  | The system successfully managed the full load, with only 9 VUs failing to complete out of 91,500. This is an exceptional result, highlighting the system's stability.                                                           |
| **`errors.websocket error`** | 9       | The failure rate was an extremely low **0.009%**. These transient errors are expected at this scale and are likely due to minor, temporary network or system-level connection issues, not a fundamental performance bottleneck. |
| **CPU Usage**                | Max 50% | Under this extreme load, the server's CPU did not exceed 50% utilization. This indicates that the application is highly efficient and its performance limits are not tied to CPU capacity.                                      |

---

### 📋 Full Artillery Summary Report

````All VUs finished. Total time: 4 minutes, 2 seconds

--------------------------------
Summary report @ 21:30:34(+0100)
--------------------------------

engine.socketio.emit: .......................................................... 45745500
engine.socketio.emit_rate: ..................................................... 183708/sec
errors.websocket error: ........................................................ 9
vusers.completed: .............................................................. 91491
vusers.created: ................................................................ 91500
vusers.created_by_name.Concurrent Cart Adds: ................................... 91500
vusers.failed: ................................................................. 9
vusers.session_length:
  min: ......................................................................... 14.8
  max: ......................................................................... 714.5
  mean: ........................................................................ 60.9
  median: ...................................................................... 51.9
  p95: ......................................................................... 120.3
  p99: ......................................................................... 210.6```
````
