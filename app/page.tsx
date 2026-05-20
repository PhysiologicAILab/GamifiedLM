'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Sparkles, BookOpen } from 'lucide-react';

interface LearningMaterial {
  id: string;
  name: string;
  path: string;
}

export default function Home() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/learning-materials/list');
        if (!response.ok) {
          throw new Error('Failed to fetch learning materials');
        }
        const data = await response.json();
        setMaterials(data.materials);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleMaterialSelect = (materialId: string) => {
    router.push(`/learn/${materialId}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-stone-900 to-purple-900">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="text-lg">Loading learning materials...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-stone-900 to-purple-900">
        <div className="text-center text-white">
          <div className="text-red-400 text-xl mb-4">Error loading materials</div>
          <div className="text-gray-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-stone-900 to-purple-900 overflow-auto">
      <div className="min-h-full flex flex-col items-center justify-center p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-purple-400 mr-4 animate-pulse" />
            <h1 className="text-6xl font-bold text-white tracking-tight">
              GamifiedLM
            </h1>
            <Sparkles className="w-12 h-12 text-purple-400 ml-4 animate-pulse animation-delay-500" />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your learning experience with AI-powered companions and interactive materials. 
            Choose a learning material to begin your gamified educational journey.
          </p>
        </div>

        {/* Materials Selection */}
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-center mb-8">
            <BookOpen className="w-8 h-8 text-purple-400 mr-3" />
            <h2 className="text-2xl font-semibold text-white">Select Learning Material</h2>
          </div>
          
          {materials.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No learning materials found</p>
              <p className="text-sm mt-2">Add materials to the data/learning-materials directory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <button
                  key={material.id}
                  onClick={() => handleMaterialSelect(material.id)}
                  className="group relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 
                           hover:bg-white/20 hover:border-purple-400/50 hover:scale-105 
                           transition-all duration-300 ease-out hover:shadow-xl hover:shadow-purple-500/20
                           focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <FileText className="w-16 h-16 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">
                        {material.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300">
                        Interactive learning material
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 
                                group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300"></div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>Powered by AI • Interactive Learning • Gamified Experience</p>
        </div>
      </div>
    </div>
  );
}
