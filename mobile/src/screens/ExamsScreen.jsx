import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { examsAPI } from '../services/api';

export default function ExamsScreen() {
  const [exams, setExams] = useState([]);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const response = await examsAPI.upcoming();
      setExams(response.data);
    } catch (error) { console.error(error); }
  };

  const renderExam = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.badge, item.days_until <= 3 && styles.urgent]}>
        <Text style={[styles.badgeText, item.days_until <= 3 && styles.urgentText]}>
          {item.days_until === 0 ? 'Today!' : `${item.days_until}d`}
        </Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.course_code} - {item.exam_type_display}</Text>
      <Text style={styles.meta}>{item.date} | {item.duration_minutes} mins | {item.total_marks} marks</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upcoming Exams</Text>
      <FlatList data={exams} renderItem={renderExam} keyExtractor={(item) => item.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  urgent: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
  urgentText: { color: '#991B1B' },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
