# graphql-server
Graphql backend service

This is a sample graphql backend service written in Javascript.
Uses the Apollo Graphql Server.

This App expects a github account to be able to make mutation calls. For this create a `.env` file in the
directory and add
CLIENT_ID --> Your Github Client ID (check in the developer tab in the Settings page to get one.)
CLIENT_SECRET --> Your Github Client ID (check in the developer tab in the Settings page to get one.)
DB_HOST --> This is your MongoDB URL.

How to Run -
Clone the repo.
Add the .env file with the above details.
npm start to run the server. By default the GraphiQl Client runs in localhost:4000/playground.
Make query calls and enjoy..

Thanks
