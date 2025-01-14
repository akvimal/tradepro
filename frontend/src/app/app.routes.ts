import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SecuredComponent } from './secured/secured.component';
import { OrdersComponent } from './secured/orders/orders.component';
import { SignalComponent } from './signal.component';
import { WSClientComponent } from './wsclient.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'secured', component: SecuredComponent,
      children: [
        {path: 'orders', component: OrdersComponent},
        {path: 'signals', component: SignalComponent},
        {path: 'ws', component: WSClientComponent}
      ]
     },
    { path: '**', redirectTo: 'secured' }
];
