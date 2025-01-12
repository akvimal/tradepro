import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SecuredComponent } from './secured/secured.component';
import { AuthGuard } from './auth/auth.guard';
import { OrdersComponent } from './secured/orders/orders.component';
import { ChatComponent } from './chat.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'secured', component: SecuredComponent,
      children: [
        {path: 'orders', component: OrdersComponent},
        {path: 'chat', component: ChatComponent}
      ]
     },
    { path: '**', redirectTo: 'secured' }
];
