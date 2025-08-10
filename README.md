# Scalable Real-Time Restaurant Ordering: A Proof of Concept

## Project Overview

This project serves as a proof of concept for a real-time, scalable ordering system designed for a restaurant environment. The core objective was to design a system capable of handling a high volume of concurrent user actions and ensuring that updates are broadcast instantly to all relevant parties—both customers at a table and the restaurant staff. The solution leverages Socket.IO for real-time communication, ensuring a seamless and efficient dining experience.

---

## Business Needs

In a modern restaurant, efficiency and real-time communication are paramount. The system must address two key challenges:

1.  **Customer-side:** A group of clients at a single table need to interact with a shared digital "cart" or order session. Any update—adding a dish, changing a quantity—must be instantly visible to all other clients at that table. This prevents duplicate orders and misunderstandings.
2.  **Staff-side:** The staff, from the kitchen to the service team, needs a centralized, real-time view of all active table orders. This allows them to manage incoming requests efficiently, ensuring faster service and fewer errors.

This proof of concept demonstrates a robust, high-performance architecture that meets these needs and can withstand significant stress.

---

## Architecture

The system is built on an event-driven, microservices-friendly architecture that facilitates real-time communication between multiple clients.

- **Client:** Web-based clients (e.g., customers' phones, staff tablets) use Socket.IO to connect to the server.
- **Server:** A Node.js server manages these Socket.IO connections. It handles the "add-item" event and, upon receiving it, publishes the update to a **Redis Pub/Sub** channel.
- **Redis Pub/Sub:** This is a crucial component for horizontal scaling. When a server publishes an update to a Redis channel, all other servers subscribed to that channel immediately receive the message.
- **Server (continued):** Each server, upon receiving a message from Redis, broadcasts the update to the relevant **Socket.IO rooms**. Clients at a specific table join a unique "table session" room, while staff are subscribed to a separate "staff channel." This ensures that every client receives the update instantly, regardless of which server they are connected to.

This architecture ensures high availability and resilience, as a single server is not a point of failure and the system can scale easily by adding more servers.

---

## Load Test Results

The final stress test pushed the solution to its limits, simulating a massive load of **91,500 virtual users** over 4 minutes. The system successfully handled over **45 million messages** with a near-perfect success rate. The server's CPU remained below 50% utilization, confirming that the architecture is highly performant and the solution is ready for a production environment.
