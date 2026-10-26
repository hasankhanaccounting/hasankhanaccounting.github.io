# Private contact form backend

This Google Apps Script sends website messages to the recipient stored in the script's private Script Properties. The recipient address is not included in the public site or this repository.

The script sends email only. It does not read or store your Gmail inbox or save submitted messages in a spreadsheet.

## Set it up

1. Sign in to the Google account that should receive the messages, then create a project at [script.google.com](https://script.google.com).
2. Replace the starter code in `Code.gs` with the contents of this folder's `Code.gs`, then save.
3. Open **Project Settings** and add a Script Property:
   - **Property:** `CONTACT_RECIPIENT`
   - **Value:** the Gmail address you gave me
4. Choose **Deploy → New deployment**. Select **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy** and approve the Google permission to send email.
6. Copy the Web app URL ending in `/exec` and send that URL here. I can then connect the website's contact form to it.

Keep the recipient value in Script Properties; do not add it to `index.html`, a public file, or a GitHub issue/comment. The deployment URL is public so website visitors can submit the form; the script includes a hidden-field spam trap and message-rate limits.

## Website form fields

The site form will post these fields to the deployment URL:

- `name`
- `email`
- `message`
- `website` — hidden honeypot; visitors leave it blank
- `startedAt` — hidden timestamp set when the page loads

The script uses the visitor's email as the reply-to address, so you can reply to the inquiry from Gmail.
