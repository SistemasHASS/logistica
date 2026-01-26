import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminSistemaGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  async canActivate(): Promise<boolean> {

    const permitido = await this.auth.isAdminSistemaLogistica();

    if (!permitido) {
      this.router.navigate(['/main/parametros']);
      return false;
    }

    return true;
  }
}


// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// @Injectable({ providedIn: 'root' })
// export class AdminSistemaGuard implements CanActivate {

//   constructor(
//     private auth: AuthService,
//     private router: Router
//   ) {}

//   async canActivate(): Promise<boolean> {

//     const permitido = await this.auth.isAdminSistemaLogistica();

//     if (!permitido) {
//       this.router.navigate(['/main/parametros']);
//       return false;
//     }

//     return true;
//   }
// }
