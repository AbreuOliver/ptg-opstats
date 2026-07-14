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

10/17

- Dashboard for systems is past data
- For Jeremy: /docs Link to Github
- /forms - list all reports, not just urban rural
- make urban/rural a toggle in footer
- maybe make messages viewable next to cell with problems
- "Your report has been reviewed, some issues have been found. Please review comments" - a tooltip appears to let people know
- make list of transit systsem names editable for Jeremy
- make it so that jeremy can add email addresses and associated
- make it 'editable' that a transit system is 'finally submitted'
- password: ITRE102
- make system name default (not editable)

## RBAC + RDS ENV

This app now supports tenant-aware RBAC with two sources:

1. Claim-based fallback (from auth user metadata).
2. Optional RDS mapping table (`auth_user_access`) when `RBAC_USE_RDS_MAPPING=true`.

### User metadata keys (claims)

If you are using Supabase today (or Cognito JWT claims later), provide these keys:

- `role`: one of `super_admin`, `admin`, `user`
- `transit_system`: transit agency/system name for non-super-admin accounts
- `allowed_transit_systems`: optional array for super-admin scoped lists

Examples:

```json
{
  "role": "super_admin",
  "allowed_transit_systems": ["JCATS", "GO WAKE ACCESS", "YADKIN VALLEY"]
}
```

```json
{
  "role": "admin",
  "transit_system": "JCATS"
}
```

### `.env.local` template

Use `.env.local.template` as the source of truth. Required names:

```bash
# Current auth
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=

# RDS (MySQL)
AWS_RDS_DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
# or AWS_RDS_HOST/AWS_RDS_PORT/AWS_RDS_DATABASE/AWS_RDS_USER/AWS_RDS_PASSWORD
AWS_RDS_SSL=true
AWS_RDS_SSL_VERIFY_IDENTITY=true
AWS_RDS_SSL_CA_PATH=./global-bundle.pem
RBAC_USE_RDS_MAPPING=false

# Planned Cognito + SES OTP migration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
COGNITO_APP_CLIENT_SECRET=
COGNITO_ISSUER=
COGNITO_JWKS_URL=
SES_FROM_EMAIL=
SES_FROM_NAME=NC OpStats
```

### RDS access-mapping table

Create `auth_user_access` in RDS to centrally manage who can access what:

- Super admins can manage all users.
- Admins can be limited to managing users within their own transit system.

Schema is provided in: `docs/rbac_rds_schema.sql`

Git-style tracking of each cells values over time and who saved them?
Have a sidebar that shows all changes in reverse chronological order?
Hover a cell to see that cell's last value and who changed it?
Or have a merge-style 'approval step' when changes are made?

Jeremy wont do anything until Oct 1
Things due Sept 1

IDM user -- can only view


----
July 10


- [x] Correct where Operating Days are getting saved ('Mode' field).

- [x] Make CTP Grantee's Legal Name field uneditable.

- [ ] Create a single source-of-truth for all transit company names.

- [ ] Divide the Admin/Operating and Capital sections at Rural > Finance.

- [ ] Add the missing "Total Passenger Trips for All Modes" summary row to the bottom of the Weekday, Saturday, Sunday, and Weekly Totals forms.

- [ ] Update Annual Stats maintenance terminology: Change "In-House" to "Agency-Owned Shop".

- [ ] Investigate and fix the Annual Stats intermittent "Save" button bug where it does not appear initially.

- [ ] Fix Completion page layout so it doesn't look like the Urban completion form.

- [ ] Change "Total Operating Assistance" to "Total Operating Expense" in Rural Finance.

- [ ] Update Rural > Annual Stats terminology: Change "In-House" to "Agency-Owned Shop" and "Mixed" to "Both".

- [ ] Remove the Safety Stats section entirely from Rural > Annual Stats.


COMPLETION 
FINCANCE 
ANNUAL STATISTICS
WEEKDAY/SATURDAY/SUDNAY - total passengers summary (total of total)

can we enforce 'filling out a cell' instead of just leaving it blank for certain cells (tabs)?
add a button for like 'Confirm no physical assualts'
do you want this 'error' to prevent saving on all pages or JUST the completion tab?

forwad someone a link to sign the completion form?

webinars are next week

sort activity by agency and/or user and/or user type

look for remote db changes, if present, show 'you need to refresh' banner (clear local cache and refresh the page)


let Jeremy send an invite email to users (under Users page, next to Create User)

include invite email for when transit systems add users to their system

flip backend data to prod

saving data as a report to dowonload and print (from S3)

- [ ] Add signature for TAB Chairperson (RURUAL > COMPLETION)
- [ ] Hardcode the two modes: 'DO' & 'PT' in the RURAL > COMPLETION page
- [ ] Let admin send request for TAB
- [ ] for both admin and operating sections of the RURAL Finance page, highlight the 
- [ ] RUral Weekday -- add a heavier divider line between 'Brokered Medicaid Contract' and 'Total Trips for All Modes'
- [ ] Add separation between very bottom rows - Total Revenue, Total Expenses in the RURAL Finance page
