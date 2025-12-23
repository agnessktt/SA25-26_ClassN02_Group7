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

