const config = {
  DB: {
    nestjs_beginner: {
      MONGO_URI: 'mongodb://localhost',
    },
  },
  SERVER: {
    PORT: 8888,
    ENV: 'development',
    JWT_SECRET: 'xxxxxx',
    JWT_EXPIRE: 'xxxxxx', //Change your config when create configs
  },
};

export default config;
