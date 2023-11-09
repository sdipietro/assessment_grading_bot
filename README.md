1. Ensure you have Node v 16
2. cd Desktop
3. git clone https://github.com/sdipietro/assessment_grading_bot.git
4. cd assessment_grading_bot
5. npm install
6. brew install unzip wget
7. Add Google credentials and google scoresheet ID
  - add a 'credentials.js' in the root directory

```js
  module.exports = {
  googleEmail: "your_google_email_for_sis@gmail.com",
  googlePassword: "your_google_password_for_sis",
  googleSheetsId: "1HAAH8i8EhAck1-7MITyq6hhkU12MCiiELS2eH2Syg" 
  }
```

8. Add google script credentials
  - ask Steve D for this 
9. Ensure names of students on Google Sheet are most recent ones on Sis
10. To run: 
 - monitor mode: `./gradingScript.sh -m`

 Not yet implemented:
 - grade earlier assessments: `./gradingScript.sh "Ruby 1"`
 - grade specific assessments: `./gradingScript.sh "Ruby 1" "First Last"`