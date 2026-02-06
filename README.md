# Academic Management System (AMS)
Microservices-based Academic Management System

This repository contains the **Academic Management System (AMS)** project developed using **Microservices Architecture** as part of the **Software Architecture** course at **Phenikaa University**.

The system supports student management, course registration, grading, GPA calculation, and asynchronous email notifications, following modern distributed system design principles.

---

## 📚 Course Information

- **Course**: Software Architecture  
- **Class**: CSE703110-1-2-25 (N02)  
- **Academic Year**: 2025 – 2026  
- **University**: Phenikaa University  
- **Instructor**: M.S. Vu Quang Dung  

---

## 👥 Team Information – Group 7

| No. | Name | Student ID | 
|----|------|------------|
| 1 | Le Thi Kieu Trang | 23010502 | 
| 2 | Quach Huu Nam | 23012358 | 
| 3 | Trieu Tien Quynh | 23010648 | 

---

## 🎯 Project Overview

The **Academic Management System (AMS)** is designed to support the **credit-based training model** in universities.

The system allows:
- **Students** to register courses, view grades, transcripts, and GPA
- **Lecturers** to enter, manage, and finalize grades
- **Administrators** to manage academic structures and generate reports

The project demonstrates the transition from a traditional **Monolithic Architecture** to a **Microservices Architecture**, improving scalability, maintainability, and fault isolation.

---

## 🏗 Architecture Overview

- **Architecture Style**: Microservices Architecture
- **Frontend**: Vanilla JavaScript (Single Page Application)
- **Backend**: Python Flask (Independent Microservices)
- **Database**: MySQL (Shared database with logical separation)
- **Communication**:
  - RESTful APIs (Synchronous)
  - Background Threads (Asynchronous processing)

---

## 🧩 Microservices List

| Service Name | Port | Responsibility |
|-------------|------|----------------|
| Identity Service | 5004 | Authentication & Authorization (JWT, RBAC) |
| Student Service | 5001 | Student profile management |
| Course Service | 5002 | Course and class management |
| Grade Service | 5003 | Grade entry and GPA calculation |
| Email Service | 5005 | Asynchronous email notification |
| Enrollment Service | 5006 | Course registration and cancellation |
| Faculty Service | 5007 | Faculty management |
| University Service | 5008 | University management |
| Major Service | 5009 | Major management |
| Notification Service | 5010 | RabbitMQ consumer for real-time student alerts |

---

## ⚙️ Technology Stack

### Frontend
- HTML5, CSS3
- Vanilla JavaScript (ES6+)
- Fetch API

### Backend
- Python 3
- Flask
- RESTful API
- Threading for asynchronous tasks

### Database
- MySQL

---

## 🚀 How to Run (Localhost)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/agnessktt/SA25-26_ClassN02_Group7.git
cd SA25-26_ClassN02_Group7
```

### 2️⃣ Configure environment variables
```bash
Create a .env file for each microservice:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sa
```

---

### 3️⃣ Install dependencies
```bash
pip install -r requirements.txt
```
---

### 4️⃣ Run services
```bash
Each microservice is started independently:

python app.py
```
---

## 🧪 Testing

### The system is tested using
- Unit Testing
- Integration Testing
- Functional Testing
- End-to-End Testing

### Tools
- Postman
- cURL
---

## 📌 Key Features

✔ JWT Authentication & RBAC

✔ Microservices Architecture

✔ GPA Calculation

✔ Course Enrollment Management

✔ Asynchronous Email Notification

✔ Modular and Scalable Design

---

## 📖 Academic Purpose

This project was developed for educational purposes to demonstrate:
- Microservices Design
- C4 Architecture Modeling
- Distributed System Communication
- Software Architecture Documentation

---

## 📜 License

This project is developed for academic purposes at Phenikaa University.

---




