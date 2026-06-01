import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenShell from '../components/ScreenShell';
import PageHeader from '../components/PageHeader';
import { usePreferences } from '../../contexts/PreferencesContext';

function extractQrCandidates(raw) {
  const text = String(raw || '').trim();
  const values = new Set([text]);

  try {
    const url = new URL(text);
    const lot = url.searchParams.get('lot') || url.searchParams.get('lot_id');
    const token = url.searchParams.get('token') || url.searchParams.get('token_id');
    if (lot) values.add(lot);
    if (token) values.add(token);
    url.pathname.split('/').filter(Boolean).forEach((part) => values.add(decodeURIComponent(part)));
  } catch (error) {
    void error;
  }

  const lotMatch = text.match(/[A-Z]{2,}-\d{4}-\d{3,}/i);
  if (lotMatch) values.add(lotMatch[0].toUpperCase());

  const tokenMatch = text.match(/(?:token|nft|#)\s*#?(\d+)/i);
  if (tokenMatch) values.add(tokenMatch[1]);

  return [...values].filter(Boolean);
}

function findLotFromScan(lots, raw) {
  const candidates = extractQrCandidates(raw);
  return lots.find((lot) =>
    candidates.some((value) =>
      lot.id === value ||
      String(lot.tokenId) === value ||
      String(lot.certificateId) === value
    )
  );
}

export default function TransporterScannerScreen({ lots = [], isRefreshing, refresh, onOpenLot }) {
  const { colors } = usePreferences();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [message, setMessage] = useState('');

  const transportLots = useMemo(
    () => lots.filter((lot) => lot.regulatorValidated || lot.transportStatus),
    [lots],
  );

  const openScannedLot = (raw) => {
    const lot = findLotFromScan(lots, raw);
    if (!lot) {
      setMessage('Lot introuvable dans le registre synchronise.');
      setScanLocked(false);
      return;
    }
    onOpenLot(lot.id);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanLocked) return;
    setScanLocked(true);
    setMessage(`QR detecte: ${String(data || '').slice(0, 60)}`);
    openScannedLot(data);
  };

  const handleManualSearch = () => {
    if (!manualInput.trim()) return;
    setScanLocked(true);
    openScannedLot(manualInput);
  };

  const cameraReady = permission?.granted;

  return (
    <ScreenShell onRefresh={refresh} refreshing={isRefreshing}>
      <PageHeader />

      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>Transport QR</Text>
        <Text style={[styles.title, { color: colors.text }]}>Scanner certificat</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Pointez la camera vers le QR du certificat NFT pour ouvrir directement la fiche du lot.
        </Text>
      </View>

      <View style={[styles.scanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cameraBox, { borderColor: cameraReady ? colors.brand : colors.border, backgroundColor: colors.cardAlt }]}>
          {cameraReady ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <MaterialCommunityIcons name="camera-outline" size={46} color={colors.muted} />
              <Text style={[styles.placeholderText, { color: colors.muted }]}>Camera non active</Text>
            </View>
          )}
          <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.accent }]} />
          <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.accent }]} />
        </View>

        {!permission ? (
          <Text style={[styles.hint, { color: colors.muted }]}>Preparation de la camera...</Text>
        ) : !permission.granted ? (
          <>
            <Text style={[styles.hint, { color: colors.muted }]}>
              Autorisez la camera pour scanner les certificats depuis le telephone.
            </Text>
            <Pressable onPress={requestPermission} style={[styles.primaryButton, { backgroundColor: colors.brand }]}>
              <Text style={styles.primaryText}>Autoriser la camera</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.hint, { color: colors.muted }]}>
              {scanLocked ? 'Analyse du QR...' : 'Cadrez le QR code. La lecture est automatique.'}
            </Text>
            <Pressable
              onPress={() => {
                setScanLocked(false);
                setMessage('');
              }}
              style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.cardAlt }]}
            >
              <Text style={[styles.secondaryText, { color: colors.text }]}>Scanner a nouveau</Text>
            </Pressable>
          </>
        )}

        {message ? <Text style={[styles.message, { color: colors.accent }]}>{message}</Text> : null}
      </View>

      <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saisie manuelle</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Utilisez le Lot ID ou le Token si le navigateur mobile ne peut pas lire le QR.
        </Text>
        <TextInput
          value={manualInput}
          onChangeText={setManualInput}
          placeholder="KAMOA-2605-001 ou 1234"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          style={[
            styles.input,
            { backgroundColor: colors.input, borderColor: colors.inputBorder, color: colors.text },
          ]}
        />
        <Pressable onPress={handleManualSearch} style={[styles.primaryButton, { backgroundColor: colors.brand }]}>
          <Text style={styles.primaryText}>Verifier le lot</Text>
        </Pressable>
      </View>

      <View style={[styles.countCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="truck-check-outline" size={20} color={colors.accent} />
        <Text style={[styles.countText, { color: colors.text }]}>
          {transportLots.length} lot{transportLots.length > 1 ? 's' : ''} accessible{transportLots.length > 1 ? 's' : ''} au transporteur
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  scanCard: { borderRadius: 24, borderWidth: 1, gap: 14, padding: 16 },
  cameraBox: {
    alignSelf: 'center',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  cameraPlaceholder: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  placeholderText: { fontSize: 13, fontWeight: '700' },
  corner: { height: 28, position: 'absolute', width: 28 },
  cornerTopLeft: { borderLeftWidth: 3, borderTopWidth: 3, left: 14, top: 14 },
  cornerTopRight: { borderRightWidth: 3, borderTopWidth: 3, right: 14, top: 14 },
  cornerBottomLeft: { borderBottomWidth: 3, borderLeftWidth: 3, bottom: 14, left: 14 },
  cornerBottomRight: { borderBottomWidth: 3, borderRightWidth: 3, bottom: 14, right: 14 },
  hint: { fontSize: 13, lineHeight: 19 },
  primaryButton: { alignItems: 'center', borderRadius: 18, paddingVertical: 14 },
  primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, paddingVertical: 13 },
  secondaryText: { fontSize: 14, fontWeight: '800' },
  message: { fontSize: 12, fontWeight: '800' },
  manualCard: { borderRadius: 24, borderWidth: 1, gap: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  input: { borderRadius: 16, borderWidth: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13 },
  countCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 14 },
  countText: { flex: 1, fontSize: 13, fontWeight: '800' },
});
