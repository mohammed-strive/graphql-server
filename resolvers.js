const {GraphQLScalarType} = require('graphql');
const lib = require('./lib');
const fetch = require('node-fetch');
require('dotenv').config();

const resolvers = {
  Query: {
    me(parent, args, {currentUser}) {
      return currentUser;
    },
    totalPhotos(parent, args, {db}) {
      return db.collection('photos').estimatedDocumentCount()
          .then((count) => count? count: 0);
    },
    allPhotos(parent, args, {db}) {
      return db.collection('photo').find().toArray();
    },

    totalUsers(parent, args, {db}) {
      return db.collection('users').estimatedDocumentCount()
          .then((count) => count? count: 0);
    },

    allUsers(parent, args, {db}) {
      return db.collection('users').find().toArray();
    },
  },

  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A valid date time value',
    parseValue: (value) => new Date(value),
    parseLiteral: (ast) => ast.value,
    serialize: (value) => new Date(value).toISOString(),
  }),

  Mutation: {

    async fakeUserAuth(parent, {githubLogin}, {db}) {
      const user = await db.collection('users').find({githubLogin});

      if (!user) {
        throw new Error(`Cannot find user with login: ${githubLogin}`);
      }

      return {
        token: user.githubToken,
        user,
      };
    },

    async postPhoto(parent, args, {db, currentUser, pubsub}) {
      if (!currentUser) {
        throw new Error('Only authorized users can post photos');
      }

      const photo = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date(),
      };

      const {insertedIds} = await db.collection('photos').insert(newPhoto);
      photo.id = insertedIds[0];

      pubsub.publish('photo-added', {newPhoto});

      return photo;
    },

    async githubAuth(parent, {code}, {db}) {
      // Getting data from Github..
      const {
        message,
        access_token,
        avatarUrl,
        login,
        name,
      } = await lib.authorizeWithGithub({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
      });

      if (message) {
        throw new Error(message);
      }

      const latestUserInfo = {
        name,
        githubLogin: login,
        githubToken: access_token,
        avatar: avatarUrl,
      };

      const {ops: [user]} = await db.collection('users')
          .replaceOne({githubLogin: login}, latestUserInfo, {upsert: true});
      return {user, token: access_token};
    },

    async addFakeUsers(parent, {count}, {db, pubsub}) {
      const randomUserApi = `https://randomuser.me/api?results=${count}`;

      const {results} = await fetch(randomUserApi).then((data) => data.json());
      const users = results.map((user) => {
        return {
          githubLogin: user.login.username,
          name: `${user.name.first} ${user.name.last}`,
          avatar: user.picture.thumbnail,
          githubToken: user.login.sha1,
        };
      });
      await db.collection('users').insertMany(users);
      users.forEach((user) => pubsub.publish('new-user', {user}));
      return users;
    },
  },

  Subscription: {
    newPhoto: {
      subscribe(parent, args, {pubsub}) {
        pubsub.asyncIterator('photo-added');
      },
    },

    newUser: {
      subscribe(parent, args, {pubsub}) {
        pubsub.asyncIterator('new-user');
      },
    },
  },

  Photo: {
    url(parent) {
      return `http://example.com/img/photos/${parent._id}.jpeg`;
    },
    postedBy(parent) {
      return db.collection('users').findOne({githubLogin: parent.userID});
    },
    id(parent) {
      return parent.id || parent._id;
    },
  },

  User: {
    postedPhotos(parent) {
      return photos.filter((photo) => parent.githubLogin === photo.githubUser);
    },
    inPhotos(parent) {
      return tags.filter((tag) => tag.userID === parent.id)
          .map((tag) => tag.photoID).map((photoid) => photos.find((photo) => photo.id === photoid));
    },
  },
};

module.exports.resolvers = resolvers;
