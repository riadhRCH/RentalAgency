import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AgencySelectionComponent } from './auth/agency-selection/agency-selection.component';
import { authGuard, agencyGuard } from './auth/auth.guard';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { LeadsComponent } from './dashboard/leads/leads.component';
import { ConfigComponent } from './dashboard/config/config.component';

export const routes: Routes = [
    { path: '', component: LandingPage, canActivate: [authGuard, agencyGuard] },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'auth/select-agency', component: AgencySelectionComponent, canActivate: [authGuard] },
    { path: 'dashboard/overview', component: OverviewComponent, canActivate: [authGuard, agencyGuard] },
    { path: 'dashboard/leads', component: LeadsComponent, canActivate: [authGuard, agencyGuard] },
    { path: 'dashboard/config', component: ConfigComponent, canActivate: [authGuard, agencyGuard] }
];
