# Group Project – Problem Statement

> Source: [Canvas – Group Project - Problem Statement](https://baylor.instructure.com/courses/257917/pages/group-project-problem-statement) (CSI 5324, Fall 2026)

## Recruiting and Application Management System

Your team will design and develop a web-based **Recruiting and Application Management System**.

The system should support the major activities involved in recruiting and applying for employment opportunities. It should provide an environment in which organizations can manage job opportunities and applicants can participate in the recruiting process.

The project should model a realistic recruiting environment involving multiple user roles, business rules, persistent data, and interactions among different parts of the system.

**Your team is responsible for investigating the problem domain and determining the detailed requirements, workflows, data model, system behavior, and user interface.**

The completed system should include sufficient functionality to demonstrate:

- Multiple interacting user roles
- Role-based access control
- Business logic beyond basic CRUD operations
- Persistent data management
- A coherent recruiting workflow
- Appropriate software architecture
- Automated testing
- Deployment as a web application

The project is not expected to reproduce a full commercial applicant tracking system. Teams should define a reasonable scope and justify the requirements they choose to implement. You can use **LinkedIn Jobs / Indeed / Snagajob** as references to understand application features and requirements.

## Core Roles

At minimum, the system should support the following roles.

### Applicant

A person seeking employment opportunities through the system. Typical responsibilities:

- Maintaining an applicant profile
- Exploring available opportunities
- Preparing and submitting applications
- Providing resume or related application materials
- Tracking recruiting activities and application progress
- Responding to actions that require applicant input
- …

### Recruiter / HR

Represents an organization conducting recruiting activities. Typical responsibilities:

- Managing employment opportunities
- Reviewing applicants and application materials
- Managing the progress of candidates through the recruiting process
- Coordinating recruiting activities such as interviews
- Recording recruiting decisions
- Communicating appropriate outcomes to applicants
- …

### Administrator

Manages system-level functions that should not normally be performed by applicants or recruiters. Typical responsibilities:

- Managing user accounts and access
- Managing roles and permissions
- Maintaining system configuration or reference information
- Supporting appropriate administrative oversight of the system
- …

The descriptions above establish the **general problem domain rather than a complete requirements specification**. Each team is expected to determine:

- Detailed functional requirements
- Nonfunctional requirements
- Business rules
- Use cases
- Application workflow
- Data entities and relationships
- Authorization rules
- User interface behavior
- Appropriate exceptions and failure conditions

Teams may introduce additional user roles or functionality when appropriate.

## AI-Related Functionality (optional)

The recruiting domain provides opportunities for optional AI-supported functionality. Possible examples:

- Resume information extraction
- Resume and job matching
- Resume feedback
- Interview question generation
- Assistance with candidate or job-related information

Teams are not required to implement a specific AI feature unless otherwise specified.

If AI functionality is included, the team should consider reliability, validation, privacy, appropriate human oversight, and the behavior of the system when AI-generated output is incomplete or incorrect. AI should support the recruiting system rather than replace the core software engineering functionality of the application.

## Scope

Each team should define a project scope that is substantial enough for a semester-long graduate software engineering project but realistic enough to complete, test, document, and deploy. Teams are expected to justify their selected requirements and demonstrate how those requirements evolve through analysis, design, implementation, testing, and evaluation.
