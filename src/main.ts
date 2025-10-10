// main.ts (Angular 17+)
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { App as AppComponent } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

let appPromise = bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient()
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
