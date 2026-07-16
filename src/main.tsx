import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import './index.css'
import App from './App.tsx'

const locale = navigator.language || 'en'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntlProvider locale={locale} defaultLocale="en">
      <App />
    </IntlProvider>
  </StrictMode>,
)
