import 'zone.js';
import '@ni/nimble-components/dist/esm/button/index.js';
import '@ni/nimble-components/dist/esm/icons/arrows-repeat/index.js';
import '@ni/nimble-components/dist/esm/spinner/index.js';
import '@ni/nimble-components/dist/esm/theme-provider/index.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
