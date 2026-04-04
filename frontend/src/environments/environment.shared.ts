export interface AppEnvironment {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
}

export const sharedEnvironment = {
  appName: 'Rental Agency Frontend'
} as const;
