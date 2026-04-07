import { useState } from 'react';
import { certifyLot } from '../services/api/certificationService';

function defaultForm(session) {
  return {
    lot_id: `MOB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    producer: session?.name || 'Operateur',
    mineral_type: 'Cuivre',
    weight_tonnes: '125.4',
    cu_grade_percent: '5.2',
    co_grade_percent: '0.8',
    fe_percent: '12.5',
    s_percent: '1.2',
    density_t_m3: '2.7',
    extraction_date: new Date().toISOString().slice(0, 10),
    location: session?.site || 'Kamoa, Lualaba',
    mine_site: session?.site || 'Kamoa-Kansoko',
    site: session?.site || 'Kamoa-Kansoko',
  };
}

function parseDecimal(value) {
  return Number(String(value || '').replace(',', '.'));
}

function validate(form) {
  const nextErrors = {};

  if (!String(form.lot_id || '').trim()) {
    nextErrors.lot_id = 'Le lot ID est obligatoire.';
  }

  if (!String(form.producer || '').trim()) {
    nextErrors.producer = 'Le nom du producteur est obligatoire.';
  }

  if (!String(form.site || '').trim()) {
    nextErrors.site = 'Le site minier est obligatoire.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.extraction_date || '').trim())) {
    nextErrors.extraction_date = 'Utilisez le format YYYY-MM-DD.';
  }

  const numericRules = [
    ['weight_tonnes', 'Le poids doit etre superieur a zero.', (value) => value > 0],
    ['cu_grade_percent', 'La teneur en cuivre doit etre positive.', (value) => value >= 0],
    ['co_grade_percent', 'La teneur en cobalt doit etre positive.', (value) => value >= 0],
    ['fe_percent', 'La teneur en fer doit etre positive.', (value) => value >= 0],
    ['s_percent', 'La teneur en soufre doit etre positive.', (value) => value >= 0],
    ['density_t_m3', 'La densite doit etre superieure a zero.', (value) => value > 0],
  ];

  numericRules.forEach(([key, message, predicate]) => {
    const parsed = parseDecimal(form[key]);

    if (Number.isNaN(parsed) || !predicate(parsed)) {
      nextErrors[key] = message;
    }
  });

  return nextErrors;
}

export function useCertificationViewModel(session) {
  const [form, setForm] = useState(() => defaultForm(session));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setForm(defaultForm(session));
    setFieldErrors({});
  };

  const submit = async () => {
    const nextFieldErrors = validate(form);

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError('Verifiez les champs signales avant de continuer.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setResult(null);
      setFieldErrors({});

      const payload = {
        ...form,
        weight_tonnes: parseDecimal(form.weight_tonnes),
        cu_grade_percent: parseDecimal(form.cu_grade_percent),
        co_grade_percent: parseDecimal(form.co_grade_percent),
        fe_percent: parseDecimal(form.fe_percent),
        s_percent: parseDecimal(form.s_percent),
        density_t_m3: parseDecimal(form.density_t_m3),
      };

      const nextResult = await certifyLot(payload);
      setResult(nextResult);
    } catch (submitError) {
      setError(submitError.message || 'Certification echouee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    result,
    error,
    fieldErrors,
    isSubmitting,
    updateField,
    submit,
    resetForm,
  };
}
