## Notes

### Fri, Feb 07

1. Make data no longer editable after a submission
2. Let users send emails from app when a change is requested (dynamic title)
3. Have a dashboard view for Jeremy
4. Let users see when they have unsaved changes (blue banner)
5. Let users see when their form is locked (yellow banner)
6. Locked pages can have their data downloaded (csv, PDF, charts as PNG)
7. Use [Skeleton pop ups](https://www.skeleton.dev/utilities/popups) to leave comments

### Fri, Feb 28

1. Let users sign the completed form

### Fri, May 23

1. Make the cells copy and paste-able!
2. Save the data for an individual tab with submission date

Name of the this
North Carolina Operating Statistics Data Portal

- make a way to load in each county's logo in the header of the web app when a county is using it.
- each county can only access it's own data
- ? how can Jeremy compare data between counties?
- find table Economic Database in AWS Console

- working to make a spreadsheet-like grid, break it down into components like Grid, Row (optional), Cell, Header, Section, Editor overlays, etc. Prioritize performance and reactivity to ensure DOM stability, with focus on accessibility and error boundaries. Split components for readability and maintainability, using actions for keyboard handling and number formatting. Consider using web workers for CSV parsing. Use context for cross-component grid management and a dirty indicator store. Avoid unnecessary nested components to manage complexity.

09/25
Name: North Carolina Operating Statistics

10/03

- the url '/forms/dashboard' should be converted to 'froms/service-statitics'
- Technically, there's an overlap that happens in the first quarter of the fiscal year: transit orgs can still be finishing up editing/sending last year's data while still being able to edit first quarter's data for the first year
- data must be sent to the federal government by November 30
- TODO: make it possible to edit q1 of current year and any quareter from last year during the period of overlap that is q1 of the 'next' year
- admin (jeremy) can 'unlock' a past year to make it editable
- when viewing a 'closed' year, have an indicator that shows it
- show old years as 'uneditable' but with data that can be downloaded
- TODO: send emails: <COUNTY NAME> <MESSAGE TYPE>: <FISCAL YEAR IN QUESTION> // ALAMANCE: QUESTION FY25
- TODO: when Jeremy 'unlock's a fiscal year, email is sent automatically to appropriate county.

# 📝 Meeting Notes – 10/03

**Subject:** Web App for County Transit Data Sharing

## ✅ Items Discussed

### 1. URL Update

- Change the route from `/forms/dashboard` to `/forms/service-statistics`.

### 2. Fiscal Year Overlap

- During Q1 of a new fiscal year, transit organizations may still be finalizing and submitting data from the **previous fiscal year**, while also starting to enter data for the **current year**.
- This overlap period must be supported in the app.

### 3. Editable Periods

- During Q1 of a new fiscal year:
  - Allow users to edit **Q1 of the current year**.
  - Also allow editing of **any quarter from the previous fiscal year**.
- This flexibility should only be available during this overlap period.

### 4. Year Locking and Admin Access

- Admins (e.g., Jeremy) should be able to manually "unlock" a past fiscal year to make it editable again if needed.

### 5. UI/UX Indicators

- When a fiscal year is "closed":
  - Display a **clear visual indicator** (e.g., badge or label).
  - Show the data as **read-only**, but still **allow download** access.

### 6. Email Notifications

- **Manual Messages:** Implement a feature to send emails with the following format:  
  `<COUNTY NAME> <MESSAGE TYPE>: <FISCAL YEAR>`  
  _Example: `ALAMANCE QUESTION: FY25`_
- **Automatic Notification:** When Jeremy unlocks a fiscal year, an **automated email** should be sent to the appropriate county contact.

---

## 🛠️ TODOs

- [ ] Update route to `/forms/service-statistics`.
- [ ] Implement editable overlap logic for Q1 (edit current Q1 + any quarter from previous FY).
- [ ] Display locked years with visual indicator; show data as read-only and downloadable.
- [ ] Allow admins to unlock fiscal years; trigger automatic email to relevant county when unlocked.
- [ ] Create email feature for sending manual messages to counties in specified format.
