import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { dashboardAPI } from '../services/api';

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const response = await dashboardAPI.getStudent();
      setData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (!data) return <View style={styles.loading}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.stats.total_courses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.stats.total_upcoming_exams}</Text>
          <Text style={styles.statLabel}>Exams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.stats.total_active_plans}</Text>
          <Text style={styles.statLabel}>Plans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{data.stats.total_active_goals}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Upcoming Exams</Text>
      {data.upcoming_exams.map((exam) => (
        <View key={exam.id} style={styles.card}>
          <Text style={styles.cardTitle}>{exam.title}</Text>
          <Text style={styles.cardSubtitle}>{exam.course_code} - {exam.exam_type}</Text>
          <Text style={styles.cardMeta}>{exam.date} | {exam.days_until === 0 ? 'Today!' : `${exam.days_until} days`}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Today's Tasks</Text>
      {data.today_tasks.map((task) => (
        <View key={task.id} style={styles.card}>
          <Text style={styles.cardTitle}>{task.topic}</Text>
          <Text style={styles.cardSubtitle}>{task.course_code} | {task.duration_minutes} mins</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#374151' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
