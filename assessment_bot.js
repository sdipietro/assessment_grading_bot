const credentials = require("./credentials.js");
const puppeteer = require('puppeteer');
const { exec } = require("child_process");
const { google } = require("googleapis");
const path = require('path');
const process = require('process');
const prompt = require("prompt-sync")({ sigint: true });

// Setup Instructions:
// 1. Set progressTrackerEmail and progressTrackerPassword to your login credentials
// as an instructor. Input as strings
const progressTrackerEmail = credentials.aAemail;
const progressTrackerPassword = credentials.aApassword;

// 2. Set googleSheetsScoreSheetId to the google sheets id for your cohort's scores sheet 
// The id is the part between docs.google.com/spreadsheets/d/ and /edit
// Input as a string.
const googleSheetsScoreSheetId = credentials.googleSheetsId;

// 3. Create a file in this directroy called google_creds.json
// Ask Steve D for the google credentials to access inputting to google sheets

// You can also change the cohort that you are grading.
// This is optional. If you do not, the script will default to the cohort that you are assigned
// to as an instructor
// To change:
// Comment in the line below and change the cohort number from 310 to the cohort that you want to grade
// const progressTrackerScoresUrl = 'https://progress.appacademy.io/cycles/310/scores';
// Then, comment out this line:
const progressTrackerScoresUrl = 'https://progress.appacademy.io/scores';

async function loginPT(page) {
    console.log('Visiting Progress Tracker...');
    await page.goto(progressTrackerScoresUrl);
    console.log('Logging into Progress Tracker...');
    await page.type('[id=instructor_email]', progressTrackerEmail);
    await page.type('[id=instructor_password]', progressTrackerPassword);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
    });
    return page;
}

async function getScores(page, assessment) {
    await page.waitForSelector('thead', {
        visible: true,
    });
    const studentList = await page.evaluate((assessment) => {
        let assessmentColumn;
        let found = false;
        if (assessment) {
            let tableHeaders = Array.from(document.getElementsByTagName('thead')[0].getElementsByTagName('th'));
            for (let i = 0; i < tableHeaders.length; i++) {
                if (tableHeaders[i].innerText.toLowerCase() === assessment.toLowerCase()) {
                    found = true;
                    assessmentColumn = i;
                }
            }
            if (found === false) {
                throw (`Incorrect Assesment Name ${assessment}`);
            }
        } else {
            assessmentColumn = 2;
        }
        let assessmentName = document.getElementsByTagName('thead')[0].getElementsByTagName('th')[assessmentColumn].innerText;
        // let assessmentName = document.getElementsByTagName('thead')[0].getElementsByClassName('a-title open-top open-left')[0].innerText;
        let scoresObj = {[assessmentName]: {}};
        let studentRows = Array.from(document.getElementsByTagName('tbody')[0].getElementsByTagName('tr'));
        studentRows.forEach((ele) => {
            let name = ele.getElementsByTagName('td')[1].getElementsByTagName('a')[0].innerText;
            let submissionsArr = ele.getElementsByTagName('td')[assessmentColumn + 1].getElementsByTagName('a');
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
                submissionLink = ele.getElementsByTagName('td')[assessmentColumn + 1].getElementsByTagName('a')[0];
            }
            
            if (submissionLink) {
                scoresObj[assessmentName][name] = submissionLink.href;
            }
        });
      
        return scoresObj;
    }, assessment);

    return studentList;
}

async function gradeAssessments(assessmentLinksObj, name) {
    let assessName = Object.keys(assessmentLinksObj)[0];
    let links = (assessmentLinksObj[assessName]);
    if (name) {
        let nameLowercase = name.toLowerCase();
        let submission = links[Object.keys(links).find(key => key.toLowerCase() === nameLowercase)];
        if (submission) {
            assessmentLinksObj = {[assessName]: {[name]: submission}};
            links = (assessmentLinksObj[assessName]);
        } else {
            throw (`No submissions for ${name}. Check spelling.`);
        }
    }
    let scores = {[assessName]: {}};
    let gradingScript = '';
    let timeoutLimit;
    if (assessName === 'Rails 1' || assessName === 'Rails 1R') {
        console.log(`${assessName}. Please wait, I take a long time to grade.`);
        console.log('');
    } else {
        console.log(assessName);
        console.log('');
    }

    switch (assessName) {
        case 'FA1P':
        case 'FA1':
        case 'FA2':
        case 'Ruby 1 Prep':
        case 'Ruby 1':
        case 'Ruby 2':
        case 'Ruby 2R':
            gradingScript = 'rubyGradingScript.sh';
            timeoutLimit = 35000;
            break;
        case 'Rails 1':
        case 'Rails 1R':
            gradingScript = 'rails1GradingScript.sh';
            timeoutLimit = 150000;
            break;
        case 'Rails Olympics':
            gradingScript = 'railsOlympicsGradingScript.sh';
            timeoutLimit = 60000;
            break;
        case 'Rails 2':
        case 'Rails 2R':
            gradingScript = 'rails2GradingScript.sh';
            timeoutLimit = 75000;
            break;
        case 'JavaScript 1':
        case 'JavaScript 1R':
            gradingScript = 'javascriptGradingScript.sh';
            timeoutLimit = 30000;
            break;
        case 'React 1':
        case 'React 1R':
            gradingScript = 'reactGradingScript.sh';
            timeoutLimit = 60000;
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
            exec(command, { timeout: timeoutLimit }, (error, stdout, stderr) => {
                if (error) {
                    console.log(`${newName} : Unable To Run Specs`)
                    // console.log(`error: ${error.message}`);
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
        } else if (assessName == 'JavaScript 1' || assessName == 'JavaScript 1R') {
            //Jasmine Specs
            let specs;
            let examples;
            let failures;
            let grade;
            if (result.includes(' : ') && result.includes('spec')) {
                specs = result.split(' : ')[1];
                examples = parseInt(specs.split(' examples,')[0]);
                failures = parseInt(specs.split(', ')[1].split(' ')[0]);
                grade = examples - failures;
                scores[assessName][name] = [grade];
            } else {
                scores[assessName][name] = 0;
            }
        } else if (assessName == 'React 1' || assessName == 'React 1R') {
            //Jest Specs
            let specs;
            let passed;
            let grade;
            if (result.includes(' : ') && result.includes('total')) {
                specs = result.split(' : ')[1];
                passed = parseInt(specs.split(' passed,')[0].slice(-2));
                grade = passed;
                scores[assessName][name] = [grade];
            } else {
                scores[assessName][name] = 0;
            }
        } else {
            //All the other assessments are much easier to grade:
            let specs;
            let examples;
            let failures;
            let grade;
            if (result.includes(' : ') && result.includes('failure')) {
                specs = result.split(' : ')[1];
                examples = parseInt(specs.split(' specs,')[0]);
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

// shoutout stackoverflow for this:
function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

async function inputScoresGoogle(scoresData) {
    console.log('Inputting scores in google sheets...');
    console.log('');
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "google_creds.json"),
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = googleSheetsScoreSheetId;
    let assessName = Object.keys(scoresData)[0];
        
    const assessmentMap = { 
        'FA1P': 'Fo1p',
        'FA1': 'Fo1',
        'FA2': 'Fo2',
        'Ruby 1 Prep': 'Ru1p',
        'Ruby 1': 'Ru1',
        'Ruby 2': 'Ru2',
        'Ruby 2R': 'Ru2r',
        'Rails 1': 'Ra1',
        'Rails 1': 'Ra1r',
        'Rails Olympics': 'RaO',
        'Rails 2': 'Ra2',
        'Rails 2R': 'Ra2r',
        'JavaScript 1': 'JS1',
        'JavaScript 1R': 'JS1r',
        'React 1': 'Re1',
        'React 1R': 'Re1r'
    }
    let googleSheetsAssessName = assessmentMap[assessName];

    const getColumnHeaders = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Sheet 1!1:1',
    });
    const colHeaders = getColumnHeaders.data.values[0];

    let startingCol;
    if (assessName === 'Ruby 2' || assessName === 'Ruby 2R') {
        startingCol = colHeaders.indexOf(googleSheetsAssessName) + 3;
    } else if (assessName === 'Rails 1' || assessName === 'Rails 1R') {
        startingCol = colHeaders.indexOf(googleSheetsAssessName) + 1;
    } else if (assessName === 'Rails Olympics') {
        startingCol = colHeaders.indexOf(googleSheetsAssessName) + 2;
    } else {
        startingCol = colHeaders.indexOf(googleSheetsAssessName);
    }
    
    const colLetter = columnToLetter(startingCol + 1);

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
        formattedScoreData.push((scoresData[assessName][name] || []));
    }
    

    await googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: `Sheet 1!${colLetter}2:$AZ50`,
        valueInputOption: "USER_ENTERED",
        resource: {
            values: formattedScoreData
        },
    });
}

async function gradeAllStudents(assessment){
    console.log('Opening Virtual Browser...');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const loggedInPT = await loginPT(page);
    console.log('Getting Scores...');
    const scoresData = await getScores(loggedInPT, assessment);
    await page.close();
    await browser.close();
    console.log('Grading Assessments...');
    console.log('');
    const scores = await gradeAssessments(scoresData);
    console.log(scores);
    console.log("");
    const bool = prompt("Input to Google scores sheet? y/n   ");
    if (bool === 'y') {
        await inputScoresGoogle(scores);
    } else if (bool === 'n') {
        console.log('Scores not inputted');
    } else {
        throw ('Unknow input. Type y or n');
    }
}

async function gradeSingleStudent(assessment, name){
    console.log('Opening Virtual Browser...');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const loggedInPT = await loginPT(page);
    console.log('Getting Scores...');
    const scoresData = await getScores(loggedInPT, assessment);
    await page.close();
    await browser.close();
    console.log('Grading Assessments...');
    console.log('');
    const scores = await gradeAssessments(scoresData, name);
    console.log(scores);
    console.log("");
    const bool = prompt("Input to Google scores sheet? y/n   ");
    if (bool === 'y') {
        await inputScoresGoogle(scores);
    } else if (bool === 'n') {
        console.log('Scores not inputted');
    } else {
        throw ('Unknow input. Type y or n');
    }
}

async function beginMonitor(page, prevSubmissions = {}) {
    console.log(`Checking Submissions...`);
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    const newSubmissions = await getScores(page);
    let assessName = Object.keys(newSubmissions)[0];
    const gradeThese = {};
    gradeThese[assessName] = {};

    for (let name in newSubmissions[assessName]) {
        if (!prevSubmissions[assessName] || !prevSubmissions[assessName][name] || (newSubmissions[assessName][name] != prevSubmissions[assessName][name])) {
            gradeThese[assessName][name] = newSubmissions[assessName][name];
        }
    }
    if (Object.values(gradeThese[assessName]).length != 0) {
        console.log('Grading Assessments...');
        console.log('');
        const scores = await gradeAssessments(gradeThese);
        console.log(scores);
        console.log('');
        await inputScoresGoogle(scores);
    } else {
        console.log(`No new submissions for ${assessName}`);
        console.log('');
    }
    
    await new Promise(_ => setTimeout(_, 10000));
    beginMonitor (page, newSubmissions);
}


async function monitorMode(){
    console.log('Opening Virtual Browser...');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const loggedInPT = await loginPT(page);
    await beginMonitor(loggedInPT);
}

if (process.argv[2] === '-m') {
    monitorMode();
} else if (process.argv[2] && process.argv[3]){
    gradeSingleStudent(process.argv[2], process.argv[3]);
} else {
    gradeAllStudents(process.argv[2]);
}