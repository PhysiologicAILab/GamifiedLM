// Helper functions for character styling and display

export const getPersonalityColor = (trait: string) => {
  const colors = {
    'Encouraging': 'from-green-500 to-emerald-600',
    'Analytical': 'from-blue-500 to-indigo-600',
    'Creative': 'from-purple-500 to-pink-600',
    'Supportive': 'from-yellow-500 to-orange-600',
    'Challenging': 'from-red-500 to-rose-600',
    'Friendly': 'from-teal-500 to-cyan-600',
  };
  return colors[trait as keyof typeof colors] || 'from-gray-500 to-slate-600';
};

export const getGuidingStyleIcon = (styleName: string) => {
  const icons = {
    'Socratic Method': '🤔',
    'Direct Teaching': '📚',
    'Collaborative Learning': '🤝',
    'Problem-Based': '🧩',
    'Visual Learning': '🎨',
    'Adaptive Learning': '🔄',
  };
  return icons[styleName as keyof typeof icons] || '🎓';
};

