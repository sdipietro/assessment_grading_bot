const process = require('process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function openJasmine() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(`file://${process.argv[2]}/SpecRunner.html`);
    
    await page.waitForSelector('span.bar', {
        visible: true,
    });

    const grade = await page.evaluate(() => {
        const gradeEle = document.getElementsByClassName('alert')[0].getElementsByTagName('span')[1].innerText;
        return gradeEle;
    });

    
    fs.writeFile(path.join(__dirname, "log.txt"), grade, function (err) {
        if (err) throw err;
    });

    await browser.close();
}

async function getGrade(){
    await openJasmine();
}

getGrade();
