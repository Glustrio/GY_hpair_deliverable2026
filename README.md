# HPAIR Deliverable: Personal Information Form

A four-step application form with per-step validation, a conditional question, a PDF CV
upload, autosave, and a review screen before submitting.

Built on the starter's React 18 + Formik + Yup + Firebase stack.

## Running it

```bash
npm install
npm start     # http://localhost:3000
npm test      # renders each step and checks the label and ARIA wiring
npm run build # must pass with CI=true, which is what Vercel sets
```

To point it at your own Firebase project, replace the config block in
`src/firebase/config.js` and publish `firestore.rules` in the console.

## What it does

**Validation.** Errors appear when you press Continue, then clear live as you fix them.
You cannot reach the next step, or submit, until the current step is valid.

**Fields.** Name, date of birth, country of citizenship, home address, phone, preferred
language, CV, and LinkedIn. The LinkedIn URL is only asked if you say you have one. The CV
is a PDF up to 800 KB.

**Submission.** A confirmation screen with a reference number, the full summary on screen,
and a downloadable copy. Failures keep your answers and say what went wrong.

**Autosave.** Progress saves to your account about a second after you stop typing, and is
offered back on your next visit. It clears only once a submission is confirmed.

## Decisions worth explaining

**Validation fires on Continue, not on blur.** The brief asks for real-time validation, and
the research on when to fire it is not on the side of the obvious reading. Bargas-Avila et
al. (2007, n=90) found validating when a user leaves a field produced roughly double the
repeat errors of validating on submit, and GOV.UK's pattern says plainly not to validate on
blur. So errors surface when you try to leave a step, and from then on that field
re-validates on every keystroke so the message disappears the moment it is fixed. Formik's
`validateOnBlur` default is what makes errors appear on blur, so `FormField` deliberately
does not pass Formik's `onBlur` handler through to the input.

**The Continue button is never disabled.** A greyed-out button explains nothing, drops out
of the tab order, and leaves a keyboard user with no way to find out what is wrong. Pressing
it runs validation, reveals every error on the step, and moves focus to the first one.
Submission is still genuinely blocked until the form is valid.

**The address is one textarea, not six fields.** `street-address` is a Multiline-group
autocomplete token in the HTML specification, so it is only valid on a `<textarea>`. Split
address fields also assume you know which countries the addresses come from, and HPAIR's
applicants are international.

**Date of birth is three text boxes.** A date picker is a tool for finding a date you do not
know. `<input type="date">` also orders its fields by the operating system's locale, so a US
and a UK laptop show different field orders on the same page and the page cannot override
it. The month box accepts names as well as numbers.

**Country of citizenship stores an ISO code, not a name.** Countries rename themselves, and
the code survives it. The list is generated from ISO 3166-1 alpha-2 with display names from
Unicode CLDR. It deliberately carries no `autocomplete` attribute, because `country` is
defined in the spec as part of an address, so a browser would fill in where someone lives
rather than where they are a citizen.

**The gender question is optional and comes after the review step.** Nothing in processing
an application uses it, so it should not sit in the middle of the form where it reads as a
gate.

**The CV is stored in the database, not in file storage.** Firebase Cloud Storage began
requiring a billing account in February 2026, and this is a student project, so the PDF goes
into Firestore as a bytes field instead. Firestore stores bytes at their real size, so there
is no base64 inflation, and a document is capped at 1 MiB, which sets the 800 KB limit on the
file. The PDF lives in its own `cvFiles` collection rather than inside the submission,
because the submissions list would otherwise download every applicant's CV to render a list
of reference numbers. All of the upload code is in `src/services/cvService.js`, so moving to
Cloud Storage later is a change to one file.

**The security rules do authorization, not validation.** `firestore.rules` checks who you
are, that the document you are writing claims your own uid, that the timestamp came from the
server, and that the CV document id starts with your own uid. It does not re-check field formats,
because that would duplicate Yup in a language with no tests and no message the user ever
sees, where the only failure mode is silently rejecting a valid application.

**Drafts live in the database, not the browser.** The form holds a date of birth, a home
address and a phone number. Browser storage has no expiry and is not cleared on sign out, so
on a shared machine it leaves one applicant's details for the next person.

## Changes to the starter

- `CI=true npm run build` failed on three ESLint warnings. Vercel sets `CI=1`, so the starter
  could not deploy as shipped. One of the three was a real stale-closure bug in a `useEffect`.
- `node_modules` was committed, which corrupted the `.bin` symlinks so a fresh clone could
  not build. Added a `.gitignore` and untracked it.
- `getFormSubmissions` fetched every submission and filtered by user in the browser, so any
  signed-in applicant could read everyone else's data. It is now scoped with `where()`, and
  the Firestore rules enforce the same thing server side.
- `getSubmissionCount` downloaded the whole collection to read `.size`. Removed, along with
  the "total submissions" line that showed applicants how many other people had applied.
- `AdminPanel.js` was never imported or routed, and rendered every user's data. Deleted.
- Removed `react-router-dom`, `styled-components`, `axios` and `react-icons`, which were
  installed and unused.

## Not built, and why

**Emailing the submission.** It needs somewhere server-side to hold mail credentials, which
means a Cloud Function. Sending mail from the browser would ship an API key to every visitor.

**A route per wizard step.** The browser Back button currently leaves the form rather than
stepping back. Autosave means nothing is lost, but one route per step is the better answer
and was left out for scope.

**Cleaning up orphaned CVs.** The CV is saved when you drop it, so an abandoned draft leaves a
`cvFiles` document behind. Removing it needs a scheduled Cloud Function.

**Files larger than 800 KB.** That is the ceiling a Firestore document allows. A text-based
CV is usually well under 500 KB, and the error message says what to do if it is not.

---

# Original brief


Build a **personal information form application** with the following features:

---

## Recommended Features

1. **Form Validation**
   - Real-time validation  
   - Clear error messages for invalid fields  
   - Prevent submission until all data is valid  

2. **Form Fields**  
   Include (at minimum):  
   - Address  
   - CV (file upload)  
   - Phone number  
   - Nationality  
   - LinkedIn URL  
   - Preferred language  
   - *(Feel free to propose and add more fields that improve usefulness or user experience.)*  


3. **Form Submission**
   - Handle form data submission  
   - Display success and error states  
   - Show a clear confirmation message after submission  

4. **Responsive Design**
   - Mobile-friendly layout  
   - Clean, accessible, and user-friendly styling  

---

## Bonus / Creative Features

1. **User Experience Enhancements**
   - Loading states  
   - Inline success/error notifications  
   - Auto-save of progress  
   - Smooth keyboard navigation  

2. **Extended Functionality**
   - Email the response to a provided email  
   - Provide a downloadable summary of the submission  
   - Implement **conditional questions** (e.g., only ask for a LinkedIn URL if the user indicates they have one)  
   - Any additional feature you believe would improve usability or make the form stand out  

 *We would love to see something beyond just the basics—demonstrate creativity by proposing and implementing at least one additional feature or unique UI/UX improvement.*  

---

## Getting Started
0. Fork this repository to your personal github account

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm start
   ```

---

## Submission

Please create an account at [Vercel](https://vercel.com/) and then link your repo. It should automatically pull and build your main branch. Be sure to check that you are not getting any errors before submitting. You will need to submit both the vercel link to your deployment and the link to your GitHub repository.

## Issues or Assistance

If you run into any issues cloning the repo or breaking bugs that seem outside of your ability to fix, please reach out to Christopher Qiu and Ashley Zheng at cqiu@college.harvard.edu and ashleyzheng@college.harvard.edu. Good luck, we look forward to your submissions!

## AI Policy

You're allowed to use AI to complete this deliverable. In the same time, all code you submit is a fair game for the interview - including design decisions, features implementation and trade-offs
