import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SecuredComponent } from './secured/secured.component';
import { AlertsComponent } from './secured/alerts/alerts.component';
import { TrendComponent } from './secured/trend/trend.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'secured', component: SecuredComponent,
      children: [
        {path: 'alerts', component: AlertsComponent},
        // {path: 'orders', component: OrdersComponent},
        // {path: 'trend', component: TrendComponent},
      ]
     },
    { path: '**', redirectTo: 'secured' }
];
