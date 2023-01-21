#!/bin/bash

rm -rf ~/Downloads/Assessments
mkdir ~/Downloads/Assessments

open ~/Downloads/Assessments

echo '' > ~/Desktop/hw_tracking_bot/scores_data.txt
echo '' > ~/Desktop/hw_tracking_bot/log.txt

now=$(date)
echo "$now" >> ~/Desktop/hw_tracking_bot/scores_data.txt

~/.nvm/versions/node/v16.19.0/bin/node ~/Desktop/hw_tracking_bot/assessment_bot.js

echo 'End'