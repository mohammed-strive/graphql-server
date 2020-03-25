const {createServer} = require('http');
const {ApolloServer, PubSub} = require('apollo-server-express');
const express = require('express');
const graphqlPlayground = require('graphql-playground-middleware-express').default;
const fs = require('fs');
const {MongoClient} = require('mongodb');
const typeDefs = fs.readFileSync('./typeDefs.graphql', 'utf-8');
const resolvers = require('./resolvers').resolvers;
require('dotenv').config();

(async function() {
  const app = express();
  const MONGO_DB = process.env.DB_HOST;

  try {
    const client = await MongoClient.connect(
        MONGO_DB,
        {useNewUrlParser: true},
    );

    const db = client.db();

    const pubsub = new PubSub();
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({req, connection}) => {
        const githubToken = (req ?
          req.headers.authorization :
          connection.context.Authorization
        );
        const currentUser = await db.collection('users').findOne({githubToken});

        return {db, currentUser, pubsub};
      },
    });
    const httpServer = createServer(app);
    server.installSubscriptionHandlers(httpServer);
    server.applyMiddleware({app});
    app.get('/', (req, res) => res.end(`Welcome the PhotoShare API. URL for the API is http://localhost:4000${server.graphqlPath}`));
    app.get('/playground', graphqlPlayground({endpoint: '/graphql'}));
    app.listen({port: 4000}, () => {
      console.log(`GraphQL server running at http://localhost:4000${server.graphqlPath}`);
    });
  } catch (err) {
    console.log(err.message);
  }
})();
