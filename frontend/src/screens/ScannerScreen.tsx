import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '../theme';
import { scannerApi } from '../api/wines';
import { Wine } from '../types';

export const ScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [suggestions, setSuggestions] = useState<Wine[]>([]);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.permText}>Для сканирования этикеток необходим доступ к камере</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Разрешить доступ</Text>
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
        Alert.alert('Вино не найдено', 'Этого вина пока нет в нашей базе.', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert('Ошибка сканирования', 'Попробуйте ещё раз.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setScanning(false);
    }
  };

  const handleScanLabel = async () => {
    if (scanning || !cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (!photo?.base64) throw new Error('No image data');

      const result = await scannerApi.scan(photo.base64);

      if (result.found && result.wine) {
        navigation.navigate('WineDetail', { wineId: result.wine.id });
      } else {
        setSuggestedName(result.suggestedName ?? null);
        setSuggestions(result.suggestions ?? []);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось обработать фото. Попробуйте ещё раз.', [{ text: 'OK' }]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
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
            <Text style={styles.hint}>Наведите камеру на этикетку или штрихкод</Text>
          )}
          <TouchableOpacity
            style={[styles.captureBtn, scanning && styles.captureBtnDisabled]}
            onPress={handleScanLabel}
            disabled={scanning}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <Text style={styles.captureHint}>Нажмите для сканирования этикетки</Text>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Suggestions modal */}
      <Modal
        visible={suggestions.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setSuggestions([])}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Вино не найдено</Text>
            {suggestedName ? (
              <Text style={styles.modalSubtitle}>Распознано: «{suggestedName}»</Text>
            ) : null}
            <Text style={styles.modalHint}>Возможно, вы имели в виду:</Text>
            <FlatList
              data={suggestions}
              keyExtractor={w => w.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionRow}
                  onPress={() => {
                    setSuggestions([]);
                    navigation.navigate('WineDetail', { wineId: item.id });
                  }}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.suggestionImg} />
                  ) : (
                    <View style={[styles.suggestionImg, styles.suggestionImgPlaceholder]}>
                      <Text style={styles.suggestionImgEmoji}>🍷</Text>
                    </View>
                  )}
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{item.name} {item.vintage ?? ''}</Text>
                    {item.winery ? <Text style={styles.suggestionWinery}>{item.winery.name}</Text> : null}
                    {item.region ? <Text style={styles.suggestionRegion}>{item.region.name}, {item.region.country}</Text> : null}
                    <Text style={styles.suggestionRating}>★ {item.avgRating.toFixed(1)}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSuggestions([])}>
              <Text style={styles.modalCloseTxt}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  captureHint: { color: 'rgba(255,255,255,0.7)', fontSize: theme.fontSize.sm, textAlign: 'center' },
  cancelBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
  cancelText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: theme.spacing.xl, maxHeight: '70%' },
  modalTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, fontStyle: 'italic' },
  modalHint: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm },
  suggestionImg: { width: 52, height: 68, borderRadius: 6, marginRight: theme.spacing.md },
  suggestionImgPlaceholder: { backgroundColor: '#f0e6ea', alignItems: 'center', justifyContent: 'center' },
  suggestionImgEmoji: { fontSize: 24 },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  suggestionWinery: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  suggestionRegion: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 1 },
  suggestionRating: { fontSize: theme.fontSize.sm, color: theme.colors.primary, marginTop: 4 },
  separator: { height: 1, backgroundColor: theme.colors.border },
  modalCloseBtn: { marginTop: theme.spacing.lg, alignItems: 'center', paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.surface },
  modalCloseTxt: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
