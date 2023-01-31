#!/bin/bash

rm -rf ~/Downloads/Assessments
mkdir ~/Downloads/Assessments

open ~/Downloads/Assessments

echo '' > ~/Desktop/assessment_grading_bot/scores_data.txt
echo '' > ~/Desktop/assessment_grading_bot/log.txt

now=$(date)
echo "$now" >> ~/Desktop/assessment_grading_bot/scores_data.txt

node ~/Desktop/assessment_grading_bot/assessment_bot.js

echo 'End'