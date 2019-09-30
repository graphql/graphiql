import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

//  Resources

//  Default
import ruTranslations from '../locales/ru/translation.json';
import enTranslations from '../locales/en/translation.json';

import ruDocExplorer from '../locales/ru/DocExplorer.json';
import enDocExplorer from '../locales/en/DocExplorer.json';

import ruToolbar from '../locales/ru/Toolbar.json'
import enToolbar from '../locales/en/Toolbar.json'

import ruEditor from '../locales/ru/Editor.json'
import enEditor from '../locales/ru/Editor.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    //  Language detector options
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


    // backend: { //  auto load locales from backend - xhr-backend options
    //   // path where resources get loaded from, or a function
    //   // returning a path:
    //   // function(lngs, namespaces) { return customPath; }
    //   // the returned path will interpolate lng, ns if provided like giving a static path
    //   loadPath: '/locales/{{lng}}/{{ns}}.json',
    //
    //   // path to post missing resources
    //   //  addPath: '/locales/{{lng}}/{{ns}}',
    //
    //   // your backend server supports multiloading
    //   // /locales/resources.json?lng=de+en&ns=ns1+ns2
    //   // Adapter is needed to enable MultiLoading https://github.com/i18next/i18next-multiload-backend-adapter
    //   // Returned JSON structure in this case is
    //   // {
    //   //  lang : {
    //   //   namespaceA: {},
    //   //   namespaceB: {},
    //   //   ...etc
    //   //  }
    //   // }
    //   //  allowMultiLoading: false, // set loadPath: '/locales/resources.json?lng={{lng}}&ns={{ns}}' to adapt to multiLoading
    //
    //   // parse data after it has been fetched
    //   // in example use https://www.npmjs.com/package/json5
    //   // here it removes the letter a from the json (bad idea)
    //   // parse(data) { return data.replace(/a/g, ''); },
    //
    //   // allow cross domain requests
    //   //  crossDomain: false,
    //
    //   // allow credentials on cross domain requests
    //   //  withCredentials: false,
    //
    //   // overrideMimeType sets request.overrideMimeType("application/json")
    //   //  overrideMimeType: false,
    //
    //   // custom request headers sets request.setRequestHeader(key, value)
    //   // customHeaders: {
    //   //   authorization: 'foo',
    //   //   // ...
    //   // },
    //
    //   // define a custom xhr function
    //   // can be used to support XDomainRequest in IE 8 and 9
    //   //
    //   // 'url' will be passed the value of 'loadPath'
    //   // 'options' will be this entire options object
    //   // 'callback' is a function that takes two parameters, 'data' and 'xhr'.
    //   //            'data' should be the key:value translation pairs for the
    //   //            requested language and namespace, or null in case of an error.
    //   //            'xhr' should be a status object, e.g. { status: 200 }
    //   // 'data' will be a key:value object used when saving missing translations
    //   //  ajax (url, options, callback, data) {},
    //
    //   // adds parameters to resource URL. 'example.com' -> 'example.com?v=1.3.5'
    //   //  queryStringParams: { v: '1.3.5' }
    // },

    // we init with resources
    resources: {
      en: {
        translations: enTranslations, //  default
        DocExplorer: enDocExplorer,
        Toolbar: enToolbar,
        Editor: enEditor
      },
      ru: {
        translations: ruTranslations,
        DocExplorer: ruDocExplorer,
        Toolbar: ruToolbar,
        Editor: ruEditor
      },
    },
    fallbackLng: {
      'en-US': ['en'],
      'ru-RU': ['ru'],
      default: ['en'],
    },
    whitelist: ['en', 'ru'],
    debug: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',

    // // have a common namespace used around the full app
    // ns: ['translations'],
    defaultNS: 'translation',
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
    },

});

export default i18n;
