import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';
import { LangProvider } from './i18n';

function Root() {
  return React.createElement(LangProvider, null, React.createElement(App));
}

registerRootComponent(Root);
