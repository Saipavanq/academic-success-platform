import { useState, useEffect } from 'react';
import { studyPlansAPI } from '../services/api';
import { CheckCircle, Circle, Clock, Play, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const response = await studyPlansAPI.list();
      setPlans(response.data.results || response.data);
    } catch (error) { toast.error('Failed to load study plans'); }
    finally { setLoading(false); }
  };

  const fetchProgress = async (planId) => {
    try {
      const response = await studyPlansAPI.getProgress(planId);
      setProgress((prev) => ({ ...prev, [planId]: response.data }));
    } catch (error) { console.error('Failed to fetch progress'); }
  };

  const handleCompleteTask = async (planId, taskId) => {
    try {
      await studyPlansAPI.completeTask(planId, taskId);
      toast.success('Task completed!');
      fetchPlans();
      fetchProgress(planId);
    } catch (error) { toast.error('Failed to complete task'); }
  };

  const toggleExpand = (planId) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
    } else {
      setExpandedPlan(planId);
      if (!progress[planId]) fetchProgress(planId);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Plans</h1>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No study plans yet</p>
          <p className="text-sm text-gray-400">Upload a syllabus to generate an AI-powered study plan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(plan.id)}>
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                  <p className="text-sm text-gray-600">{plan.course_code} - {plan.exam_title}</p>
                  <p className="text-sm text-gray-500">{plan.start_date} to {plan.end_date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{plan.progress_percentage}%</p>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                  {expandedPlan === plan.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${plan.progress_percentage}%` }}></div>
                </div>
              </div>

              {expandedPlan === plan.id && progress[plan.id] && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center"><p className="text-2xl font-bold text-gray-900">{progress[plan.id].total_tasks}</p><p className="text-xs text-gray-500">Total Tasks</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-green-600">{progress[plan.id].completed}</p><p className="text-xs text-gray-500">Completed</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-yellow-600">{progress[plan.id].in_progress}</p><p className="text-xs text-gray-500">In Progress</p></div>
                    <div className="text-center"><p className="text-2xl font-bold text-gray-600">{progress[plan.id].total_hours}</p><p className="text-xs text-gray-500">Total Hours</p></div>
                  </div>

                  <div className="space-y-2">
                    {plan.tasks?.map((task) => (
                      <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg ${task.status === 'completed' ? 'bg-green-50' : task.status === 'in_progress' ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>{task.topic}</p>
                            <p className="text-xs text-gray-500">{task.scheduled_date} | {task.duration_minutes} mins</p>
                          </div>
                        </div>
                        {task.status !== 'completed' && (
                          <button onClick={() => handleCompleteTask(plan.id, task.id)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            Complete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
