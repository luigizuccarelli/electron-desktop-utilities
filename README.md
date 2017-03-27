# desktop-utilities

## An electron based front end application

### Front end desktop utility application

* Knowledge base
* Todo List

### Config.json (remote data store)

* Update the config.json
* set "remote_store" : "true"
* Add host (where the data will be stored)
* Add ssh user
* Update the base default dir (where data will be stroed)

### SSH Access

* launch ssh-agent
* ```eval "$(ssh-agent -s)"```
* Add your public key to the agent
* ssh-add ~/.ssh/id_rsa

### Installation and launch

* Install electron using ```npm install -g electron```
* Download or clone this repo and cd into the repo
* ```npm install .```
* Then execute ```npm start``` 
