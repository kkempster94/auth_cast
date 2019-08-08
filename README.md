
# Auth Cast
Auth Cast is a tool which allows for any device to be used to cast a web page (like a dashboard, for example), to a chromecast from the command line. This functionality has proven to be useful for digital signage (ex. put the command in cron to have the web page always cast to your chromecast on a schedule).
### Getting Started
To get started, clone this repo. You will then be able to run the script by calling from the command line from within the root directory of this project, like so:
```
node index.js --loginUrl="http://github.com/login" --usernameInputSelector="#login" --passwordInputSelector="#pass"
```
It's also worth noting that the page you cast will auto refresh every 5 minutes.
#### Command Line Arguments
| argument | validation | required | purpose |
| ------ | ------ | ------ | ----- |
| url | any valid accessible URL | yes | the URL of the page that you want to ultimately cast |
| device | any lower-cased chromecast name on your network | yes | the name of the device you wish to cast to |
| width | any valid width string (ex: "1920") | no | your desired viewport width |
| height | any valid height string (ex: "1080") | no | your desired viewport height |
| loginUrl | any valid accessible URL | no | The URL of the page to log into |
| timeout | any valid string of a number (ex: "300") | no | the number of seconds you wish to cast for |
| usernameInputSelector| any valid querySelector (ex: "#someId") | no | the query selector which gets the username input field on the login page |
| username| string | no | your username that you want to login with |
| passwordInputSelector| any valid querySelector (ex: "#someId") | no | the query selector which gets the password input field on the login page |
| password| string | no | the password you want to login with |
| hasTwoStepLogin | boolean | no | If the login is split between two pages, one with the username field, and the next having the password field. |
| submitButtonSelector | any valid querySelector (ex: "#someId") | no | the query selector which gets the submit button for the login form (will be clicked once for each field if hasTwoStepLogin is true) |
| loginStep1ButtonSelector | any valid querySelector (ex: "#someId") | no | the query selector which gets the submit button for step 1 of a 2 step login. If the selector is the same for steps one and two, this argument does not need to be specified |
| autoRefreshButtonSelector| any valid querySelector (ex: "#someId") | no | the query selector which gets the auto refresh button which will be clicked once the desired URL is loaded (this assumes that the site you're using has an auto-refresh button somewhere on the page) |