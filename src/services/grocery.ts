import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GroceryItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface GroceryReceipt {
  id?: string;
  store_name: string;
  date: string;
  total_amount: number;
  grocery_items?: GroceryItem[];
}

export const getGroceryReceipts = async () => {
  const { data, error } = await supabase
    .from('grocery_receipts')
    .select('*, grocery_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const saveGroceryReceipt = async (receipt: Omit<GroceryReceipt, 'id' | 'grocery_items'>, items: GroceryItem[]) => {
  // Insert Receipt
  const { data: receiptData, error: receiptError } = await supabase
    .from('grocery_receipts')
    .insert({
      store_name: receipt.store_name,
      date: receipt.date,
      total_amount: receipt.total_amount
    })
    .select()
    .single();

  if (receiptError) throw receiptError;

  if (items && items.length > 0) {
    // Prepare Items
    const itemsToInsert = items.map(item => ({
      receipt_id: receiptData.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1
    }));

    const { error: itemsError } = await supabase
      .from('grocery_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }

  return receiptData;
};

export const deleteGroceryReceipt = async (id: string) => {
  const { error } = await supabase
    .from('grocery_receipts')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const analyzeReceiptImage = async (base64Image: string): Promise<{ store_name: string, items: GroceryItem[], total_amount: number }> => {
  const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("Chave da API do Gemini (EXPO_PUBLIC_GEMINI_API_KEY) não configurada no arquivo .env");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Você é um assistente especialista em ler notas fiscais e cupons de supermercado no Brasil.
Analise a imagem deste cupom fiscal e extraia os dados.
Me devolva ESTREITAMENTE um JSON no formato abaixo. NÃO adicione a palavra "json" e não envolva em \`\`\`. Retorne APENAS a chave com os valores:
{
  "store_name": "Nome do Mercado",
  "total_amount": 105.50,
  "items": [
    { "name": "Arroz 5kg", "price": 25.90, "quantity": 1 },
    { "name": "Feijao", "price": 8.50, "quantity": 2 }
  ]
}
O valor numérico do price deve usar ponto para decimais e sem o símbolo R$.
Tente ler o máximo de itens possíveis que estiverem nítidos no cupom.`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: "image/jpeg",
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const textResponse = result.response.text();
    
    // Limpar formatação markdown que a IA pode mandar
    const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJsonStr);
    return parsed;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.status === 429) {
      throw new Error("Muitas requisições ao Google. Tente novamente em alguns segundos.");
    }
    
    throw new Error("Falha ao se comunicar com a IA do Google. Verifique sua chave de API.");
  }
};
