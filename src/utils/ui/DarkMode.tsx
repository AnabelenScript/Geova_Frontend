import { useState, useEffect } from 'react';

interface UseDarkModeReturn {
  darkMode: boolean;
  toggleDarkMode: () => void;
  DarkModeButton: () => JSX.Element;
}

export const useDarkMode = (): UseDarkModeReturn => {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const DarkModeButton = () => (
    <button
      onClick={toggleDarkMode}
      className="fixed top-6 right-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-[100] shadow-lg"
      aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {darkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );

  return {
    darkMode,
    toggleDarkMode,
    DarkModeButton
  };
};

export const getLoginBackgroundClasses = (darkMode: boolean, backgroundImage: string) => {
  return {
    className: "relative flex flex-col justify-center items-center w-full h-screen overflow-y-hidden bg-cover bg-center transition-all duration-300",
    style: {
      backgroundImage: `url('${backgroundImage}')`,
      filter: darkMode ? 'none' : 'invert(1)'
    }
  };
};

export const getLoginContainerClasses = (darkMode: boolean, isRegister: boolean) => {
  return {
    className: `
      relative w-[55vw] h-auto flex flex-row justify-center items-stretch gap-4 
      shadow-lg rounded-2xl z-30 p-12 transition-all duration-300
      ${isRegister ? 'register-machine' : ''}
    `.trim(),
    style: {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(165, 165, 165, 0.4)',
      transition: 'background-color 0.3s ease-in-out'
    }
  };
};