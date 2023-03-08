#!/bin/bash

echo '' > ~/Desktop/assessment_grading_bot/log.txt

cd ~/Downloads

cd Assessments

rm -rf ~/Downloads/Assessments/$2

wget -q $1 -O ~/Downloads/Assessments/$2.zip

unzip -q -d ~/Downloads/Assessments/$2 $2.zip

rm $2.zip

cd $2

rm -rf __MACOSX

ASSESSMENT_DIRECTORY="$(find ./ -type d -name "spec" -execdir pwd \; -quit)"

cd $ASSESSMENT_DIRECTORY

# invoke puppeteer grading function with SpecRunner.html file
# logs grade to log.txt

if [ -f ./SpecRunner.html ]
then
    node ~/Desktop/assessment_grading_bot/jasmineParser.js $ASSESSMENT_DIRECTORY
    SCORE=$(grep '^[0-9][0-9]* specs, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
else
    SCORE='Unable To Run Specs'
fi

echo "$2 : $SCORE"