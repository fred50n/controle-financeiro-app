import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { analyzeReceiptImage, saveGroceryReceipt, GroceryReceipt, GroceryItem } from '../src/services/grocery';

export default function GroceryScanScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<{ store_name: string; items: GroceryItem[]; total_amount: number } | null>(null);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Precisamos de acesso à sua câmera para escanear o cupom.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true, // Essencial para a API do Gemini
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].base64);
    }
  };

  const processImage = async (base64Image: string) => {
    setLoading(true);
    setParsedData(null);
    try {
      const data = await analyzeReceiptImage(base64Image);
      setParsedData(data);
    } catch (error: any) {
      Alert.alert('Erro na Leitura', error.message || 'Não foi possível ler o cupom. Tente tirar uma foto mais nítida focando nos produtos.');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;
    setSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const receiptData: Omit<GroceryReceipt, 'id' | 'grocery_items'> = {
        store_name: parsedData.store_name,
        date: todayDate,
        total_amount: parsedData.total_amount
      };
      
      await saveGroceryReceipt(receiptData, parsedData.items);
      Alert.alert('Sucesso', 'Compras do supermercado salvas com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro de Conexão', 'Não foi possível salvar no banco de dados. Verifique a internet e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {!image && !loading && (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.title}>Escanear Cupom Fiscal</Text>
          <Text style={styles.subtitle}>Tire uma foto bem iluminada focando na lista de produtos e no total.</Text>
          <TouchableOpacity style={styles.camBtn} onPress={takePicture}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.camBtnText}>Abrir Câmera</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size={64} color="#4CAF50" />
          <Text style={styles.loadingTitle}>Analisando Cupom...</Text>
          <Text style={styles.loadingText}>A IA do Google está lendo os produtos. Isso leva cerca de 5 a 10 segundos.</Text>
        </View>
      )}

      {parsedData && !loading && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.resultTitle}>Revise os Dados Encontrados</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Mercado</Text>
            <Text style={styles.storeName}>{parsedData.store_name}</Text>
            
            <Text style={styles.label}>Itens Encontrados ({parsedData.items?.length || 0})</Text>
            {parsedData.items?.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                <Text style={styles.itemPrice}>R$ {Number(item.price).toFixed(2)}</Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Lido</Text>
              <Text style={styles.totalValue}>R$ {Number(parsedData.total_amount).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={takePicture} disabled={saving}>
              <Text style={styles.retakeBtnText}>Tentar Novamente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>SALVAR COMPRA</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 32, lineHeight: 24 },
  camBtn: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 32, alignItems: 'center', gap: 12, elevation: 2 },
  camBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 24 },
  loadingText: { marginTop: 8, fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  resultContainer: { padding: 16 },
  resultTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  label: { fontSize: 14, color: '#888', fontWeight: 'bold', marginTop: 16, marginBottom: 4, textTransform: 'uppercase' },
  storeName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemName: { fontSize: 16, color: '#444', flex: 1, paddingRight: 8 },
  itemPrice: { fontSize: 16, color: '#444', fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#eee' },
  totalLabel: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  retakeBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#e0e0e0', alignItems: 'center' },
  retakeBtnText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#4CAF50', alignItems: 'center', elevation: 2 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
