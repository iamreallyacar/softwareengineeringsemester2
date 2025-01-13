# Tasks

## Frontend Tasks

1. Notice how we have to install additional packages even after "npm install"? Add those packages into the package.json file so that they are downloaded all together.

    - django-restframework
    - django-restframework-simplejwt
    - I can't remember the rest

2. Create a home page for the smart homes

3. Make it so that clicking on a smart home from the smart home list can lead to the home page

## Backend Tasks

1. Create the database to store the usage and generation data for individual smart homes
    - Since there will be multiple smart homes created, we might need a way to create a new database for each new smart home

2. The bunch of python files in the backend is a mess, we should create subfolders to organize them.
    - Files that are automatically created by django should be separated from the files we have to deal with so that we do not feel overwhelmed
