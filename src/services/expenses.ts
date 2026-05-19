import { supabase } from '../lib/supabase';
import { addMonths, formatISO } from 'date-fns';

export type ExpenseType = 'unica' | 'fixa' | 'parcelada';
export type ExpenseStatus = 'pendente' | 'paga';

export interface ExpenseData {
  due_date: Date;
  amount: number;
  category: string;
  description: string;
  type: ExpenseType;
  status?: ExpenseStatus;
  installments?: number;
}

export const createExpense = async (data: ExpenseData) => {
  const records = [];
  const status = data.status || 'pendente';
  const baseDescription = data.description || '';

  if (data.type === 'unica') {
    records.push({
      due_date: formatISO(data.due_date, { representation: 'date' }),
      amount: data.amount,
      category: data.category,
      description: baseDescription,
      type: data.type,
      status,
    });
  } else if (data.type === 'parcelada') {
    const totalInstallments = data.installments || 1;
    for (let i = 0; i < totalInstallments; i++) {
      const nextDate = addMonths(data.due_date, i);
      records.push({
        due_date: formatISO(nextDate, { representation: 'date' }),
        amount: data.amount,
        category: data.category,
        description: `${baseDescription} (${i + 1}/${totalInstallments})`.trim(),
        type: data.type,
        status,
      });
    }
  } else if (data.type === 'fixa') {
    for (let i = 0; i < 12; i++) {
      const nextDate = addMonths(data.due_date, i);
      records.push({
        due_date: formatISO(nextDate, { representation: 'date' }),
        amount: data.amount,
        category: data.category,
        description: baseDescription,
        type: data.type,
        status,
      });
    }
  }

  const { data: inserted, error } = await supabase.from('expenses').insert(records).select();
  if (error) throw error;
  return inserted;
};

export const getPendingExpenses = async (dateStr: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('status', 'pendente')
    .lte('due_date', dateStr)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getExpensesByMonth = async (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 
    ? `${year + 1}-01-01` 
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('due_date', startDate)
    .lt('due_date', endDate)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
};

export const markAsPaid = async (id: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .update({ status: 'paga' })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};
export const markAsPending = async (id: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .update({ status: 'pendente' })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getExpenseById = async (id: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateExpense = async (id: string, updatesData: Partial<ExpenseData>) => {
  const updates: any = {};
  if (updatesData.amount !== undefined) updates.amount = updatesData.amount;
  if (updatesData.category !== undefined) updates.category = updatesData.category;
  if (updatesData.description !== undefined) updates.description = updatesData.description;
  if (updatesData.due_date) {
    updates.due_date = formatISO(updatesData.due_date, { representation: 'date' });
  }

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return updated;
};
