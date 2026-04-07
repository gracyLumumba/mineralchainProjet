function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function isTransportReady(lot) {
  return lot.status === 'AUTHENTIQUE' && lot.regulatorValidated === true;
}

export function filterLotsForRole(lots = [], session = null) {
  const role = session?.role || 'producer';
  const sessionId = normalizeText(session?.id);
  const sessionUsername = normalizeText(session?.username);

  if (role === 'admin') {
    return lots;
  }

  if (role === 'producer') {
    return lots.filter((lot) => {
      const ownerId = normalizeText(lot.ownerUserId);
      const ownerUsername = normalizeText(lot.ownerUsername);

      if (ownerId || ownerUsername) {
        return ownerId === sessionId || ownerUsername === sessionUsername;
      }

      return normalizeText(lot.site) === normalizeText(session?.site);
    });
  }

  if (role === 'regulator') {
    return lots.filter((lot) =>
      Boolean(lot.analyzedAt)
      || Boolean(lot.tokenId)
      || lot.status === 'SUSPECT'
      || lot.regulatorValidated === true
    );
  }

  if (role === 'transporter') {
    return lots.filter((lot) =>
      isTransportReady(lot)
      || lot.transportStatus === 'en_route'
      || lot.transportStatus === 'delivered'
    );
  }

  return [];
}

export function canRoleOpenLot(session = null, lot = null) {
  if (!lot) {
    return false;
  }

  return filterLotsForRole([lot], session).length > 0;
}
