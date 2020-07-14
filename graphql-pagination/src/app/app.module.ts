import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { HttpClientModule } from '@angular/common/http';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ApolloModule, HttpLinkModule],
  providers: [
    StatusBar,
    SplashScreen,
    {
      provide: [RouteReuseStrategy, APOLLO_OPTIONS],
      useClass: IonicRouteStrategy,
      useFactory: (httpLink: HttpLink) => {
        return {
          cache: new InMemoryCache(),
          link: httpLink.create({
            uri: 'https://api.github.com/graphql',
          }),
        };
      },
      deps: [HttpLink],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
