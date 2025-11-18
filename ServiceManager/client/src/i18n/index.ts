import { useLanguage } from '@/contexts/LanguageContext';
import { en } from './en';
import { sr } from './sr';

export type Translations = typeof en;

const translations = {
  en,
  sr,
};

export function useTranslation() {
  const { language } = useLanguage();
  return translations[language];
}

export { en, sr };
