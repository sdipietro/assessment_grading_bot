Mac Setup Instructions:

1. Ensure you have Node v 16 or greater
2. cd Desktop *Must be cloned into Desktop
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
 - monitor mode: `npm run monitor + "(name of assesment *must be exact name from Sis)"`
  - Ex: `npm run monitor "Ruby 1 Assessment Version A"`

 Not yet implemented:
 - grade without monitor: `npm run grade "Ruby 1"`
 - grade specific student: `npm run grade "Ruby 1" "First Last"`