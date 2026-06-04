import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { coursesAPI } from '../services/api';

export default function CoursesScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.list();
      setCourses(response.data.results || response.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleEnroll = async (courseId) => {
    try {
      await coursesAPI.enroll(courseId);
      fetchCourses();
    } catch (error) { console.error(error); }
  };

  const renderCourse = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.code}>{item.code}</Text>
        <Text style={styles.semester}>{item.semester}</Text>
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.description || 'No description'}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.enrolled}>{item.enrollment_count} enrolled</Text>
        <TouchableOpacity style={styles.enrollBtn} onPress={() => handleEnroll(item.id)}>
          <Text style={styles.enrollBtnText}>Enroll</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Courses</Text>
      <FlatList data={courses} renderItem={renderCourse} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  list: { paddingBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  code: { fontSize: 14, fontWeight: '600', color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  semester: { fontSize: 12, color: '#6B7280' },
  name: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  enrolled: { fontSize: 12, color: '#9CA3AF' },
  enrollBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  enrollBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
