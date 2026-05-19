import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionModalProps {
  visible: boolean;
  isPending: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ActionModal({ visible, isPending, onClose, onToggleStatus, onEdit, onDelete }: ActionModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Opções da Despesa</Text>
          
          <TouchableOpacity style={styles.btn} onPress={onToggleStatus}>
            <Ionicons name={isPending ? "checkmark-circle-outline" : "arrow-undo-outline"} size={24} color={isPending ? "#4CAF50" : "#FF9800"} />
            <Text style={[styles.btnText, { color: isPending ? "#4CAF50" : "#FF9800" }]}>
              {isPending ? 'Marcar como Paga' : 'Voltar para Pendente'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={24} color="#666" />
            <Text style={styles.btnText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color="#e53935" />
            <Text style={[styles.btnText, { color: '#e53935' }]}>Excluir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333'
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 16
  },
  btnText: {
    fontSize: 16,
    color: '#333'
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666'
  }
});
