## User Story

# Requirements Document

## 1. Overview

- Purpose of the tool
- Problem it solves
- Who it's for (stakeholders/users)

## 2. Goals and Scope

- Primary goals
- Features included
- Features explicitly out of scope

## 3. Users and Use Cases

- User roles (e.g. admin, data entry person)
- High-level use cases or user stories
  - e.g. “A data collector logs in and submits daily transit observations.”

## 4. Functional Requirements

- FR1: User authentication with email code
- FR2: Form-based data entry interface
- FR3: Data saved locally for offline use
- FR4: Sync with remote database (e.g. Supabase or RDS)

## 5. Non-functional Requirements

- NFR1: Must work offline and sync later
- NFR2: Simple UX with keyboard navigation
- NFR3: Works on tablets and desktops

## 6. Constraints

- Technology choices (e.g. SvelteKit, Supabase)
- Privacy or data retention policies

## 7. Assumptions and Dependencies

- Assumes users have internet access at least once daily
- Relies on Supabase auth/storage, or AWS RDS

## 8. Glossary (if needed)

## Acceptance Criteria

- Make UI only show current year, not have the user select from a year.
- Let users download the data from a previous year (PDF format, ZIP format)
- How will data be validated against previous years?
- What packages should I use to visualize the data for multiple years?
  -
