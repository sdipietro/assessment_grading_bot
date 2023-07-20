1. Ensure you have Node v 16
2. cd Desktop
3. git clone https://github.com/sdipietro/assessment_grading_bot.git
4. cd assessment_grading_bot
5. npm install
6. brew install unzip wget
7. Add PT credentials
  - add a 'credentials.js' in the root directory

  ```js
  module.exports = {
  aAemail: "youraaemail@appacademy.io",
  aApassword: "ptpassword",
  googleSheetsId: "1HAAH8i8EhAcNk1-7MITyq6hhkZU12MCiiELS2eH2Syg" }
js```

8. Add google credentials
  - ask Steve D for this 
9. Ensure names of students on Google Sheet are most recent ones on Progress Tracker
10. To run: 
 - monitor mode: `./gradingScript.sh -m`
 - grade earlier assessments: `./gradingScript.sh "Ruby 1"`
 - grade specific assessments: `./gradingScript.sh "Ruby 1" "First Last"`