import { isTransportReady } from './roleAccess';

function countPendingValidation(lots = []) {
  return lots.filter((lot) => lot.analyzedAt && !lot.regulatorValidated && lot.status !== 'SUSPECT').length;
}

function countCertified(lots = []) {
  return lots.filter((lot) => lot.tokenId != null).length;
}

export function buildRoleSummary(session, lots = [], users = []) {
  const role = session?.role || 'producer';

  if (role === 'admin') {
    const pendingUsers = users.filter((user) => user.account_status === 'pending');
    const approvedUsers = users.filter((user) => user.account_status === 'approved');
    return {
      cards: [
        { key: 'pending-users', label: 'Comptes en attente', value: pendingUsers.length, tone: 'warning' },
        { key: 'approved-users', label: 'Comptes actifs', value: approvedUsers.length, tone: 'success' },
        { key: 'lots', label: 'Lots suivis', value: lots.length, tone: 'default' },
        { key: 'suspects', label: 'Lots suspects', value: lots.filter((lot) => lot.status === 'SUSPECT').length, tone: 'danger' },
      ],
      spotlight: pendingUsers.slice(0, 4),
      spotlightTitle: 'Comptes a traiter',
    };
  }

  if (role === 'regulator') {
    return {
      cards: [
        { key: 'pending', label: 'A valider', value: countPendingValidation(lots), tone: 'warning' },
        { key: 'suspects', label: 'Suspects', value: lots.filter((lot) => lot.status === 'SUSPECT').length, tone: 'danger' },
        { key: 'validated', label: 'Valides DGMR', value: lots.filter((lot) => lot.regulatorValidated).length, tone: 'success' },
        { key: 'analyzed', label: 'Analyses', value: lots.filter((lot) => lot.analyzedAt).length, tone: 'default' },
      ],
    };
  }

  if (role === 'transporter') {
    return {
      cards: [
        { key: 'ready', label: 'Prets au transport', value: lots.filter((lot) => isTransportReady(lot) && !lot.transportStatus).length, tone: 'warning' },
        { key: 'route', label: 'En route', value: lots.filter((lot) => lot.transportStatus === 'en_route').length, tone: 'default' },
        { key: 'delivered', label: 'Livres', value: lots.filter((lot) => lot.transportStatus === 'delivered').length, tone: 'success' },
        { key: 'blocked', label: 'Bloques', value: lots.filter((lot) => !isTransportReady(lot) && !lot.transportStatus).length, tone: 'danger' },
      ],
    };
  }

  return {
    cards: [
      { key: 'mine', label: 'Mes lots', value: lots.length, tone: 'default' },
      { key: 'pending', label: 'En attente DGMR', value: countPendingValidation(lots), tone: 'warning' },
      { key: 'certified', label: 'Certifies', value: countCertified(lots), tone: 'success' },
      { key: 'transport', label: 'En transport', value: lots.filter((lot) => lot.transportStatus === 'en_route').length, tone: 'default' },
    ],
  };
}

export function getRoleLotFilters(role) {
  if (role === 'admin') {
    return [
      { key: 'all', label: 'Tous' },
      { key: 'pending_accounts', label: 'Attention' },
      { key: 'suspect', label: 'Suspects' },
      { key: 'certified', label: 'Certifies' },
    ];
  }

  if (role === 'regulator') {
    return [
      { key: 'all', label: 'Tous' },
      { key: 'pending_validation', label: 'A valider' },
      { key: 'suspect', label: 'Suspects' },
      { key: 'validated', label: 'Valides' },
    ];
  }

  if (role === 'transporter') {
    return [
      { key: 'all', label: 'Tous' },
      { key: 'ready_transport', label: 'Prets' },
      { key: 'in_route', label: 'En route' },
      { key: 'delivered', label: 'Livres' },
    ];
  }

  return [
    { key: 'all', label: 'Tous' },
    { key: 'pending_validation', label: 'Attente DGMR' },
    { key: 'certified', label: 'Certifies' },
    { key: 'in_route', label: 'En transport' },
  ];
}

export function filterLotsByWorkflow(lots = [], role, filterKey) {
  if (!filterKey || filterKey === 'all') {
    return lots;
  }

  switch (filterKey) {
    case 'pending_validation':
      return lots.filter((lot) => lot.analyzedAt && !lot.regulatorValidated && lot.status !== 'SUSPECT');
    case 'suspect':
      return lots.filter((lot) => lot.status === 'SUSPECT');
    case 'validated':
      return lots.filter((lot) => lot.regulatorValidated);
    case 'certified':
      return lots.filter((lot) => lot.tokenId != null);
    case 'ready_transport':
      return lots.filter((lot) => isTransportReady(lot) && !lot.transportStatus);
    case 'in_route':
      return lots.filter((lot) => lot.transportStatus === 'en_route');
    case 'delivered':
      return lots.filter((lot) => lot.transportStatus === 'delivered');
    case 'pending_accounts':
      return lots.filter((lot) => lot.status === 'SUSPECT' || (lot.analyzedAt && !lot.regulatorValidated));
    default:
      return lots;
  }
}

export function getRoleNextStep(session, lot) {
  const role = session?.role || 'producer';

  if (role === 'admin') {
    if (lot.status === 'SUSPECT') {
      return { title: 'Suivi prioritaire', body: 'Ce lot doit etre suivi avec le regulateur avant tout transport.' };
    }
    if (!lot.regulatorValidated && lot.analyzedAt) {
      return { title: 'Validation attendue', body: 'Le regulateur doit encore valider ce lot avant le flux logistique.' };
    }
    return { title: 'Supervision', body: 'Lot conforme au workflow courant. Suivez les comptes et les etapes suivantes.' };
  }

  if (role === 'regulator') {
    if (lot.status === 'SUSPECT') {
      return { title: 'Alerte DGMR', body: 'Lot suspect : verifier les donnees labo et bloquer la suite tant que le doute persiste.' };
    }
    if (!lot.regulatorValidated && lot.analyzedAt) {
      return { title: 'Action attendue', body: 'Comparer les analyses producteur et DGMR puis valider ou bloquer ce lot.' };
    }
    return { title: 'Lot deja traite', body: 'La validation DGMR est deja enregistree pour ce lot.' };
  }

  if (role === 'transporter') {
    if (isTransportReady(lot) && !lot.transportStatus) {
      return { title: 'Pret a prendre en charge', body: 'Le lot est certifie et valide DGMR. Il peut etre pris en charge pour le transport.' };
    }
    if (lot.transportStatus === 'en_route') {
      return { title: 'Transport en cours', body: 'Le lot est actuellement en route vers sa destination finale.' };
    }
    if (lot.transportStatus === 'delivered') {
      return { title: 'Livraison terminee', body: 'Le lot a deja ete livre et reste disponible pour consultation historique.' };
    }
    return { title: 'Transport bloque', body: 'Ce lot ne peut pas etre transporte tant que la validation DGMR n est pas terminee.' };
  }

  if (lot.status === 'SUSPECT') {
    return { title: 'Certification bloquee', body: 'Le lot a ete marque suspect. Attendez la revue regulatoire avant toute suite.' };
  }
  if (!lot.regulatorValidated && lot.tokenId != null) {
    return { title: 'En attente DGMR', body: 'Le NFT existe, mais le lot attend encore la validation du regulateur.' };
  }
  if (lot.transportStatus === 'en_route') {
    return { title: 'Transport actif', body: 'Votre lot est actuellement en cours d acheminement.' };
  }
  return { title: 'Suivi producteur', body: 'Consultez les etapes blockchain, DGMR et transport depuis cette fiche lot.' };
}
