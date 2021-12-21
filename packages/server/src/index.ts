import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { corsOptions } from './middleware/cors';
import { APIRouter } from './routers';

const main = async () => {
  const app = express();

  app.use(express.json());
  app.use(cors(corsOptions));

  app.use('/api', APIRouter);

  const PORT = process.env.PORT ?? 4000;
  app.listen(PORT, () => {
    console.log(`Running server on port ${PORT}`);
  });
};

main();
