export interface AppEnvironment {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  googleMapsApiKey: string;
}

export const sharedEnvironment = {
  appName: 'Rental Agency Frontend',
  googleMapsApiKey: 'AIzaSyCe6374KnYQjlnY_7vpD3oKUeDtodQ6804'
} as const;
