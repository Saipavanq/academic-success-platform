import { useState, useEffect, useRef } from 'react';
import { coursesAPI } from '../services/api';
import { Plus, Users, BookOpen, Upload, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.list();
      setCourses(response.data.results || response.data);
    } catch (error) { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  const handleEnroll = async (courseId) => {
    try {
      await coursesAPI.enroll(courseId);
      toast.success('Enrolled!');
      fetchCourses();
    } catch (error) { toast.error(error.response?.data?.error || 'Enrollment failed'); }
  };

  const handleUnenroll = async (courseId) => {
    try {
      await coursesAPI.unenroll(courseId);
      toast.success('Unenrolled');
      fetchCourses();
    } catch (error) { toast.error('Failed to unenroll'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) { toast.error('Course name is required'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('code', code || name.substring(0, 10).toUpperCase());
      if (file) formData.append('file', file);

      const response = await coursesAPI.createWithSyllabus(formData);
      toast.success(response.data.message || 'Course created!');
      setName('');
      setCode('');
      setFile(null);
      setShowModal(false);
      fetchCourses();
    } catch (error) {
      toast.error('Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {courses.length === 0 && !showModal ? (
        <div className="text-center py-16">
          <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Add your first course. You can upload the syllabus PDF to auto-detect exam dates and topics.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-lg px-8 py-3">
            + Add Your First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-mono bg-primary-100 text-primary-700 px-2 py-1 rounded">{course.code}</span>
                <span className="text-sm text-gray-500">{course.semester}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" /> {course.enrollment_count} enrolled
                </div>
                {course.is_enrolled ? (
                  <button onClick={() => handleUnenroll(course.id)} className="btn-secondary text-sm px-3 py-1">
                    Enrolled
                  </button>
                ) : (
                  <button onClick={() => handleEnroll(course.id)} className="btn-primary text-sm px-3 py-1">
                    Enroll
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Add Course</h2>
            <p className="text-gray-500 text-sm mb-6">Upload your syllabus PDF to auto-fill course details and generate a study plan.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Machine Learning"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., CS101 (auto-generated if empty)"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus PDF (optional)</label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-primary-600" />
                      <span className="text-gray-900 font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">Click to upload PDF syllabus</p>
                      <p className="text-gray-400 text-xs mt-1">AI will parse exams, topics & dates</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFile(null); setName(''); setCode(''); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> {file ? 'Create & Parse Syllabus' : 'Create Course'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
