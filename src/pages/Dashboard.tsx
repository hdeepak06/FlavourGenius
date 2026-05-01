import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Sparkles, 
  Clock, 
  TrendingUp, 
  ChefHat, 
  ChevronRight,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../lib/gemini";

import { handleFirestoreError, OperationType } from "../lib/error-handler";

export default function Dashboard() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      const recipesPath = "recipes";
      try {
        // Fetch user's recipes
        const q = query(
          collection(db, recipesPath), 
          where("authorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const userRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        
        // Manual sort and limit
        userRecipes.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRecipes(userRecipes.slice(0, 3));

        // Fetch AI recommendations based on user history
        const historySummary = userRecipes.map(r => r.title);
        const aiRecs = await getRecommendations(historySummary);
        setRecommendations(aiRecs.recommended_recipes);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, recipesPath);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Hello, Chef {user?.displayName?.split(' ')[0] || "there"}!
          </h1>
          <p className="text-gray-500 mt-2 text-lg">What are we creating in the kitchen today?</p>
        </div>
        <Link 
          to="/add-recipe"
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-red-200 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add New Recipe
        </Link>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "My Recipes", value: recipes.length, icon: ChefHat, color: "bg-blue-50 text-blue-600" },
          { label: "AI Suggestions", value: recommendations.length, icon: Sparkles, color: "bg-purple-50 text-purple-600" },
          { label: "Cooking Hours", value: recipes.reduce((acc, r) => acc + (r.cookingTime || 0), 0), icon: Clock, color: "bg-green-50 text-green-600" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Recipes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recent Creations</h2>
            <Link to="/recipes" className="text-red-600 font-semibold text-sm flex items-center gap-1 hover:underline">
              View all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {recipes.length > 0 ? (
              recipes.map((recipe, i) => (
                <motion.div 
                  key={recipe.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      src={recipe.image || `https://source.unsplash.com/featured/?food,${recipe.title}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      alt=""
                    />
                  </div>
                  <div className="flex-1">
                    <motion.h3 
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="font-bold text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-wide text-sm cursor-default"
                    >
                      {recipe.title}
                    </motion.h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cookingTime}m</span>
                      <span className="flex items-center gap-1"><TrendingUp size={14} /> {recipe.difficulty}</span>
                    </div>
                  </div>
                  <Link to={`/recipes`} className="p-2 text-gray-300 group-hover:text-red-600 transition-colors">
                    <ChevronRight />
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <ChefHat size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No recipes yet. Start your journey!</p>
                <Link to="/add-recipe" className="text-red-600 font-bold mt-2 block">Create my first recipe →</Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-red-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">AI Ideas</h2>
          </div>
          
          <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-xl shadow-red-100 h-full">
            <p className="text-white/80 text-sm font-medium mb-6 uppercase tracking-widest">Personalized for you</p>
            <div className="space-y-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(n => <div key={n} className="h-12 bg-white/20 rounded-2xl" />)}
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="font-bold leading-tight group-hover:underline">{rec}</p>
                      <p className="text-xs text-white/60">Based on your palette</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <Link 
              to="/ai-explorer"
              className="mt-8 block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-center py-3 rounded-2xl font-bold transition-all"
            >
              Explore AI Generation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
