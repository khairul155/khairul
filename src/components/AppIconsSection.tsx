
import React from 'react';
import AppIcons from './AppIcons';

const AppIconsSection: React.FC = () => {
  return (
    <section className="py-10 px-4 glass-effect rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl my-10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2">Powerful AI Image Tools</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-10">
          Discover our suite of AI-powered tools to enhance your creative workflow
        </p>
        <AppIcons />
      </div>
    </section>
  );
};

export default AppIconsSection;
