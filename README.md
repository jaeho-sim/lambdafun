notes:

- named hadler as "index_handler", so have to create index.js
- the code "index.js" goes into the code editor of GreetingSkill function in aws lambda management console
- In the aws lambda management console, to test the idex.js file, use Test and edit Input test event, copy and paste the events.json code
- To do this locally, type in "lambda-local -l index.js -e event.json" in terminal
	- npm install -g lambda-local
- get ARN from aws lambda management console, paste it in Alexa skills kit develop console
- why we need SSML:
	- to use appropriate punctuation (i.e. long pause, small pause, quesetion mark, 1234 instead of one thousand, ... etc)
	- additional control over how Alexa pronounces (by using tags)
- AWS CLI setup for automating process
	- brew install awscli
	- create a user and give permissions at IAM Management console
	- "aws configure" in terminal - access key
	- use "publish.sh"
- package "bespoken-tools":
	- enables development and testing without Lambda
	- install the package, type "bst proxy lambda index.js"
	- in skills console, Endpoint -> HTTPS -> copy url to default region -> select "My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate factory"