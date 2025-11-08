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
