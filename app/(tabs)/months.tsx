import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { getExpensesByMonth, markAsPaid, markAsPending, deleteExpense } from '../../src/services/expenses';
import ActionModal from '../../src/components/ActionModal';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthsScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getExpensesByMonth(year, month);
      setExpenses(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Reloads data whenever currentDate changes
  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Resets to current month on tab focus
  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
    }, [])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          handlePrevMonth();
        } else if (gestureState.dx < -50) {
          handleNextMonth();
        }
      },
    })
  ).current;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

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
      { text: 'Excluir', style: 'destructive', onPress: async () => {
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

  const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total do Mês</Text>
        <Text style={styles.summaryValue}>R$ {total.toFixed(2)}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhuma despesa para este mês.</Text>
        </View>
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
                <Text style={styles.amount}>R$ {Number(item.amount).toFixed(2)}</Text>
              </View>
              <Text style={styles.description}>{item.description || 'Sem descrição'}</Text>
              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.statusTag, item.status === 'paga' ? styles.statusPaga : styles.statusPendente]}>
                    {item.status.toUpperCase()}
                  </Text>
                  <Text style={styles.typeTag}>{item.type}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                  <Text style={styles.dateTag}>
                    {item.due_date.split('-').reverse().join('/')}
                  </Text>
                </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  arrowBtn: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: '#6200ee',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 4
  },
  summaryValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    color: '#666',
    fontSize: 16
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53935'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff'
  },
  statusPaga: {
    backgroundColor: '#4CAF50'
  },
  statusPendente: {
    backgroundColor: '#FF9800'
  },
  typeTag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#555'
  },
  dateTag: {
    fontSize: 12,
    color: '#888'
  }
});
