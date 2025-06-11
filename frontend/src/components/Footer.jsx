import { useEffect, useState } from "react";

const Footer = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  useEffect(() => {
    const handleDarkModeToggle = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener('darkModeToggle', handleDarkModeToggle);

    return () => {
      window.removeEventListener('darkModeToggle', handleDarkModeToggle);
    };
  }, []);
  return (
    <footer 
      className={`glass-footer text-center py-3 mt-4 ${darkMode ? "dark" : "light"}`} 
      style={{ width: '100%', height: "7%", marginTop: 'auto', bottom: 0, position: 'relative' }}
    >
      <p>&copy; 2025 Ecommerce AR. All rights reserved.</p>
    </footer>
  );
};

export default Footer;