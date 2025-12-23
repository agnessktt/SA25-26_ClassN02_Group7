📘 Student Grade Management System (SGMS)

1. Project Introduction

The Student Grade Management System (SGMS) is a simple system designed for a small academic department to manage student grades. The system supports managing students, courses, enrollments, and assigning/viewing grades in an efficient manner.

This project is developed as part of the Software Architecture course, with a focus on applying the Layered Architecture using a 2-Tier (Client–Server) model.

2. Project Objectives

Apply a layered architecture following academic standards

Manage student and course information

Manage student enrollments

Allow faculty members to assign and view grades

Practice architectural design, UML modeling, and system documentation

3. Functional Scope

Main Features

Add, update, and view student information

Add, update, and view course information

Enroll students in courses

Assign grades to students

View grades and calculate GPA

System Users

Admin: manages students and courses

Faculty: assigns and views grades

4. System Architecture

4.1 Architectural Model

Architecture Style: Layered Architecture

Deployment Model: 2-Tier

Client: Web UI (Presentation Layer)

Server: Business Logic, Persistence, and Data Layers

4.2 Logical Layers

Presentation Layer (Controller)

Business Logic Layer (Service)

Persistence Layer (Repository)

Data Layer (Database)

5. Data Model

The system uses the following core data model:

Student

Course

Enrollment (links Student and Course and stores grades)

6. Technologies Used

Programming Language: TBD

Framework: TBD

Database: SQLite

UML Design Tools: Draw.io

Version Control: GitHub

7. Related Documents
Software Requirement Specification (SRS)

Architectural Design Document

Project Plan

UML Diagrams:

Use Case Diagram (Lab 1)

Component Diagram (Lab 2)

8. Team Members

Group 7 – Class CSE703110-1-2-25 (N02)

Le Thi Kieu Trang – 23010502

Quach Huu Nam – 23012358

Trieu Tien Quynh – 23010648

9. Project Status

Requirements Analysis

Architectural Design

UML Component Diagram

Documentation

System Implementation (if applicable)

10. Notes

This project is developed for educational purposes. The architecture and functionality are designed to match a small-scale system and the requirements of the course.

📌 This README provides a quick overview of the project for GitHub or project submission.