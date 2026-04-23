import { registerRootComponent } from 'expo';
import React from 'react';
import App from './App';
import { LangProvider } from './i18n';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51TLW85LvABaZ6nVwr3GaPyL2sPpWSR33qOgmPk1Bx43w8r7nMzZRHJENjAmRo2EczTqdLhcO8069VvOCx0rRHi700045LXSAgT';

function Root() {
  return React.createElement(
    StripeProvider,
    {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.smarthealth.app',
    },
    React.createElement(
      LangProvider,
      null,
      React.createElement(App)
    )
  );
}

registerRootComponent(Root);
