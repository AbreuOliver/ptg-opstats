# 📝 Meeting Notes – 10/03

**Subject:** Web App for County Transit Data Sharing

## ✅ Items Discussed

### 1. URL Update

- Change the route from `/forms/dashboard` to `/forms/service-statistics`.

### 2. Fiscal Year Overlap

- During Q1 of a new fiscal year, transit organizations may still be finalizing and submitting data from the **previous fiscal year**, while also starting to enter data for the **current year**.
- This overlap period must be supported in the app.

### 3. Federal Submission Deadline

- All required data must be submitted to the federal government by **November 30**.

### 4. Editable Periods

- During Q1 of a new fiscal year:
  - Allow users to edit **Q1 of the current year**.
  - Also allow editing of **any quarter from the previous fiscal year**.
- This flexibility should only be available during this overlap period.

### 5. Year Locking and Admin Access

- Admins (e.g., Jeremy) should be able to manually "unlock" a past fiscal year to make it editable again if needed.

### 6. UI/UX Indicators

- When a fiscal year is "closed":
  - Display a **clear visual indicator** (e.g., badge or label).
  - Show the data as **read-only**, but still **allow download** access.

### 7. Email Notifications

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
