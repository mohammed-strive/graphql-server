const fetch = require('node-fetch');
require('dotenv').config();

const requestGithubToken = (credentials) => {
  return fetch(`https://github.com/login/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      }).then((res) => res.json())
      .catch((err) => {
        throw new Error(JSON.stringify(err));
      });
};

const requestGithubUserAccount = (token) => {
  return fetch(`https://api.github.com/user?access_token=${token}`)
      .then((res) => res.json())
      .catch((err) => {
        throw new Error(JSON.stringify(err));
      });
};

/**
 * Function to authorize user with github
 * @constructor
 * @param {Object} credentials - client id, secret and code
*/
async function authorizeWithGithub(credentials) {
  const {access_token} = await requestGithubToken(credentials);
  const githubUser = await requestGithubUserAccount(access_token);
  return {...githubUser, access_token};
};

module.exports.authorizeWithGithub = authorizeWithGithub;

if (require.main === module) {
  (async function() {
    const credentials = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: '5db41f774de4e9ff3ce2',
    };

    const data = await requestGithubToken(credentials);
    console.log(JSON.stringify(data));
  })();
}
