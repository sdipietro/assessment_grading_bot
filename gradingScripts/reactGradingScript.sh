#!/bin/bash

SCORE=''

echo '' > ~/Desktop/assessment_grading_bot/log.txt

cd ~/Downloads

cd Assessments

rm -rf ~/Downloads/Assessments/$2

wget -q $1 -O ~/Downloads/Assessments/$2.zip

unzip -q -d ~/Downloads/Assessments/$2 $2.zip

rm $2.zip

cd $2

rm -rf __MACOSX

cd "$(find ./ -type d -name "frontend" -execdir pwd \; -quit)"

# Not necessary to setup backend to run specs
# if [ -d ./backend ]
# then
#     cd backend
# else
#     SCORE='Unable To Run Specs'
# fi

# if [ -f ./Gemfile.lock ]
# then
#     rm Gemfile.lock
# fi

# if [ -f ./Gemfile ]
# then
#     bundle install > ~/Desktop/assessment_grading_bot/log.txt;
#     rails db:setup &> ~/Desktop/assessment_grading_bot/log.txt;
# else
#     SCORE='Unable To Run Specs'
# fi

# if [[ "${PWD##*/}" = backend ]]
# then 
#     cd ..
# fi

if [ -d ./frontend ]
then
    cd frontend
else
    SCORE='Unable To Run Specs'
fi

if [ -f ./package.json ]
then
    npm install > ~/Desktop/assessment_grading_bot/log.txt;
    npm test -- --watchAll=false &> ~/Desktop/assessment_grading_bot/log.txt;
    TESTS=$(grep 'Tests:' ~/Desktop/assessment_grading_bot/log.txt)
    SCORE=${TESTS##*:       }
    if  [[ -z  $SCORE  ]]; then SCORE='Unable To Run Specs'; fi
else
    SCORE='Unable To Run Specs'
fi

echo "$2 : $SCORE"