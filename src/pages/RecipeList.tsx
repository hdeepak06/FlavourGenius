import React, { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Search, Filter, Clock, TrendingUp, ChefHat, Tag as TagIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { parseSmartSearch } from "../lib/gemini";

export default function RecipeList() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [filters, setFilters] = useState<any>({
    maxPrice: null,
    maxTime: null,
    mealType: null,
  });

  const fetchRecipes = async (appliedFilters = filters) => {
    setLoading(true);
    try {
      let q = query(collection(db, "recipes"));
      
      // Basic manual client-side filtering since Firestore composite indexes can be complex to setup dynamically
      // For this demo, we'll fetch then filter
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Manual sort since we removed orderBy
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

      if (appliedFilters.maxPrice) list = list.filter(r => r.price <= appliedFilters.maxPrice);
      if (appliedFilters.maxTime) list = list.filter(r => r.cookingTime <= appliedFilters.maxTime);
      if (appliedFilters.mealType) list = list.filter(r => r.tags?.some((t: string) => t.toLowerCase().includes(appliedFilters.mealType.toLowerCase())));

      setRecipes(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSmartSearching(true);
    try {
      const parsedFilters = await parseSmartSearch(searchQuery);
      const newFilters = {
        maxPrice: parsedFilters.max_price ? parseInt(parsedFilters.max_price) : null,
        maxTime: parsedFilters.max_cooking_time ? parseInt(parsedFilters.max_cooking_time) : null,
        mealType: parsedFilters.meal_type || null,
      };
      setFilters(newFilters);
      await fetchRecipes(newFilters);
    } catch (err) {
      console.error("Smart search failed:", err);
    } finally {
      setIsSmartSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 flex-1 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your FlavorBook</h1>
          <form onSubmit={handleSmartSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
              <Sparkles size={20} />
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try smart search: 'healthy breakfast under 300'..."
              className="w-full pl-12 pr-24 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-600 outline-none transition-all text-gray-700 font-medium"
            />
            <button 
              type="submit"
              disabled={isSmartSearching}
              className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors"
            >
              {isSmartSearching ? "Parsing..." : "Smart Search"}
            </button>
          </form>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {(filters.maxPrice || filters.maxTime || filters.mealType) && (
          <button 
            onClick={() => {
              const reset = { maxPrice: null, maxTime: null, mealType: null };
              setFilters(reset);
              fetchRecipes(reset);
              setSearchQuery("");
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            Clear Filters
          </button>
        )}
        {filters.maxPrice && <span className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider">Max ₹{filters.maxPrice}</span>}
        {filters.maxTime && <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">Under {filters.maxTime}m</span>}
        {filters.mealType && <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">{filters.mealType}</span>}
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-gray-100" />
          ))
        ) : recipes.length > 0 ? (
          recipes.map((recipe, i) => (
            <motion.div 
              key={recipe.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
            >
              <div className="h-52 relative overflow-hidden bg-gray-50">
                <img 
                  src={recipe.image || `https://source.unsplash.com/featured/?food,${recipe.title}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={recipe.title}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-gray-900 border border-gray-100 uppercase tracking-widest shadow-sm">
                  {recipe.difficulty}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {recipe.tags?.slice(0, 2).map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] uppercase tracking-widest font-black text-red-600 bg-red-50 px-2 py-1 rounded">{tag}</span>
                  ))}
                </div>
                <motion.h3 
                  whileHover={{ scale: 1.03, x: 2 }}
                  className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1 origin-left"
                >
                  {recipe.title}
                </motion.h3>
                <p className="text-gray-500 text-sm line-clamp-2 font-medium leading-relaxed">{recipe.description || "A custom recipe generated by FlavorGenius AI."}</p>
                
                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                    <Clock size={16} />
                    <span className="text-sm font-bold">{recipe.cookingTime}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-green-500 transition-colors font-bold">
                    <span className="text-base font-black">₹</span>
                    <span className="text-sm">{recipe.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
                    <ChefHat size={16} />
                    <span className="text-sm font-bold">{recipe.ingredients?.length} Items</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
             <Search size={64} className="mx-auto text-gray-200 mb-6" />
             <h3 className="text-2xl font-bold text-gray-400">No recipes found</h3>
             <p className="text-gray-400">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
