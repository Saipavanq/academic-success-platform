import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { goalsAPI } from '../services/api';

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', target_date: '', target_marks: '' });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.list();
      setGoals(response.data.results || response.data);
    } catch (error) { console.error(error); }
  };

  const handleCreate = async () => {
    try {
      await goalsAPI.create({ ...form, goal_type: 'exam_score' });
      setModalVisible(false);
      setForm({ title: '', target_date: '', target_marks: '' });
      fetchGoals();
    } catch (error) { console.error(error); }
  };

  const handleProgress = async (goalId, progress) => {
    try {
      await goalsAPI.updateProgress(goalId, progress);
      fetchGoals();
    } catch (error) { console.error(error); }
  };

  const renderGoal = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[styles.statusBadge, item.status === 'achieved' && styles.achieved]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{item.target_date} | {item.target_marks || '-'} marks</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress}%</Text>
      </View>

      {item.status === 'active' && (
        <View style={styles.progressBtns}>
          {[25, 50, 75, 100].map((p) => (
            <TouchableOpacity key={p} style={styles.progressBtn} onPress={() => handleProgress(item.id, p)}>
              <Text style={styles.progressBtnText}>{p}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={goals} renderItem={renderGoal} keyExtractor={(item) => item.id} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Goal</Text>
            <TextInput style={styles.input} placeholder="Goal Title" value={form.title} onChangeText={(v) => setForm({...form, title: v})} />
            <TextInput style={styles.input} placeholder="Target Date (YYYY-MM-DD)" value={form.target_date} onChangeText={(v) => setForm({...form, target_date: v})} />
            <TextInput style={styles.input} placeholder="Target Marks" value={form.target_marks} onChangeText={(v) => setForm({...form, target_marks: v})} keyboardType="numeric" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statusBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  achieved: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, color: '#1E40AF', fontWeight: '600' },
  meta: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  progressBtns: { flexDirection: 'row', gap: 8 },
  progressBtn: { flex: 1, paddingVertical: 6, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, alignItems: 'center' },
  progressBtnText: { fontSize: 12, color: '#4F46E5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  createBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#4F46E5', alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '600' },
});
