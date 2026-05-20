import { useState, useEffect, useCallback } from 'react';
import { LearningSection, LearningRoadmap } from '../types';

interface UseLearningRoadmapResult {
  roadmap: LearningRoadmap | null;
  loading: boolean;
  error: string | null;
  generateRoadmap: (materialName: string) => Promise<void>;
  getRoadmap: (materialName: string) => Promise<void>;
}

export function useLearningRoadmap(): UseLearningRoadmapResult {
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = useCallback(async (materialName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // First, ensure the main learning material is processed
      console.log(`Ensuring learning material ${materialName} is processed...`);
      const mainResponse = await fetch(`/api/learning-materials?materialName=${materialName}`);
      
      if (!mainResponse.ok) {
        throw new Error('Failed to process learning material. Please check that the content file exists.');
      }
      
      console.log(`Learning material ${materialName} processed successfully. Generating roadmap...`);
      
      // Now generate the roadmap
      const response = await fetch('/api/learning-materials/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ materialName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }
      
      const data = await response.json();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRoadmap = useCallback(async (materialName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/learning-materials/roadmap?materialName=${materialName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Roadmap doesn't exist, try to generate it
          await generateRoadmap(materialName);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get roadmap');
      }
      
      const data = await response.json();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get roadmap');
    } finally {
      setLoading(false);
    }
  }, [generateRoadmap]);

  return {
    roadmap,
    loading,
    error,
    generateRoadmap,
    getRoadmap,
  };
}
