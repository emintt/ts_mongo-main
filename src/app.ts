import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {ClientRequest} from 'http';

import {notFound, errorHandler} from './middlewares';
import {MessageResponse} from './types/Messages';

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.disable('x-powered-by');
app.use(express.json());

// Routes and microservices
const services = [
  {
    route: '/api1',
    target: 'https://pokeapi.co/api/v2/pokemon',
  },
  {
    route: '/api2',
    target: 'https://jsonplaceholder.typicode.com/users',
  },
  {
    route: '/weather',
    target: 'https://api.openweathermap.org/data/2.5/weather',
     // Add additional proxy options for this service
     on: {
       proxyReq: (proxyReq: ClientRequest) => {
       // Append apikey query parameter to the target URL
       proxyReq.path += '&appid=' + process.env.API_KEY;
       console.log(proxyReq);
       console.log(process.env.API_KEY);
      },
    },
  },
];

services.forEach(({ route, target, on }) => {
  const proxyOptions = {
    on,
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
    secure: process.env.NODE_ENV === 'production', // Enable SSL verification in production
  };

  console.log(proxyOptions);
  app.use(route, createProxyMiddleware(proxyOptions));
});

app.get<{}, MessageResponse>('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Hello!',
  });
});


app.use(notFound);
app.use(errorHandler);

export default app;
