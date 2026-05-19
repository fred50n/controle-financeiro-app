import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getGroceryReceipts, deleteGroceryReceipt } from '../../src/services/grocery';

export default function GroceryScreen() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getGroceryReceipts();
      setReceipts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Excluir Recibo', 'Tem certeza que deseja apagar este recibo e todos os seus itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteGroceryReceipt(id);
            loadData();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 50 }} />
      ) : receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum cupom de supermercado lido ainda.</Text>
          <Text style={styles.emptySubtext}>Toque no botão abaixo para escanear seu primeiro cupom!</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.storeName}>{item.store_name}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#e53935" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateTag}>
                {item.date.split('-').reverse().join('/')}
              </Text>
              <View style={styles.divider} />
              
              <Text style={styles.itemsTitle}>
                {item.grocery_items?.length || 0} Itens Comprados:
              </Text>
              
              {item.grocery_items?.map((gItem: any, index: number) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{gItem.quantity}x {gItem.name}</Text>
                  <Text style={styles.itemPrice}>R$ {Number(gItem.price).toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {Number(item.total_amount).toFixed(2)}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/grocery-scan')}
      >
        <Ionicons name="camera" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center', fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  listContent: { padding: 16, gap: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateTag: { fontSize: 12, color: '#888', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  itemsTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { fontSize: 14, color: '#444', flex: 1, paddingRight: 8 },
  itemPrice: { fontSize: 14, color: '#444', fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4CAF50', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }
});
