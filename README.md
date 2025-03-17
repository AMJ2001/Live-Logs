# Real-Time Log Processing 🚀

An application that handles large log files, processes them for errors, tracks specific keywords, and analyzes IPs.<br> It comes with a dashboard that provides real-time updates on queue status and job details, specifc to each user.

---

## **🚀 Technologies Used**

| **Technology**      |  |
|----------------------|--|
| ![Node.js](https://img.icons8.com/color/48/000000/nodejs.png)       | Server Logic |
| ![Next.js](https://img.icons8.com/color/48/000000/nextjs.png)      | Frontend Framework |
| ![Redis](https://img.icons8.com/color/48/000000/redis.png)          | Job Queue Management |
| ![Docker](https://img.icons8.com/fluency/48/000000/docker.png)      | Containerization |
| **Supabase** | Database & Auth |
| **BullMQ** | Job Queueing |
| **Framer Motion** | UI Animations |

---

## **⚙️ Setup Instructions**

### **With Docker**
1. Clone the repository:
   ```bash
     git clone <repository-url>
     cd <repository-folder>
   ```
2. Set up the environment variables in a .env file:
   ```bash
    SUPABASE_URL=<your_supabase_url>
    SUPABASE_KEY=<your_supabase_key>
    NEXT_PUBLIC_WEBSOCKET_URL=<your_websocket_url>
    NEXT_PUBLIC_API_BASE_URL=<your_api_base_url>
   ```
3. Build and start the project with Docker Compose:
   ```bash
   docker-compose up --build
   ```
4. Navigate to <u>http://localhost:3000<u>

### **With Docker**
You will have to setup both frontend and backend folders separately and run the following commands:
 ```bash
  npm install
  npm run build
  npm start
```

Here is a sample log file to test with: https://drive.google.com/file/d/1aj6SxL2P9ONPQXbGv7GNqhbc9xOzRxal/view?usp=sharing
<br>
## **📊 Benchmarks**

Here are some performance benchmarks for the Real-Time Log Processing system:

- **File Processing Speed**:  
  - Successfully processes a 10MB log file in under **75 seconds**.
  - Optimized to handle large files efficiently using Node.js and BullMQ.

- **Concurrent Job Handling**:  
  - Processes up to **50 concurrent jobs** with a robust retry mechanism in place for fault tolerance.

- **Queue Throughput**:  
  - Capable of processing over **1,000+ log jobs per hour** using Redis and BullMQ.

- **Real-Time Updates**:  
  - Maintains a **~1-second delay** for real-time queue and job updates via WebSocket depending on the file size.

- **Scalability**:  
  - Scales seamlessly to handle large workloads by leveraging Docker and Redis.

---

## **🚀 Key Features**

- **Real-Time Log Monitoring**:  
  Analyze logs for keywords, errors, and IPs in real time, with updates directly on the dashboard.

- **Error and Keyword Tracking**:  
  Automatically tracks and counts errors, keywords, and IP matches from the logs.

- **BullMQ Job Queue**:  
  Efficient job queueing with support for retries, concurrency control, and fault tolerance.

- **Supabase Integration**:  
  Logs metadata, such as processing stats, are stored securely in the Supabase database.

- **WebSocket-Based Updates**:  
  Real-time queue and job status updates ensure a seamless user experience on the dashboard.

- **Scalable Microservices Architecture**:  
  Built using Docker and Docker Compose for easy deployment and scaling.

- **Authentication**:  
  Fully integrated user authentication using Supabase for secure access to the platform.

- **Dashboard**:  
  Sleek and responsive React dashboard built with Next.js, providing powerful data visualization tools.

---


