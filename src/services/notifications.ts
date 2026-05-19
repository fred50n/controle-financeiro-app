import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Define como as notificações devem se comportar quando o app estiver em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupPushNotifications() {
  // Push token só pode ser gerado em dispositivos reais
  if (!Device.isDevice) {
    console.log('Push Notifications só funcionam em dispositivos físicos');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permissão para notificações não concedida!');
    return;
  }

  try {
    // Pega o token único deste celular nos servidores do Expo
    // Nota: É recomendável ter a propriedade "projectId" no app.json para funcionar no EAS Build
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    
    console.log('Push Token Gerado:', token);

    // Salva o token no Supabase. O upsert evita duplicidade caso o token já exista.
    // Requisito: A tabela "device_tokens" deve ter "token" como Chave Primária ou UNIQUE.
    if (token) {
       const { error } = await supabase.from('device_tokens').upsert({ token }, { onConflict: 'token' });
       if (error) {
         console.error('Erro ao salvar token no Supabase:', error.message);
       } else {
         console.log('Token sincronizado com a nuvem!');
       }
    }
  } catch (error) {
    console.error('Erro ao pegar o Push Token:', error);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6200ee',
    });
  }
}
