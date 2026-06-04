import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, syllabusAPI, studyPlansAPI } from '../services/api';
import { Upload, FileText, CheckCircle, Loader, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SyllabusUpload() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.list();
      setCourses(response.data.results || response.data);
    } catch (error) { toast.error('Failed to load courses'); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedCourse) {
      toast.error('Please select a course and file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('course', selectedCourse);
      formData.append('file', file);
      const response = await syllabusAPI.upload(formData);
      toast.success('Syllabus uploaded!');
      parseSyllabus(response.data.id);
    } catch (error) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const parseSyllabus = async (syllabusId) => {
    setParsing(true);
    try {
      const response = await syllabusAPI.parse(syllabusId);
      setParsedData(response.data.parsed_data);
      toast.success('Syllabus parsed successfully!');
    } catch (error) { toast.error('Parsing failed'); }
    finally { setParsing(false); }
  };

  const generateStudyPlan = async () => {
    if (!parsedData) return;
    setGenerating(true);
    try {
      const exam = parsedData.exams?.[0];
      if (!exam) {
        toast.error('No exams found in syllabus');
        return;
      }
      await studyPlansAPI.generate({
        exam_id: exam.id,
        hours_per_day: 3,
        start_time: '09:00',
      });
      toast.success('Study plan generated!');
      navigate('/study-plans');
    } catch (error) { toast.error('Failed to generate study plan'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Upload Syllabus</h1>
      <p className="text-gray-600">Upload your course syllabus and let AI create a personalized study plan for you.</p>

      <form onSubmit={handleUpload} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input" required>
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus File (PDF)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="file-upload" required />
            <label htmlFor="file-upload" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-primary-600" />
                  <span className="text-gray-900">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload PDF</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <button type="submit" disabled={uploading || parsing} className="w-full btn-primary py-3 disabled:opacity-50">
          {uploading ? 'Uploading...' : parsing ? 'Parsing...' : 'Upload & Parse Syllabus'}
        </button>
      </form>

      {(uploading || parsing) && (
        <div className="card text-center py-8">
          <Loader className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">{uploading ? 'Uploading syllabus...' : 'AI is analyzing your syllabus...'}</p>
        </div>
      )}

      {parsedData && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Parsed Syllabus</h2>
          </div>

          {parsedData.exams?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Exams Found:</h3>
              <div className="space-y-2">
                {parsedData.exams.map((exam, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-lg">
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    {exam.date && <p className="text-sm text-gray-600">Date: {exam.date}</p>}
                    {exam.total_marks && <p className="text-sm text-gray-600">Marks: {exam.total_marks}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.chapters?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Chapters:</h3>
              <div className="space-y-1">
                {parsedData.chapters.map((chapter, i) => (
                  <div key={i} className="p-2 bg-gray-50 rounded">
                    <span className="font-medium">Chapter {chapter.number}:</span> {chapter.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.topics?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Topics:</h3>
              <div className="space-y-1">
                {parsedData.topics.map((topic, i) => (
                  <div key={i} className="p-2 bg-blue-50 rounded">
                    {topic.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={generateStudyPlan} disabled={generating} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
            <Brain className="h-5 w-5" />
            {generating ? 'Generating...' : 'Generate AI Study Plan'}
          </button>
        </div>
      )}
    </div>
  );
}
