import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getExpenseById, updateExpense } from '../src/services/expenses';
import { getCategories } from '../src/services/categories';

export default function EditExpense() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories);
    }, [])
  );

  useEffect(() => {
    const loadExpense = async () => {
      if (!id) return;
      try {
        const data = await getExpenseById(id as string);
        if (data) {
          setAmount(data.amount.toString());
          setCategory(data.category);
          setDescription(data.description || '');
          // Parse data sem problemas de fuso horário
          const parsedDate = parseISO(data.due_date);
          const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
          setDueDate(localDate);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a despesa.');
        router.back();
      } finally {
        setLoadingData(false);
      }
    };
    loadExpense();
  }, [id]);

  const handleSave = async () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Erro', 'A categoria não pode ser vazia.');
      return;
    }

    setSaving(true);
    try {
      await updateExpense(id as string, {
        amount: val,
        category,
        description,
        due_date: dueDate,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao salvar a despesa.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Categoria</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowCategoryPicker(true)}
      >
        <Text style={{ fontSize: 16, color: category ? '#333' : '#999' }}>
          {category || 'Selecione uma categoria'}
        </Text>
      </TouchableOpacity>

      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha a Categoria</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.manageBtn}
              onPress={() => {
                setShowCategoryPicker(false);
                router.push('/categories');
              }}
            >
              <Text style={styles.manageBtnText}>+ Gerenciar Categorias</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        placeholder="Opcional"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Data de Vencimento</Text>
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ fontSize: 16, color: '#333' }}>
          {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa'
  },
  saveButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  saveButtonDisabled: {
    opacity: 0.7
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalItemText: {
    fontSize: 16,
    color: '#333'
  },
  manageBtn: {
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center'
  },
  manageBtnText: {
    color: '#6200ee',
    fontWeight: 'bold',
    fontSize: 16
  },
  cancelBtn: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  cancelBtnText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 16
  }
});
