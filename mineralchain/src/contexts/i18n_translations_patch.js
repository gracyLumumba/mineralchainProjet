// Patch pour ajouter les traductions manquantes
// À ajouter dans i18nContext.jsx après 'register.back_login'

const MISSING_TRANSLATIONS = {
  fr: {
    'admin.dgmr.validated': 'Validés',
    'admin.filter.all': 'Tous les filtres',
  },
  en: {
    'admin.dgmr.validated': 'Validated',
    'admin.filter.all': 'All filters',
  }
};

export default MISSING_TRANSLATIONS;
