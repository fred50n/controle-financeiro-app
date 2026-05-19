import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_KEY = '@categories';
const DEFAULT_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Outros'];

export const getCategories = async (): Promise<string[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  } catch (e) {
    console.error('Error reading categories', e);
    return DEFAULT_CATEGORIES;
  }
};

export const addCategory = async (category: string): Promise<string[]> => {
  try {
    const currentCategories = await getCategories();
    // Previne duplicadas ignorando case
    if (currentCategories.some(c => c.toLowerCase() === category.toLowerCase())) {
        return currentCategories;
    }
    const updated = [...currentCategories, category];
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving category', e);
    return [];
  }
};

export const deleteCategory = async (category: string): Promise<string[]> => {
  try {
    const currentCategories = await getCategories();
    const updated = currentCategories.filter(c => c !== category);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error deleting category', e);
    return [];
  }
};
