const credentials = require("./credentials.js");
const puppeteer = require('puppeteer');
const { exec } = require("child_process");
const { google } = require("googleapis");
const path = require('path');

// const progressTrackerScoresUrl = 'https://progress.appacademy.io/cycles/305/scores';
const progressTrackerScoresUrl = 'https://progress.appacademy.io/scores';
const progressTrackerEmail = credentials.aAemail;
const progressTrackerPassword = credentials.aApassword;

async function loginPT(page) {
    console.log('Visiting Progress Tracker...');
    await page.goto(progressTrackerScoresUrl);
    console.log('Logging into Progress Tracker...');
    await page.type('[id=instructor_email]', progressTrackerEmail);
    await page.type('[id=instructor_password]', progressTrackerPassword);
    await page.keyboard.press('Enter',{delay:10000});
    return page;
}

async function getScores(page) {
    const studentList = await page.evaluate(() => {
        // let assessmentName = document.getElementsByTagName('thead')[0].getElementsByTagName('th')[6].innerText;
        let assessmentName = document.getElementsByTagName('thead')[0].getElementsByClassName('a-title open-top open-left')[0].innerText;
        let scoresObj = {[assessmentName]: {}};
        let studentRows = Array.from(document.getElementsByTagName('tbody')[0].getElementsByTagName('tr'));
        studentRows.forEach((ele) => {
            let name = ele.getElementsByTagName('td')[1].getElementsByTagName('a')[0].innerText;
            // let submissionsArr = ele.getElementsByTagName('td')[7].getElementsByTagName('a');
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
                // submissionLink = ele.getElementsByTagName('td')[7].getElementsByTagName('a')[0];
            }
            
            if (submissionLink) {
                scoresObj[assessmentName][name] = submissionLink.href;
            }
        });
        
        return scoresObj;
    });
    
    return studentList;
}

async function gradeAssessments(assessmentLinksObj) {
    let assessName = Object.keys(assessmentLinksObj)[0];
    let scores = {[assessName]: {}};
    let links = (assessmentLinksObj[assessName]);
    let gradingScript = '';
    console.log(assessName);

    switch (assessName) {
        case 'FA1P':
        case 'FA1':
        case 'FA2':
        case 'Ruby 1 Prep':
        case 'Ruby 1':
        case 'Ruby 2':
        case 'Ruby 2R':
        case 'Rails 2':
        case 'Rails 2R':
            gradingScript = 'rubyGradingScript.sh';
            break;
        case 'Rails 1':
        case 'Rails 1R':
            gradingScript = 'railsGradingScript.sh';
            break;
        case 'Rails Olympics':
            gradingScript = 'railsOlympicsGradingScript.sh'
            break;
        case 'Javascript 1':
        case 'Javascript 1R':
            gradingScript = 'javascriptGradingScript.sh';
            break;
        case 'React 1':
        case 'React 1R':
            gradingScript = 'reactGradingScript.sh';
            break;
        default:
            console.log('Error: Wrong Assessment Name. Cannot find script');
    }

    for (let name in links) {
        let link = links[name].split('?');
        link.pop();
        let newLink = link.join('');
        let newName = name.split(' ').join('');
        let command = `chmod +x ~/Desktop/assessment_grading_bot/gradingScripts/${gradingScript} && ~/Desktop/assessment_grading_bot/gradingScripts/${gradingScript} "${newLink}" "${newName}"`;
        const result = await new Promise((resolve, reject) => {
            exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                }
                // if (stderr) {
                //     console.log(`stderr: ${stderr}`);
                // }
                resolve(stdout);
            });
        });

        // Rails 1 is super annoying to grade:
        if (assessName == 'Rails 1' || assessName == 'Rails 1R') {
            let sqlSpecs;
            let activeRecordSpecs;
            let migrationsSpecs;
            let associationsSpecs;
            let sqlExamples;
            let sqlFailures;
            let activeRecordExamples;
            let activeRecordFailures;
            let migrationsExamples;
            let migrationsFailures;
            let associationsExamples;
            let associationsFailures;
            let sqlGrade = 0;
            let activeRecordGrade = 0;
            let migrationsGrade = 0;
            let associationsGrade = 0;
            if (result.includes('SQL : ') && result.includes('Active Record : ') && result.includes('Migrations : ') && result.includes('Associations : ')) {
                sqlSpecs = result.split('SQL : ')[1].split('Active')[0];
                if (sqlSpecs.includes('failure')) {
                    sqlExamples = parseInt(sqlSpecs.split(' examples,')[0]);
                    sqlFailures = parseInt(sqlSpecs.split(', ')[1].split(' ')[0]);
                    sqlGrade = sqlExamples - sqlFailures;
                } else {
                    sqlGrade = 0;
                }
                activeRecordSpecs = result.split('Active Record : ')[1].split('Migrations')[0];
                if (activeRecordSpecs.includes('failure')) {
                    activeRecordExamples = parseInt(activeRecordSpecs.split(' examples,')[0]);
                    activeRecordFailures = parseInt(activeRecordSpecs.split(', ')[1].split(' ')[0]);
                    activeRecordGrade = activeRecordExamples - activeRecordFailures;
                } else {
                    activeRecordGrade = 0;
                }
                migrationsSpecs = result.split('Migrations : ')[1].split('Associations')[0];
                if (migrationsSpecs.includes('failure')) {
                    migrationsExamples = parseInt(migrationsSpecs.split(' examples,')[0]);
                    migrationsFailures = parseInt(migrationsSpecs.split(', ')[1].split(' ')[0]);
                    migrationsGrade = migrationsExamples - migrationsFailures;
                } else {
                    migrationsGrade = 0;
                }
                associationsSpecs = result.split('Associations : ')[1];
                if (associationsSpecs.includes('failure')) {
                    associationsExamples = parseInt(associationsSpecs.split(' examples,')[0]);
                    associationsFailures = parseInt(associationsSpecs.split(', ')[1].split(' ')[0]);
                    associationsGrade = associationsExamples - associationsFailures;
                } else {
                    associationsGrade = 0;
                }
                scores[assessName][name] = [sqlGrade, activeRecordGrade, migrationsGrade, associationsGrade];
            } else {
                scores[assessName][name] = 0;
            }
        } else {
            //All the other assessments are way easier:
            let specs;
            let examples;
            let failures;
            let grade;
            if (result.includes(' : ') && result.includes('failure')) {
                specs = result.split(' : ')[1];
                examples = parseInt(specs.split(' examples,')[0]);
                failures = parseInt(specs.split(', ')[1].split(' ')[0]);
                grade = examples - failures;
                scores[assessName][name] = [grade];
            } else {
                scores[assessName][name] = 0;
            }
        }

        console.log(`${result}`);
    }
    return scores;
}

async function inputScoresGoogle(scoresData) {
    console.log('Inputting scores in google sheets...')
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "google_creds.json"),
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = "1sKwWeKPq8LP8qYiU6-T1dMyHUkI-YovyLz40SV-c6eU";
    let assessName = Object.keys(scoresData)[0];
    let startingCol;

    switch (true) {
        case assessName == 'FA1P':
            startingCol = 'E';
            break;
        case assessName == 'FA1':
            startingCol = 'F';
            break;
        case assessName == 'FA2':
            startingCol = 'G';
            break;
        case assessName == 'Ruby 1 Prep':
            startingCol = 'H';
            break;
        case assessName == 'Ruby 1':
            startingCol = 'I';
            break;
        case assessName == 'Ruby 2':
            startingCol = 'M';
            break;
        case assessName == 'Ruby 2R':
            startingCol = 'Q';
            break;
        case assessName == 'Rails 1':
            startingCol = 'S';
            break;
        case assessName == 'Rails 1R':
            startingCol = 'X';
            break;
        case assessName == 'Rails Olympics':
            startingCol = 'AE';
            break;
        case assessName == 'Rails 2':
            startingCol = 'AF';
            break;
        case assessName == 'Rails 2R':
            startingCol = 'AG';
            break;
        case assessName == 'Javascript 1':
            startingCol = 'AH';
            break;
        case assessName == 'Javascript 1R':
            startingCol = 'AI';
            break;
        case assessName == 'React 1':
            startingCol = 'AJ';
            break;
        case assessName == 'React 1R':
            startingCol = 'AK';
            break;
        default:
            console.log('Error: Wrong Assessment Name.');
    }

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Sheet 1!A2:A52',
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
        formattedScoreData.push((scoresData[assessName][name] || ['']));
    }
    

    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `Sheet 1!${startingCol}2:$AZ50`,
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
    console.log(scores);
    await inputScoresGoogle(scores);
}

updateScores();

