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

export function useCertificationViewModel(session) {
  const [form, setForm] = useState(() => defaultForm(session));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      setResult(null);

      const payload = {
        ...form,
        weight_tonnes: Number(form.weight_tonnes || 0),
        cu_grade_percent: Number(form.cu_grade_percent || 0),
        co_grade_percent: Number(form.co_grade_percent || 0),
        fe_percent: Number(form.fe_percent || 0),
        s_percent: Number(form.s_percent || 0),
        density_t_m3: Number(form.density_t_m3 || 0),
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
    isSubmitting,
    updateField,
    submit,
  };
}
