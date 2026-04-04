import { AppEnvironment, sharedEnvironment } from './environment.shared';

export const environment: AppEnvironment = {
  ...sharedEnvironment,
  production: true,
  apiBaseUrl: 'https://api.example.com'
};
