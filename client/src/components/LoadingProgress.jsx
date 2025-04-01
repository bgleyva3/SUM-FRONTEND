import React, { useState, useEffect } from 'react';

const LoadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [20, 45, 65, 85, 98];
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep]);
        currentStep++;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-700/50 rounded-lg border border-gray-600">
      <div className="w-64 mb-4">
        <div className="h-2 bg-gray-600 rounded-full">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <p>Generating summary... {progress}%</p>
      </div>
    </div>
  );
};

export default LoadingProgress; 