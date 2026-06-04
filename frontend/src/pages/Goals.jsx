import { useState, useEffect } from 'react';
import { goalsAPI } from '../services/api';
import { Plus, Target, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', goal_type: 'exam_score', target_date: '', target_marks: '' });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.list();
      setGoals(response.data.results || response.data);
    } catch (error) { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await goalsAPI.create(formData);
      toast.success('Goal created!');
      setShowModal(false);
      fetchGoals();
    } catch (error) { toast.error('Failed to create goal'); }
  };

  const handleUpdateProgress = async (goalId, progress) => {
    try {
      await goalsAPI.updateProgress(goalId, progress);
      toast.success('Progress updated!');
      fetchGoals();
    } catch (error) { toast.error('Failed to update progress'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Academic Goals</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No goals set yet. Create your first academic goal!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  goal.status === 'achieved' ? 'bg-green-100 text-green-700' :
                  goal.status === 'active' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {goal.status}
                </span>
                <span className="text-sm text-gray-500">{goal.goal_type}</span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{goal.title}</h3>
              {goal.description && <p className="text-sm text-gray-600 mb-3">{goal.description}</p>}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{goal.target_date}</span>
                </div>
                {goal.target_marks && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{goal.target_marks} marks</span>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>

              {goal.status === 'active' && (
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((p) => (
                    <button key={p} onClick={() => handleUpdateProgress(goal.id, p)} className="flex-1 text-xs py-1 border rounded hover:bg-primary-50">
                      {p}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Goal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Goal Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="input" required />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input" rows={2} />
              <select value={formData.goal_type} onChange={(e) => setFormData({...formData, goal_type: e.target.value})} className="input">
                <option value="exam_score">Exam Score</option>
                <option value="gpa">GPA Target</option>
                <option value="study_hours">Study Hours</option>
                <option value="custom">Custom</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Date</label>
                  <input type="date" value={formData.target_date} onChange={(e) => setFormData({...formData, target_date: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Marks</label>
                  <input type="number" placeholder="e.g., 90" value={formData.target_marks} onChange={(e) => setFormData({...formData, target_marks: e.target.value})} className="input" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
