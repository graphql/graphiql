/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en/translation.json';
import enDocExplorer from './locales/en/DocExplorer.json';
import enToolbar from './locales/en/Toolbar.json';
import enEditor from './locales/en/Editor.json';
import enErrors from './locales/en/Errors.json';
import ruTranslations from './locales/ru/translation.json';
import ruDocExplorer from './locales/ru/DocExplorer.json';
import ruToolbar from './locales/ru/Toolbar.json';
import ruEditor from './locales/ru/Editor.json';
import ruErrors from './locales/ru/Errors.json';

const resources = {
  en: {
    translations: enTranslations,
    DocExplorer: enDocExplorer,
    Toolbar: enToolbar,
    Editor: enEditor,
    Errors: enErrors,
  },
  ru: {
    translations: ruTranslations,
    DocExplorer: ruDocExplorer,
    Toolbar: ruToolbar,
    Editor: ruEditor,
    Errors: ruErrors,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    //  Language detector options
    detection: {
      // order and from where user language should be detected
      order: [
        'querystring',
        'localStorage',
        'navigator',
        'htmlTag',
        'path',
        'subdomain',
      ],

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
      htmlTag: document.documentElement,
    },

    // we init with resources
    resources,
    fallbackLng: {
      'en-US': ['en'],
      default: ['en'],
    },
    whitelist: ['en', 'ru'],
    // // have a common namespace used around the full app
    // ns: ['translations'],
    defaultNS: 'translation',
    load: 'currentOnly',
    preload: ['en', 'ru'],
    keySeparator: '.', // we use content as keys
    nsSeparator: ':',
    interpolation: {
      escapeValue: false, // not needed for react!!
    },
    react: {
      wait: true,
    },
  });

export default i18n;
