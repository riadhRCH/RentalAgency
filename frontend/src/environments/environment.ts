import { AppEnvironment, sharedEnvironment } from './environment.shared';

export const environment: AppEnvironment = {
  ...sharedEnvironment,
  production: false,
  apiBaseUrl: 'http://localhost:3000',
  appUrl: 'http://localhost:4200'
};
