import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { setupPushNotifications } from '../src/services/notifications';

export default function Layout() {
  useEffect(() => {
    // Solicita permissão e salva o token no banco de dados silenciosamente
    setupPushNotifications().catch(console.error);
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Nova Despesa', presentation: 'modal' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Despesa', presentation: 'modal' }} />
      <Stack.Screen name="categories" options={{ title: 'Categorias', presentation: 'modal' }} />
      <Stack.Screen name="grocery-scan" options={{ title: 'Ler Cupom Fiscal', presentation: 'modal' }} />
    </Stack>
  );
}
