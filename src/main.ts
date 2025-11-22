/// <reference types="@angular/localize" />

// main.ts (Angular 17+)
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App as AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';

// Register Spanish (Colombia) locale data so Angular pipes (DatePipe, CurrencyPipe, etc.)
// can format values using the 'es-CO' locale. This prevents runtime errors like:
// NG02100: InvalidPipeArgument: 'NG0701: Missing locale data for the locale "es-CO".'
registerLocaleData(localeEsCo, 'es-CO');

let appPromise = bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    provideAnimations(),
    // Ensure default LOCALE_ID is set to 'es-CO' (optional but keeps pipes consistent)
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ]
});

// HMR support: when using `ng serve --hmr`, accept module hot updates and
// dispose the application before reloading to avoid duplicate bootstraps.
declare const module: any;
if (module && module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    appPromise.then(appRef => appRef.destroy());
  });
}
