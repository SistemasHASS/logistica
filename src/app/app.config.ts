import { ApplicationConfig,isDevMode,provideZoneChangeDetection } from '@angular/core';
import { provideRouter,withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,withHashLocation()), 
    provideHttpClient(),
    provideAnimations(),
    provideAnimationsAsync(),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    }),
    providePrimeNG({
      theme: 
      {
        preset: Aura,
        options: {
          darkModeSelector: 'light' // 👈🔥 FORZAR MODO CLARO
        }
      }
    })
  ]
};
