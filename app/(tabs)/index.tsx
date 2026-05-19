import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getPendingExpenses, markAsPaid, markAsPending, deleteExpense } from '../../src/services/expenses';
import { formatISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import ActionModal from '../../src/components/ActionModal';

export default function Home() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const todayStr = formatISO(new Date(), { representation: 'date' });
      const data = await getPendingExpenses(todayStr);
      setExpenses(data || []);
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

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markAsPaid(id);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível marcar como pago.');
    }
  };

  const handleMarkAsPending = async (id: string) => {
    try {
      await markAsPending(id);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível voltar para pendente.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir Despesa', 'Tem certeza que deseja apagar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await deleteExpense(id);
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
        <ActivityIndicator size="large" color="#0000ff" />
      ) : expenses.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma despesa pendente para hoje! 🎉</Text>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => {
                setSelectedExpense(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.amount}>R$ {item.amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.description}>{item.description || 'Sem descrição'}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.typeTag}>{item.type}</Text>
                {/* Botões ocultos - acionados pelo clique no card */}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <ActionModal
        visible={modalVisible}
        isPending={selectedExpense?.status === 'pendente'}
        onClose={() => setModalVisible(false)}
        onToggleStatus={() => {
          setModalVisible(false);
          if (selectedExpense) {
            if (selectedExpense.status === 'pendente') {
              handleMarkAsPaid(selectedExpense.id);
            } else {
              handleMarkAsPending(selectedExpense.id);
            }
          }
        }}
        onEdit={() => {
          setModalVisible(false);
          if (selectedExpense) router.push(`/edit?id=${selectedExpense.id}`);
        }}
        onDelete={() => {
          setModalVisible(false);
          if (selectedExpense) handleDelete(selectedExpense.id);
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666'
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  category: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53935'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeTag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionBtn: {
    padding: 4
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6200ee',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300'
  }
});
