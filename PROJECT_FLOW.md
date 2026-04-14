# Project Flow

## What This App Does

This app helps create, save, print, and follow a weekly study plan.

It can be used in 3 different ways:

- Guest use: anyone can prepare and print a plan without signing in.
- Teacher use: teachers can create student accounts, prepare plans, save them, reopen them, and track progress.
- Student use: students can sign in with the username given by their teacher, open saved plans, and print them.

## Main Features

- Create a weekly study plan for a selected date range.
- Add school, teacher, and student information to the plan.
- Adjust the plan based on school level, class, exam type, and study area.
- Build a day-by-day schedule with time, lesson, topic, and study method.
- Add or remove study rows for any day.
- Add question counts for question-solving sessions.
- Write weekly notes, reminders, or goals.
- See an automatic weekly lesson summary.
- Create a question tracking sheet automatically when question-solving is used.
- Print the program or save it as PDF.
- Keep working on the same device without losing the current draft.
- Save student programs and reopen them later.
- Review progress by lesson and topic.
- Mark topics as completed in the analysis area.
- Delete saved programs when they are no longer needed.
- Create and permanently remove student accounts as a teacher.

## Main Screens

### 1. Login Screen

This is now the first screen of the app.

What the user can do here:

- Choose `Teacher` or `Student`
- Sign in with the correct credentials for that role
- Switch teachers between sign in and sign up
- Continue as guest with a small text-only action

If the user enters as guest or signs in successfully, the app continues into the planning flow.

### 2. Start Screen

This is where the user prepares the plan before building the weekly schedule.

Information entered here:

- School name
- Teacher name
- Student name
- Education level
- Class or exam type, depending on the student
- Study area when needed
- Whether a question tracking sheet should be included
- The date range for the study plan

What the user can do here:

- Open a calendar and choose the start and end dates.
- Move to the next step after the required information is complete.
- If signed in as a teacher, choose one of their registered students.
- If signed in as a teacher, open the selected student's older programs.
- If signed in as a teacher, go directly to the student's analysis.
- If signed in as a teacher, permanently delete the selected student.

### 3. Program Editing Screen

This is the main planning area.

What the user can do here:

- See the selected school, teacher, student, and date range at the top.
- Fill each day with study times, lessons, topics, and study methods.
- Add more rows to a day.
- Remove extra rows from a day.
- Write notes for the week.
- See a live summary showing how many study hours are planned for each lesson.
- See the question tracking sheet if that option was turned on.

Helpful automatic behavior:

- When the first time of a day is set, the later time slots for that day can fill in automatically.
- When the first day's time pattern is set, the rest of the week can follow the same pattern.
- Topic choices change based on the selected lesson.
- If the study method is question solving, the app asks for the target number of questions.

Actions on this screen:

- Go back to the start screen, unless the user is in student mode.
- Save the program, if the user is a teacher.
- Open the analysis screen, if the user is a teacher.
- Move to the print or PDF view.

### 4. Print / PDF Screen

This screen shows a clean version of the full plan.

What appears here:

- The main program information
- A printable table for each day
- The weekly lesson summary
- The question tracking sheet, when included

Actions on this screen:

- Go back and edit the plan
- Save the plan, if the user is a teacher
- Print the page
- Save it as PDF using the browser's print options
- Start a brand new plan

### 5. Analysis Screen

This screen is for teachers.

What it shows:

- The selected student's overall progress
- Progress for each lesson
- Topic-by-topic progress inside each lesson
- Total solved question count
- The last study date for each topic
- Visual progress bars
- The number of saved programs included in the analysis
- A filter to view one lesson or all lessons

What the teacher can do here:

- Review which topics have been worked on.
- See which study methods were used for each topic.
- Mark topics as completed manually.
- Save the analysis.
- Print the analysis or save it as PDF.
- Return to the previous screen.

## Question Tracking Sheet

This is an optional feature.

If it is turned on, the app creates the sheet automatically from the question-solving tasks in the plan.

The sheet gives space to follow:

- Target question count
- Solved question count
- Correct answers
- Wrong answers
- Blank answers
- Notes

## Account and Access Features

### Account Popup

This popup lets people:

- Sign in as a teacher
- Sign in as a student
- Create a teacher account
- Close the popup without signing in

Important account rules:

- Teachers sign in with email and password.
- Students sign in with the username and password given by the teacher.
- Students do not create their own accounts in the app.
- Teachers create student accounts for them.

### Calendar Popup

This popup lets the user:

- Choose a start date and end date
- Move between months
- Apply the selected date range to the plan

## Teacher Features

When a teacher is signed in, the app can:

- Show the teacher's name in the plan automatically.
- Show all linked students.
- Let the teacher create a new student account.
- Show the username created for each student.
- Let the teacher choose a student and prepare plans specifically for that student.
- Save a plan to that student's account.
- Open a saved plan.
- Edit a saved plan and update it.
- Delete a saved plan.
- Open the student's analysis.
- Permanently delete a student and that student's related records.

## Student Features

When a student is signed in, the app can:

- Show which teacher the account is linked to.
- Show the student's username.
- Show saved programs.
- Open saved programs.
- Delete saved programs.
- Print or review programs.

Limits in student mode:

- Students do not use the teacher analysis screen.
- Students do not manage other students.
- Students do not save edited programs as teacher-managed records.

## Guest Features

Without signing in, a person can:

- Start using the app immediately.
- Build a weekly study plan.
- Print the plan or save it as PDF.
- Keep working on the same device without losing the current draft.

Limits in guest mode:

- The plan is only kept on that device.
- There is no student management.
- There is no teacher analysis area.

## Saved Program Features

Saved programs can include:

- Student and teacher information
- Date range
- Day-by-day study schedule
- Notes
- Question tracking sheet settings

Saved programs can be:

- Reopened later
- Edited by teachers
- Opened by students
- Deleted when no longer needed

When a saved program is deleted, the related progress view is updated as well.

## Smart Convenience Features

- The app remembers unfinished work on the same device.
- The schedule is built around the selected date range.
- Subject and topic choices adjust to the student's level and exam path.
- Weekly lesson totals are calculated automatically.
- Question tracking rows are created automatically from question-solving tasks.
- Student accounts created by teachers are ready to use with a username and password.
- When a student signs in and already has saved programs, one of those programs can open automatically.

## Typical User Journeys

### Guest Journey

1. Open the app.
2. Continue without signing in from the login screen.
3. Fill in the student and plan details.
4. Choose the dates.
5. Build the weekly plan.
6. Print it or save it as PDF.

### Teacher Journey

1. Create a teacher account or sign in from the login screen.
2. Create a student account if needed.
3. Select a student.
4. Fill in the plan details.
5. Build and save the weekly program.
6. Reopen older programs when needed.
7. Check the student's analysis and save progress changes.
8. Print either the program or the analysis.

### Student Journey

1. Sign in from the login screen with the username and password given by the teacher.
2. Open a saved program.
3. Review the weekly plan.
4. Print it or save it as PDF.
5. Delete old saved programs if needed.

## Short Summary

This app is a study planning and follow-up tool. It helps teachers prepare and manage student study programs, helps students view their saved plans, and lets anyone create a printable weekly study schedule even without signing in.
