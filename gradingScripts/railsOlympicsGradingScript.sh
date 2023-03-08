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

cd "$(find ./ -type d -name "lib" -execdir pwd \; -quit)"

if [ -f ./Gemfile.lock ]
then
    rm Gemfile.lock
fi

if [ -f ./Gemfile ]
then
    bundle install > ~/Desktop/assessment_grading_bot/log.txt;
    rails db:environment:set > ~/Desktop/assessment_grading_bot/log.txt;
    rails db:reset > ~/Desktop/assessment_grading_bot/log.txt;
    rails db:test:load > ~/Desktop/assessment_grading_bot/log.txt;
    bundle exec rspec > ~/Desktop/assessment_grading_bot/log.txt;

    SCORE=$(grep '^[0-9][0-9]* examples, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
else
    SCORE='Unable To Run Specs'
fi

echo "$2 : $SCORE"