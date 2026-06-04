import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { studyPlansAPI } from '../services/api';

export default function StudyPlansScreen() {
  const [plans, setPlans] = useState([]);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const response = await studyPlansAPI.list();
      setPlans(response.data.results || response.data);
    } catch (error) { console.error(error); }
  };

  const handleCompleteTask = async (planId, taskId) => {
    try {
      await studyPlansAPI.completeTask(planId, taskId);
      fetchPlans();
    } catch (error) { console.error(error); }
  };

  const renderPlan = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.course_code} - {item.exam_title}</Text>
      <Text style={styles.dates}>{item.start_date} to {item.end_date}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress_percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{item.progress_percentage}%</Text>
      </View>

      {item.tasks?.slice(0, 3).map((task) => (
        <View key={task.id} style={styles.task}>
          <View style={[styles.taskIndicator, task.status === 'completed' && styles.completed]} />
          <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, task.status === 'completed' && styles.completedText]}>{task.topic}</Text>
            <Text style={styles.taskMeta}>{task.scheduled_date} | {task.duration_minutes} mins</Text>
          </View>
          {task.status !== 'completed' && (
            <TouchableOpacity onPress={() => handleCompleteTask(item.id, task.id)}>
              <Text style={styles.completeBtn}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Study Plans</Text>
      <FlatList data={plans} renderItem={renderPlan} keyExtractor={(item) => item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dates: { fontSize: 12, color: '#9CA3AF', marginTop: 2, marginBottom: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  task: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 4 },
  taskIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginRight: 8 },
  completed: { backgroundColor: '#10B981' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
  completedText: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskMeta: { fontSize: 12, color: '#9CA3AF' },
  completeBtn: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
});
