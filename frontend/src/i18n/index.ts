import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import cs from './cs.json'
import en from './en.json'
import ru from './ru.json'
import ua from './ua.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en },
      ru: { translation: ru },
      ua: { translation: ua },
    },
    lng: localStorage.getItem('lang') || 'cs',
    fallbackLng: 'cs',
    interpolation: { escapeValue: false },
  })

export default i18n
