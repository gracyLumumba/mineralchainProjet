import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreferences } from '../../contexts/PreferencesContext';
import { ROUTES } from '../../navigation/routes';

function getMenuItems(role, t) {
  const common = [
    { key: ROUTES.DASHBOARD, label: t('menu_home'), icon: 'home-outline' },
    { key: ROUTES.LOTS, label: t('menu_lots'), icon: 'package-variant-closed' },
  ];

  if (role === 'producer') {
    return [
      ...common,
      { key: ROUTES.PRODUCER_MENU, label: t('menu_production'), icon: 'pickaxe' },
      { key: ROUTES.CERTIFY, label: t('menu_certify'), icon: 'certificate-outline' },
    ];
  }
  if (role === 'regulator') {
    return [
      ...common,
      { key: ROUTES.REGULATOR, label: t('menu_supervision'), icon: 'shield-check-outline' },
      { key: ROUTES.REGULATOR_DASHBOARD, label: t('menu_dashboard'), icon: 'chart-bar' },
      { key: ROUTES.REGULATOR_ANALYSIS, label: t('menu_analysis'), icon: 'magnify' },
      { key: ROUTES.REGULATOR_ALERTS, label: t('menu_alerts'), icon: 'bell-outline' },
      { key: ROUTES.REGULATOR_LOTS, label: t('menu_all_lots'), icon: 'format-list-bulleted' },
    ];
  }
  if (role === 'transporter') {
    return [
      ...common,
      { key: ROUTES.TRANSPORTER_MENU, label: t('menu_transport'), icon: 'truck-outline' },
      { key: ROUTES.TRANSPORTER_SCANNER, label: 'Scanner QR', icon: 'qrcode-scan' },
    ];
  }
  if (role === 'admin') {
    return [
      ...common,
      { key: ROUTES.ADMIN_MENU, label: t('menu_admin'), icon: 'cog-outline' },
    ];
  }
  return common;
}

export default function DrawerMenu({ visible, onClose, onNavigate, onLogout, session }) {
  const { colors, t } = usePreferences();
  const items = getMenuItems(session?.role, t);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.drawer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
              <Text style={styles.avatarText}>{(session?.name || 'U').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.name, { color: colors.text }]}>{session?.name}</Text>
              <Text style={[styles.role, { color: colors.muted }]}>{session?.role}</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.cardAlt }]}>
              <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.items}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => { onClose(); onNavigate(item.key); }}
                style={({ pressed }) => [
                  styles.item,
                  { borderColor: colors.border },
                  pressed && { backgroundColor: colors.cardAlt },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color={colors.brand} />
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.muted} style={styles.chevron} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => { onClose(); onLogout(); }}
            style={[styles.logoutBtn, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.errorText} />
            <Text style={[styles.logoutText, { color: colors.errorText }]}>{t('logout')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },
  drawer: {
    width: 290,
    minHeight: '100%',
    borderRightWidth: 1,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
  },
  role: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
  },
  items: {
    paddingHorizontal: 12,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 0,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
