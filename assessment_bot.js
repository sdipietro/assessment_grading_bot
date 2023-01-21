const credentials = require("./credentials.js");
const puppeteer = require('puppeteer');
const { exec } = require("child_process");
const { google } = require("googleapis");

const progressTrackerScoresUrl = credentials.scoresUrl;

async function loginPT(page) {
    console.log('Visiting Progress Tracker...');
    await page.goto(progressTrackerScoresUrl);
    console.log('Logging into Progress Tracker...');
    await page.type('[id=instructor_email]', credentials.aAemail);
    await page.type('[id=instructor_password]', credentials.aApassword);
    await page.keyboard.press('Enter',{delay:5000});
    return page;
}

async function getScores(page) {
    const studentList = await page.evaluate(() => { 
        let scoresObj = {};
        let studentRows = Array.from(document.getElementsByTagName('tbody')[0].getElementsByTagName('tr'));
        studentRows.forEach((ele) => {
            let name = ele.getElementsByTagName('td')[1].getElementsByTagName('a')[0].innerText;
            let submissionsArr = ele.getElementsByTagName('td')[3].getElementsByTagName('a');
            let submissionLink = '';
            if (submissionsArr && submissionsArr.length > 1) {
                let longestTime = 0;
                
                Array.from(submissionsArr).forEach(a => {
                    let time = parseInt(a.innerText.split('(')[1].split(' ')[0]);
                    if (time >= longestTime) {
                        longestTime = time;
                        submissionLink = a;
                    }
                });
            } else {
                submissionLink = ele.getElementsByTagName('td')[3].getElementsByTagName('a')[0];
            }
            
            if (submissionLink) {
                scoresObj[name] = submissionLink.href;
            }
        });
        
        return scoresObj;
    });
    
    return studentList;
}

async function gradeAssessments(assessmentLinksObj) {
    let scores = {};
    let links = Object.values(assessmentLinksObj);

    for (let name in assessmentLinksObj) {
        let link = assessmentLinksObj[name].split('?');
        link.pop();
        let newLink = link.join('');
        let newName = name.split(' ').join('');
        let command = `/Users/steve/Desktop/hw_tracking_bot/downloadAssessmentScript.sh "${newLink}" "${newName}"`;
        const result = await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                }
                // if (stderr) {
                //     console.log(`stderr: ${stderr}`);
                // }
                resolve(stdout);
            });
        });

        let specs = result.split(' : ')[1];
        let examples;
        let failures;
        let grade;
        if (specs.includes('failures')) {
            examples = parseInt(specs.split(' examples,')[0]);
            failures = parseInt(specs.split(', ')[1].split(' ')[0]);
            grade = examples - failures;
            scores[name] = grade;
        } else {
            scores[name] = 0;
        }
        console.log(`${result}`);
    }
    return scores;
}

async function inputScoresGoogle(scoresData) {
    console.log('Inputting scores in google sheets...')
    const auth = new google.auth.GoogleAuth({
        keyFile: "/Users/steve/Desktop/hw_tracking_bot/google_creds.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = "1sKwWeKPq8LP8qYiU6-T1dMyHUkI-YovyLz40SV-c6eU";
    let assessName = 'Fo1';
    let startingCol;

    switch (true) {
        case assessName == 'Fo1':
            startingCol = 'F';
            break;
        case assessName == 'Fo2':
            startingCol = 'G';
            break;
        default:
            console.log('Error: Wrong Assessment Name.');
    }

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Sheet 1!A2:A41',
    });
    const studentArr = getRows.data.values;
    const gooogleSheetStudentsIndexes = {};
  
    for (let i = 0; i < studentArr.length; i++) {
        gooogleSheetStudentsIndexes[studentArr[i][0]] = i;
    }

    let formattedScoreData = [];
    for (const student in gooogleSheetStudentsIndexes) {
        let name = student;
        if (student.includes(' (')) {
            let first = student.split('(')[1].split(')')[0];
            let last = student.split(') ')[1];
            name = first + ' ' + last;
        }
        formattedScoreData.push([(scoresData[name] || '')]);
    }
    

    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `Sheet 1!${startingCol}2:${startingCol}50`,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: formattedScoreData
        },
    });
}

async function updateScores(){
    console.log('Opening Virtual Browser...');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const loggedInPT = await loginPT(page);
    console.log('Getting Scores...');
    const scoresData = await getScores(loggedInPT);
    await page.close();
    await browser.close();
    console.log('Grading Assessments...');
    console.log('');
    const scores = await gradeAssessments(scoresData);
    // console.log(scores);
    // await inputScoresGoogle(scores);
}

updateScores();

