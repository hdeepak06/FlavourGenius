import React, { useState } from "react";
import { Sparkles, Loader2, Save, ChefHat, Clock, Hash, ChevronRight } from "lucide-react";
import { generateRecipe, generateRecipeMeta } from "../lib/gemini";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

import { handleFirestoreError, OperationType } from "../lib/error-handler";

export default function AIExplorer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRecipe(null);
    setMeta(null);
    try {
      const ingredientList = ingredients.split(",").map(i => i.trim());
      const res = await generateRecipe(ingredientList);
      setRecipe(res);
      const metaRes = await generateRecipeMeta(res.recipe_name, res.ingredients);
      setMeta(metaRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToBook = async () => {
    if (!recipe || !user) return;
    setIsSaving(true);
    const recipesPath = "recipes";
    try {
      await addDoc(collection(db, recipesPath), {
        title: recipe.recipe_name,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        cookingTime: parseInt(recipe.cooking_time),
        difficulty: recipe.difficulty,
        price: parseFloat(recipe.estimated_cost_in_inr),
        description: meta?.description || "",
        tags: meta?.tags || [],
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });
      navigate("/recipes");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, recipesPath);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="text-center space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6 shadow-lg shadow-red-50/50">
          <Sparkles size={40} />
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight">AI Recipe Explorer</h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto">
          Enter what you have in your fridge, and let our AI chef craft something extraordinary.
        </p>
      </section>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Ingredients</label>
            <input 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. eggs, spinach, feta cheese, olives"
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all text-lg font-medium"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !ingredients}
            className="md:self-end bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold h-[60px] px-10 rounded-2xl shadow-xl shadow-red-200 flex items-center gap-3 transition-all active:scale-95"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isGenerating ? "Cooking..." : "Generate Recipe"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {recipe && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[40px] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden"
          >
            {/* Hero Image / Header */}
            <div className="h-64 bg-slate-100 relative overflow-hidden">
               <img 
                 src={`https://source.unsplash.com/featured/?food,${recipe.recipe_name}`} 
                 className="w-full h-full object-cover" 
                 alt=""
               />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end p-12">
                 <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     {meta?.tags?.map((tag: string, i: number) => (
                       <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider">{tag}</span>
                     ))}
                   </div>
                   <h2 className="text-4xl font-black text-white">{recipe.recipe_name}</h2>
                 </div>
               </div>
            </div>

            <div className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Time</p>
                    <p className="text-lg font-bold text-gray-800">{recipe.cooking_time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <ChefHat size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Difficulty</p>
                    <p className="text-lg font-bold text-gray-800">{recipe.difficulty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <span className="font-bold text-xl">₹</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cost (Est)</p>
                    <p className="text-lg font-bold text-gray-800">₹{recipe.estimated_cost_in_inr}</p>
                  </div>
                </div>
              </div>

              {meta?.description && (
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 italic text-gray-600 text-lg leading-relaxed">
                  "{meta.description}"
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <ChefHat />
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ingredients</h3>
                  </div>
                  <ul className="space-y-4">
                    {recipe.ingredients.map((ing: string, i: number) => (
                      <li key={i} className="flex items-center gap-4 pb-4 border-b border-gray-50 text-gray-700 font-medium last:border-0 hover:translate-x-2 transition-transform">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-600">
                    <ChevronRight className="rotate-90" />
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Instructions</h3>
                  </div>
                  <div className="space-y-8">
                    {recipe.steps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-6">
                        <span className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</span>
                        <p className="text-gray-700 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-12 flex justify-center">
                <button 
                  onClick={saveToBook}
                  disabled={isSaving}
                  className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-3xl font-black text-lg transition-all active:scale-95 shadow-2xl shadow-gray-300 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                  {isSaving ? "Saving to your Book..." : "Add to my FlavorBook"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
