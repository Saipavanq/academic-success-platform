import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import { examsAPI, studyPlansAPI } from '../services/api';
import {
  CalendarDays, ListTodo, Upload, MapPin, Clock, Building2,
  GraduationCap, BookOpen, Download, AlertCircle, CheckCircle,
  XCircle, ChevronRight, Sparkles, Trophy, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import 'react-calendar/dist/Calendar.css';

const TYPE_COLORS = {
  midterm: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  final: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  quiz: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  practical: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  viva: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  assignment: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
};

function getExamColor(exam) {
  const days = exam.days_until;
  if (days <= 1) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-500' };
  if (days <= 3) return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500' };
  if (days <= 7) return { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500' };
  return { bg: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-500' };
}

function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function groupExams(exams) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today); endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  return {
    today: exams.filter(e => new Date(e.date).toDateString() === today.toDateString()),
    tomorrow: exams.filter(e => new Date(e.date).toDateString() === tomorrow.toDateString()),
    thisWeek: exams.filter(e => {
      const d = new Date(e.date);
      return d > tomorrow && d <= endOfWeek;
    }),
    later: exams.filter(e => new Date(e.date) > endOfWeek),
  };
}

const TAB_ICON_SIZE = 18;

export default function Exams() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(null);

  const [importText, setImportText] = useState('');
  const [parsedImports, setParsedImports] = useState([]);
  const [importing, setImporting] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await examsAPI.list({ limit: 100 });
      const items = res.data.results || res.data;
      setExams(items.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const handleGeneratePlan = async (exam) => {
    setGeneratingPlan(exam.id);
    try {
      const res = await studyPlansAPI.generate({ exam_id: exam.id, hours_per_day: 2, start_time: '09:00' });
      toast.success(`Study plan "${res.data.title}" created!`);
      setTimeout(() => navigate('/study-plans'), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate study plan');
    } finally {
      setGeneratingPlan(null);
    }
  };

  const handleSetReminder = async (exam) => {
    try {
      await examsAPI.setReminder(exam.id, { remind_before_minutes: 1440, channels: ['email', 'push'] });
      toast.success('Reminder set for this exam!');
    } catch {
      toast.error('Failed to set reminder');
    }
  };

  const parseImportText = () => {
    const lines = importText.split('\n').filter(l => l.trim());
    const parsed = lines.map((line, i) => {
      const parts = line.split(',').map(s => s.trim());
      const codeMatch = parts[0]?.match(/^([A-Za-z0-9]+)/);
      const dateMatch = parts.find(p => p.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/));
      const timeMatch = parts.find(p => p.match(/(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?/i));
      const roomMatch = parts.find(p => p.match(/Room|Hall|Lab|Auditorium|[A-Z]\d{2,}/i));
      const typeCode = parts[0]?.toLowerCase().includes('final') ? 'final'
        : parts[0]?.toLowerCase().includes('mid') ? 'midterm'
        : parts[0]?.toLowerCase().includes('quiz') ? 'quiz'
        : parts[0]?.toLowerCase().includes('prac') ? 'practical'
        : parts[0]?.toLowerCase().includes('viva') ? 'viva'
        : 'midterm';

      let dateParsed = null;
      if (dateMatch) {
        const d = dateMatch.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
        if (d) dateParsed = `${d[3]}-${d[1].padStart(2, '0')}-${d[2].padStart(2, '0')}`;
      }

      let timeParsed = null;
      if (timeMatch) {
        const t = timeMatch.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
        if (t) {
          let h = parseInt(t[1]), m = t[2];
          if (t[3]?.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (t[3]?.toUpperCase() === 'AM' && h === 12) h = 0;
          timeParsed = `${String(h).padStart(2, '0')}:${m}`;
        }
      }

      return {
        index: i, raw: line,
        course_code: codeMatch ? codeMatch[1] : '',
        title: parts[0] || '',
        exam_type: typeCode,
        date: dateParsed || '',
        time: timeParsed || '',
        location: roomMatch || '',
        building: '',
        room_number: roomMatch?.replace(/Room|Hall|Lab|Auditorium\s*/i, '') || '',
      };
    });
    setParsedImports(parsed);
    if (!parsed.length) toast.error('No valid entries found. Format: CourseCode: Title, Date, Time, Room');
  };

  const handleBatchImport = async () => {
    setImporting(true);
    try {
      const payload = parsedImports.map(p => ({
        course_code: p.course_code,
        title: p.title,
        exam_type: p.exam_type,
        date: p.date,
        time: p.time || null,
        location: p.location,
        building: p.building,
        room_number: p.room_number,
      }));
      const res = await examsAPI.batchImport(payload);
      const data = res.data;
      if (data.total_created > 0) toast.success(`${data.total_created} exam(s) created!`);
      if (data.total_errors > 0) toast.error(`${data.total_errors} error(s). Check your course codes.`);
      setImportText('');
      setParsedImports([]);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const examsOnDate = (date) => {
    const ds = date.toISOString().split('T')[0];
    return exams.filter(e => e.date === ds);
  };

  const grouped = groupExams(exams);
  const groups = [
    { key: 'today', label: 'Today', exams: grouped.today, icon: AlertCircle, urgent: true },
    { key: 'tomorrow', label: 'Tomorrow', exams: grouped.tomorrow, icon: ChevronRight, urgent: true },
    { key: 'thisWeek', label: 'This Week', exams: grouped.thisWeek, icon: CalendarDays },
    { key: 'later', label: 'Later', exams: grouped.later, icon: Clock },
  ];

  const examTypeColors = (type) => TYPE_COLORS[type] || TYPE_COLORS.midterm;

  const tabs = [
    { key: 'list', label: 'List View', icon: ListTodo },
    { key: 'calendar', label: 'Calendar', icon: CalendarDays },
    { key: 'import', label: 'Batch Import', icon: Upload },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500 mt-1">Manage your exam schedule</p>
        </div>
        <div className="flex gap-2">
          {exams.filter(e => e.days_until <= 7).length > 0 && (
            <span className="inline-flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-full font-medium">
              <AlertCircle className="w-4 h-4" />
              {exams.filter(e => e.days_until <= 7).length} upcoming
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {activeTab === 'list' && (
            <div className="space-y-6">
              {exams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No exams yet</h3>
                  <p className="text-gray-400 mt-1">Add exams via the Batch Import tab or create a course with a syllabus.</p>
                </div>
              ) : (
                groups.map(group => {
                  if (group.exams.length === 0) return null;
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-2 mb-3">
                        <GroupIcon className={`w-5 h-5 ${group.urgent ? 'text-red-500' : 'text-gray-400'}`} />
                        <h2 className={`text-lg font-semibold ${group.urgent ? 'text-gray-900' : 'text-gray-600'}`}>{group.label}</h2>
                        <span className="text-sm text-gray-400">({group.exams.length})</span>
                      </div>
                      <div className="grid gap-3">
                        {group.exams.map(exam => {
                          const color = getExamColor(exam);
                          const typeColor = examTypeColors(exam.exam_type);
                          return (
                            <div key={exam.id} className={`rounded-xl border p-4 ${color.bg} ${color.bg} transition-shadow hover:shadow-md`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor.bg} ${typeColor.text}`}>
                                      {exam.exam_type_display}
                                    </span>
                                    <span className="text-sm text-gray-500 font-mono">{exam.course_code}</span>
                                  </div>
                                  <h3 className="font-semibold text-gray-900 text-lg">{exam.title}</h3>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="w-3.5 h-3.5" />
                                      {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    {exam.time && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatTime(exam.time)}
                                      </span>
                                    )}
                                    {exam.building && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {exam.building}
                                      </span>
                                    )}
                                    {exam.room_number && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        Room {exam.room_number}
                                      </span>
                                    )}
                                  </div>
                                  {exam.instructions && (
                                    <p className="text-sm text-gray-500 mt-2 italic">{exam.instructions}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${color.badge}`}>
                                    {exam.days_until === 0 ? 'Today!' : `${exam.days_until}d`}
                                  </span>
                                  <div className="flex gap-1">
                                    <button onClick={() => handleSetReminder(exam)}
                                      className="p-2 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-primary-600 transition-colors"
                                      title="Set reminder">
                                      <Bell className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleGeneratePlan(exam)}
                                      disabled={generatingPlan === exam.id}
                                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/80 hover:bg-primary-50 text-gray-600 hover:text-primary-700 transition-colors text-xs font-medium disabled:opacity-50"
                                      title="Generate study plan">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      {generatingPlan === exam.id ? '...' : 'Study Plan'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                tileContent={({ date, view }) => {
                  if (view !== 'month') return null;
                  const dayExams = examsOnDate(date);
                  if (!dayExams.length) return null;
                  return (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {dayExams.slice(0, 3).map(e => (
                        <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${examTypeColors(e.exam_type).dot}`} />
                      ))}
                      {dayExams.length > 3 && <span className="text-[8px] text-gray-400">+{dayExams.length - 3}</span>}
                    </div>
                  );
                }}
                tileClassName={({ date, view }) => {
                  if (view !== 'month') return '';
                  const dayExams = examsOnDate(date);
                  if (!dayExams.length) return '';
                  return 'font-semibold';
                }}
                className="w-full border-0 rounded-xl"
              />
              {calendarDate && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Exams on {calendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  {examsOnDate(calendarDate).length === 0 ? (
                    <p className="text-gray-400 text-sm py-3">No exams on this date</p>
                  ) : (
                    examsOnDate(calendarDate).map(exam => (
                      <div key={exam.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <span className={`w-2.5 h-2.5 rounded-full ${examTypeColors(exam.exam_type).dot}`} />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{exam.title}</span>
                          <span className="text-sm text-gray-500 ml-2">{exam.course_code}</span>
                          {exam.time && <span className="text-sm text-gray-400 ml-2">{formatTime(exam.time)}</span>}
                        </div>
                        {exam.room_number && <span className="text-sm text-gray-500">Room {exam.room_number}</span>}
                        <button onClick={() => handleGeneratePlan(exam)} disabled={generatingPlan === exam.id}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50">
                          {generatingPlan === exam.id ? '...' : 'Study Plan'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900">Batch Import Exams</h3>
                <p className="text-sm text-gray-500 mt-1">Paste one exam per line. Format: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">CourseCode: Title, Date, Time, Room</code></p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 space-y-1">
                <p className="font-medium text-gray-700">Example:</p>
                <code className="block text-xs font-mono text-gray-600">
                  CS301: Midterm Exam, 15/06/2026, 10:00 AM, Room 401{'\n'}
                  CS301: Final Exam, 20/06/2026, 2:00 PM, Room 301{'\n'}
                  MATH201: Final Exam, 22/06/2026, 9:00 AM, Auditorium{'\n'}
                  PHY101: Practical, 18/06/2026, 1:00 PM, Lab 3
                </code>
              </div>

              <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                className="input min-h-[160px] font-mono text-sm" placeholder="Paste your exam timetable here..." />

              <div className="flex gap-3">
                <button onClick={parseImportText} disabled={!importText.trim()}
                  className="btn-secondary px-5 py-2.5 disabled:opacity-50">
                  <Download className="w-4 h-4 mr-1.5 inline" />
                  Parse
                </button>
                {parsedImports.length > 0 && (
                  <button onClick={handleBatchImport} disabled={importing}
                    className="btn-primary px-5 py-2.5 disabled:opacity-50">
                    {importing ? 'Importing...' : `Create ${parsedImports.length} Exam(s)`}
                  </button>
                )}
              </div>

              {parsedImports.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Preview ({parsedImports.length} exams):</h4>
                  <div className="divide-y divide-gray-100 border rounded-xl">
                    {parsedImports.map((p, i) => {
                      const valid = p.course_code && p.date;
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 text-sm ${valid ? 'text-gray-700' : 'text-red-500'}`}>
                          {valid ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                          <span className="font-mono font-medium w-20">{p.course_code || '??'}</span>
                          <span className="flex-1 truncate">{p.title}</span>
                          <span className="text-gray-400">{p.date || '??'}</span>
                          {p.time && <span className="text-gray-400">{p.time}</span>}
                          {p.room_number && <span className="text-gray-400">Room {p.room_number}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}