const fastify = require('fastify')({ logger: true })
const pipedrive = require('pipedrive');
const { addSeconds } = require('date-fns');
const axios = require('axios');
require('dotenv').config()

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : 'password',
    database : 'clickup_integration'
  }
});

knex.migrate.latest();

const apiClient = pipedrive.ApiClient.instance;

let oauth2 = apiClient.authentications.oauth2;
oauth2.clientId = process.env.PD_CLIENT_ID;
oauth2.clientSecret = process.env.PD_CLIENT_SECRET;
oauth2.redirectUri = process.env.PD_REDIRECT_URI;

const authUrl = apiClient.buildAuthorizationUrl();

console.log(`Start auth here: ${authUrl}`)

fastify.route({
  method: 'GET',
  url: '/api/provider/pipedrive/connect',
  handler: async (request, reply) => {
    const { code } = request.query;

    return reply.redirect(`https://app.clickup.com/api?client_id=${process.env.CLICKUP_CLIENT_ID}&redirect_uri=${process.env.CLICKUP_REDIRECT_URI}&state=${code}`)
  }
});

// State contains pipedrive authorization code
fastify.route({
  method: 'GET',
  url: '/api/provider/clickup/connect',
  handler: async (request, reply) => {
    const { code, state } = request.query;

    const pipedriveTokens = await apiClient.authorize(state);

    let defaultClient = pipedrive.ApiClient.instance;
    let oauth2 = defaultClient.authentications['oauth2'];
    oauth2.accessToken = pipedriveTokens.access_token;

    let apiInstance = new pipedrive.UsersApi();
    const { data: pipedriveUser } = await apiInstance.getCurrentUser();

    const expiresIn = addSeconds(new Date(), pipedriveTokens.expires_in);

    const { data: clickupTokens } = await axios({
      method: 'POST',
      url: 'https://app.clickup.com/api/v2/oauth/token',
      data: {
        code,
        client_id: process.env.CLICKUP_CLIENT_ID,
        client_secret: process.env.CLICKUP_CLIENT_SECRET,
      },
    })

    const { data: { user: clickupUser } } = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/user',
      headers: {
        Authorization: clickupTokens.access_token,
      }
    });

    const [localId] = await knex('user').insert({});

    await knex('pd_tokens').insert({
      user_id: pipedriveUser.id,
      company_id: pipedriveUser.company_id,
      access_token: pipedriveTokens.access_token,
      refresh_token: pipedriveTokens.refresh_token,
      scope: pipedriveTokens.scope,
      api_domain: pipedriveTokens.api_domain,
      expires_in: expiresIn,
      local_id: localId,
    });

    await knex('clickup_tokens').insert({
      access_token: clickupTokens.access_token,
      user_id: clickupUser.id,
      local_id: localId,
    });

    return { success: true }
  }
});

const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start();
