
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';
import esES from './locales/es-ES';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        translation: ptBR
      },
      en: {
        translation: enUS
      },
      es: {
        translation: esES
      }
    },
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

// Mantém o atributo lang da página igual ao idioma em uso (leitores de tela e buscadores).
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng.startsWith('pt') ? 'pt-BR' : lng.startsWith('es') ? 'es' : 'en';
};
syncHtmlLang(i18n.resolvedLanguage || i18n.language || 'pt');
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
