#!/bin/bash

SQLSCORE=''
ACTIVERECORDSCORE=''
MIGRATIONSSCORE=''
ASSOCIATIONSSCORE=''

echo '' > ~/Desktop/assessment_grading_bot/log.txt

cd ~/Downloads

cd Assessments

rm -rf ~/Downloads/Assessments/$2

wget -q $1 -O ~/Downloads/Assessments/$2.zip

unzip -q -d ~/Downloads/Assessments/$2 $2.zip

rm $2.zip

cd $2

rm -rf __MACOSX

echo "Name : $2"

# cd "$(find ./ -type d -name "lib" -execdir pwd \; -quit)"
cd "$(find . -name "sql" -type d | sed 1q)"

if [ -f ./Gemfile.lock ]
then
    rm Gemfile.lock
fi

if [ -f ./.ruby-version ]
then
    rm .ruby-version
fi

if [ -f ./Gemfile ]
then
    bundle install > ~/Desktop/assessment_grading_bot/log.txt;
    chmod +x data/import_cat_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    sh ./data/import_cat_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    bundle exec rspec > ~/Desktop/assessment_grading_bot/log.txt;
    # bundle exec rails db:drop
   
    SQLSCORE=$(grep '^[0-9][0-9]* examples, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
    if  [[ -z  $SQLSCORE  ]]; then SQLSCORE='Unable To Run Specs'; fi
else
    SQLSCORE='Unable To Run Specs'
fi

echo "SQL : $SQLSCORE"

if [ -d ./spec ]
then
    cd ..
fi

cd "$(find . -name "active_record_queries" -type d | sed 1q)"

if [ -f ./Gemfile.lock ]
then
    rm Gemfile.lock
fi

if [ -f ./.ruby-version ]
then
    rm .ruby-version
fi

if [ -f ./Gemfile ]
then
    bundle install > ~/Desktop/assessment_grading_bot/log.txt;
    chmod +x ./setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    sh setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    bundle exec rspec > ~/Desktop/assessment_grading_bot/log.txt;
   
    ACTIVERECORDSCORE=$(grep '^[0-9][0-9]* examples, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
    if  [[ -z  $ACTIVERECORDSCORE  ]]; then ACTIVERECORDSCORE='Unable To Run Specs'; fi
else
    ACTIVERECORDSCORE='Unable To Run Specs'
fi

echo "Active Record : $ACTIVERECORDSCORE"

if [ -d ./spec ]
then
    cd ..
fi
cd "$(find . -name "migrations" -type d | sed 1q)"

if [ -f ./Gemfile.lock ]
then
    rm Gemfile.lock
fi

if [ -f ./.ruby-version ]
then
    rm .ruby-version
fi

if [ -f ./Gemfile ]
then
    bundle install > ~/Desktop/assessment_grading_bot/log.txt;
    chmod +x ./setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    sh setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    bundle exec rspec > ~/Desktop/assessment_grading_bot/log.txt;
   
    MIGRATIONSSCORE=$(grep '^[0-9][0-9]* examples, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
    if  [[ -z  $MIGRATIONSSCORE  ]]; then MIGRATIONSSCORE='Unable To Run Specs'; fi
else
    MIGRATIONSSCORE='Unable To Run Specs'
fi

echo "Migrations : $MIGRATIONSSCORE"

if [ -d ./spec ]
then
    cd ..
fi
cd "$(find . -name "associations" -type d | sed 1q)"

if [ -f ./Gemfile.lock ]
then
    rm Gemfile.lock
fi

if [ -f ./.ruby-version ]
then
    rm .ruby-version
fi

if [ -f ./Gemfile ]
then
    bundle install > ~/Desktop/assessment_grading_bot/log.txt;
    chmod +x ./setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    sh setup_db.sh > ~/Desktop/assessment_grading_bot/log.txt;
    bundle exec rspec > ~/Desktop/assessment_grading_bot/log.txt;
   
    ASSOCIATIONSSCORE=$(grep '^[0-9][0-9]* examples, [0-9][0-9]* failure' ~/Desktop/assessment_grading_bot/log.txt)
    if  [[ -z  $ASSOCIATIONSSCORE  ]]; then ASSOCIATIONSSCORE='Unable To Run Specs'; fi
else
    ASSOCIATINSSCORE='Unable To Run Specs'
fi

echo "Associations : $ASSOCIATIONSSCORE"

# echo "Name : $2"
# echo "SQL : $SQLSCORE"
# echo "Active Record : $ACTIVERECORDSCORE"
# echo "Migrations : $MIGRATIONSSCORE"
# echo "Associations : $ASSOCIATIONSSCORE"