import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, addCategory, deleteCategory } from '../src/services/categories';
import { useFocusEffect } from 'expo-router';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    const updated = await addCategory(newCategory.trim());
    setCategories(updated);
    setNewCategory('');
  };

  const handleDelete = (category: string) => {
    Alert.alert('Excluir Categoria', `Tem certeza que deseja apagar "${category}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
          const updated = await deleteCategory(category);
          setCategories(updated);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nova categoria..."
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>ADICIONAR</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.categoryText}>{item}</Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={24} color="#e53935" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  addButton: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  list: {
    padding: 16,
    gap: 10
  },
  card: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  deleteBtn: {
    padding: 4
  }
});
