import { AppEnvironment, sharedEnvironment } from './environment.shared';

export const environment: AppEnvironment = {
  ...sharedEnvironment,
  production: true,
  apiBaseUrl: 'https://rantal-agency-backend.onrender.com',
   appUrl: 'https://rental-agency-frontend.onrender.com'
};
