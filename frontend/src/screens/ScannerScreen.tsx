import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../theme';
import { scannerApi } from '../api/wines';

export const ScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>Camera access needed to scan wine labels</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || scanning) return;
    setScanned(true);
    setScanning(true);
    try {
      const result = await scannerApi.scanBarcode(data);
      if (result.found && result.wine) {
        navigation.navigate('WineDetail', { wineId: result.wine.id });
      } else {
        Alert.alert('Wine not found', 'This wine is not in our database yet.', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert('Scan failed', 'Please try again.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr'] }}
      />
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          {scanning ? (
            <ActivityIndicator color={theme.colors.white} size="large" />
          ) : (
            <Text style={styles.hint}>Point camera at wine label or barcode</Text>
          )}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const OVERLAY_COLOR = 'rgba(0,0,0,0.55)';
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  permText: { fontSize: theme.fontSize.md, textAlign: 'center', color: theme.colors.text, marginBottom: theme.spacing.lg },
  btn: { backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: theme.borderRadius.full },
  btnText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
  overlay: { ...StyleSheet.absoluteFillObject },
  topOverlay: { flex: 1, backgroundColor: OVERLAY_COLOR },
  middleRow: { flexDirection: 'row', height: 240 },
  sideOverlay: { flex: 1, backgroundColor: OVERLAY_COLOR },
  scanWindow: { width: 280, borderRadius: 4, overflow: 'hidden' },
  bottomOverlay: { flex: 1, backgroundColor: OVERLAY_COLOR, alignItems: 'center', justifyContent: 'center', gap: 20 },
  hint: { color: '#fff', fontSize: theme.fontSize.md, textAlign: 'center', paddingHorizontal: theme.spacing.xl },
  cancelBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
  cancelText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
