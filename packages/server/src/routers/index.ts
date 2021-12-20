import express from 'express';

import { TokenRouter } from './Token';

export const APIRouter = express.Router();

APIRouter.use('/token', TokenRouter);
