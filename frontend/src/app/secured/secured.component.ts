import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterModule],
  templateUrl: './secured.component.html'
})
export class SecuredComponent {
  
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
