import React from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  Link,
  useLocation
} from "react-router-dom";
import { 
  LayoutDashboard, 
  Search, 
  Sparkles, 
  PlusCircle, 
  BookOpen, 
  User as UserIcon,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import AIExplorer from "./pages/AIExplorer";
import RecipeList from "./pages/RecipeList";
import AddRecipe from "./pages/AddRecipe";
import AuthPage from "./pages/AuthPage";
import { auth } from "./lib/firebase";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Recipes", path: "/recipes", icon: BookOpen },
    { name: "AI Explorer", path: "/ai-explorer", icon: Sparkles },
    { name: "Create", path: "/add-recipe", icon: PlusCircle },
  ];

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
            <Sparkles size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-800">FlavorGenius</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-white text-red-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => signOut(auth)}
            className="hidden md:flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
          
          <button 
            className="md:hidden p-2 text-gray-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-xl flex flex-col gap-2"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700"
              >
                <item.icon size={20} className="text-red-600" />
                {item.name}
              </Link>
            ))}
            <button 
              onClick={() => {
                signOut(auth);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600"
            >
              <LogOut size={20} />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <main className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/recipes" element={<PrivateRoute><RecipeList /></PrivateRoute>} />
              <Route path="/ai-explorer" element={<PrivateRoute><AIExplorer /></PrivateRoute>} />
              <Route path="/add-recipe" element={<PrivateRoute><AddRecipe /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}
