import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ruTranslation from './locales/ru/translation.json';
import enTranslation from './locales/en/translation.json';

import ruErrors from './locales/ru/errors.json';
import enErrors from './locales/en/errors.json';

const i18next_codemirror = i18next.createInstance();

i18next_codemirror
  .use(LanguageDetector)
  .init({
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],

      // keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // cache user language on
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'], // languages to not persist (cookie, localStorage)

      // optional expire and domain for set cookie
      cookieMinutes: 10,
      cookieDomain: window.location.hostname,

      // optional htmlTag with lang attribute, the default is:
      htmlTag: document.documentElement
    },
    resources: {
      en: {
        translation: enTranslation,
        errors: enErrors
      },
      ru: {
        translation: ruTranslation,
        errors: ruErrors
      },
    },
    fallbackLng: {
      'en-US': ['en'],
      'ru-RU': ['ru'],
      default: ['en'],
    },
    whitelist: ['en', 'ru'],

    // // have a common namespace used around the full app
    // ns: ['translations'],
    debug: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
    defaultNS: 'errors',
    load: 'currentOnly',
    preload: [ 'en', 'ru'],
    keySeparator: '.', // we use content as keys
    nsSeparator: ':',
    interpolation: {
      escapeValue: false, // not needed for react!!
      // formatSeparator: ','
    },
    react: {
      wait: true,
      useSuspense: true
    }
}).then((t) => {
});

export default i18next_codemirror;


