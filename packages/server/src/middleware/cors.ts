import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (
      !origin ||
      (origin.match(/localhost/g) && process.env.NODE_ENV !== 'production') ||
      origin.match(/https?:\/\/.*\.caribto\.com.*/g)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Blocked by CORS'));
    }
  },
};
