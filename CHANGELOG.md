## [0.1.0] - 2025-12-05 (Completed Lab 1)
### Added (Project Initialization)
- **Project Setup:**
	- Formed a 3-member team and assigned roles.
	- Created project directory structure and `README.md` file.
- **Software Requirements Specification (SRS):**
	- Identified 5 core Functional Requirements (FR-01 to FR-05).
	- Identified key Architecturally Significant Requirements (ASRs): Data Integrity, Security, Modifiability.
- **Use Case Modeling:**
	- Created Use Case Diagram with 2 main actors: **Admin** and **Faculty**.
	- Defined key use cases: Manage Students, Course Enrollment, Assign Grades.

### Fixed (Corrections/Adjustments)
- Renamed the "Instructor" actor to "Faculty" to ensure terminology consistency across the project.
- Added the **"Enroll Student in Course"** use case to ensure the grade entry workflow is feasible for Lab 2 implementation.

## [0.2.0] - 2025-12-18 (Completed Lab 2)
### Added (New Features/Documentation)
- **Architectural Design Document:**
	- Established the 2-Tier Layered Architecture model.
	- Defined detailed responsibilities for 4 layers: Presentation, Business Logic, Persistence, and Data.
- **UML Component Diagram (Lab 2):**
	- Finalized the detailed Component Diagram for 3 modules: `Student`, `Course`, `Enrollment`.
	- Clearly defined connection Interfaces: `IEnrollmentService`, `IEnrollmentRepository`, etc.
	- Modeled DTOs (Domain Objects) for data transfer between layers.

### Changed (Significant Design Changes)
- **Business Logic Refactoring:** Shifted grade management logic from `GradeService` to **`EnrollmentService`** to correctly reflect the data model (grade is an attribute of the Enrollment entity).
- **Report Update:** Synchronized component names in the Lab 2 report to match the Component Diagram 100%.
- **Clarification:** Clarified the Data Layer's role as physical storage infrastructure, distinct from the software component layers.

## [0.3.0] - 2025-12-20 (Completed Lab 3)
Added (Implementation Phase)
Codebase Implementation:

Implemented the initial Monolithic application using Python/Flask.

Created database schema (MySQL) for Students, Courses, and Enrollments.

Developed basic CRUD APIs for managing students and courses.

## [0.4.0] - 2025-12-25 (Completed Lab 4 - Microservices Transition)
Added (Microservices & New Features)
Architectural Decomposition:

Refactored the system from Monolithic Layered Architecture to Microservices Architecture.

Defined 4 distinct services based on business capabilities: Identity, Student, Course, and Grade Service.

Grade Service Enhancements:

Implemented GPA Calculation Algorithm (Weighted Average) to support complex grading logic.

Added Dynamic Weights Support: Enabled the system to accept custom weight configurations (e.g., 10-10-30-50) from the client/Web App via API.

Added Detailed Grade Breakdown: API responses now include detailed component scores (CC1, CC2, GK, CK) alongside the final grade.

System Design Documentation:

Created C4 Model (Level 1) diagram to illustrate the System Context and interactions with External Systems (Email Service).

Defined Communication Strategy distinguishing between Synchronous (HTTP/REST for GPA/Credits) and Asynchronous (Email Notification) interactions.

Changed (Refactoring & Optimization)
Data Aggregation Logic:

Updated Repository to perform efficient data retrieval.

Grade Service now consumes data from Course Service (Credits) to calculate GPA, enforcing the Producer-Consumer pattern.

API Response Formatting:

Refined GET /api/enrollments to automatically sort results by Student ID then Course Code, improving readability for Faculty/Admins.

Database Integrity:

Enforced stricter validation rules in the codebase (e.g., Grade range 0-10, Weights sum = 100%).

Fixed (Bug Fixes)
Credits Display Issue: Fixed a bug where credit information was missing from the Grade entry response (solved by updating the Model to_dict method).

Duplicate Data Entry: Implemented checks to prevent duplicate enrollment records for the same student in the same course.

