import express from 'express';
import { startDiscord } from './bot.js';
import { connectDb } from './data_storage.js';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.listen(3000, async () => {
  await startDiscord();
  connectDb();
  console.log('server started');
});
