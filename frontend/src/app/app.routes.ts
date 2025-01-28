import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SecuredComponent } from './secured/secured.component';
import { AlertsComponent } from './secured/alerts/alerts.component';
import { AlertDashboardComponent } from './secured/alerts/alert-dashboard.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'secured', component: SecuredComponent,
      children: [
        { path: 'alerts', component: AlertsComponent, children: [
          {path: ':id', component: AlertDashboardComponent}
        ]}
      ]
     },
    { path: '**', redirectTo: 'secured' }
];
