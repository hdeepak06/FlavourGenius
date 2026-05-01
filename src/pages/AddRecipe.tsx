import React, { useState } from "react";
import { PlusCircle, Save, Loader2, ChefHat, Clock, Hash, Trash2, Plus, Sparkles } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { generateRecipeMeta } from "../lib/gemini";

import { handleFirestoreError, OperationType } from "../lib/error-handler";

export default function AddRecipe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    cookingTime: "",
    difficulty: "Medium",
    price: "",
    description: "",
  });

  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

  const addItem = (type: 'ingredient' | 'step') => {
    if (type === 'ingredient') setIngredients([...ingredients, ""]);
    else setSteps([...steps, ""]);
  };

  const removeItem = (type: 'ingredient' | 'step', index: number) => {
    if (type === 'ingredient') {
      const newIngs = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngs.length ? newIngs : [""]);
    } else {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps.length ? newSteps : [""]);
    }
  };

  const updateItem = (type: 'ingredient' | 'step', index: number, value: string) => {
    if (type === 'ingredient') {
      const newIcons = [...ingredients];
      newIcons[index] = value;
      setIngredients(newIcons);
    } else {
      const newSteps = [...steps];
      newSteps[index] = value;
      setSteps(newSteps);
    }
  };

  const handleSmartMeta = async () => {
    if (!formData.title || ingredients.some(i => !i)) return;
    setIsGeneratingMeta(true);
    try {
      const meta = await generateRecipeMeta(formData.title, ingredients);
      setFormData({ ...formData, description: meta.description });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    const recipesPath = "recipes";
    try {
      await addDoc(collection(db, recipesPath), {
        ...formData,
        title: formData.title.toUpperCase(),
        cookingTime: parseInt(formData.cookingTime),
        price: parseFloat(formData.price),
        ingredients: ingredients.filter(i => i),
        steps: steps.filter(s => s),
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
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
           <PlusCircle size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Create Flavor</h1>
          <p className="text-gray-500 font-medium tracking-wide">Manual recipe entry</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Core Info */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Recipe Name</label>
              <input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="w-full text-4xl font-black outline-none border-b-2 border-gray-50 focus:border-red-600 transition-colors pb-2 placeholder:text-gray-100 uppercase"
                placeholder="EPIC LEMON CHICKEN"
              />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                  <button 
                    type="button"
                    onClick={handleSmartMeta}
                    disabled={isGeneratingMeta}
                    className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {isGeneratingMeta ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Generate Meta
                  </button>
                </div>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-50 rounded-2xl p-4 text-gray-600 font-medium outline-none focus:ring-2 focus:ring-red-600 transition-all"
                  placeholder="Tell a story about this dish..."
                />
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 border-l-4 border-red-600 pl-4 uppercase tracking-tight">Ingredients</h3>
              <button 
                type="button" onClick={() => addItem('ingredient')}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-4 group">
                  <input 
                    value={ing}
                    onChange={(e) => updateItem('ingredient', i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                  />
                  <button 
                    type="button" onClick={() => removeItem('ingredient', i)}
                    className="p-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 border-l-4 border-blue-500 pl-4 uppercase tracking-tight">Instructions</h3>
              <button 
                type="button" onClick={() => addItem('step')}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-black text-sm text-gray-400">0{i + 1}</span>
                  <textarea 
                    value={step}
                    onChange={(e) => updateItem('step', i, e.target.value)}
                    placeholder={`Step ${i + 1}...`}
                    rows={2}
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                  <button 
                    type="button" onClick={() => removeItem('step', i)}
                    className="p-3 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Details</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time (Min)</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-4">
                  <Clock size={16} className="text-gray-400" />
                  <input 
                    type="number"
                    value={formData.cookingTime}
                    onChange={(e) => setFormData({...formData, cookingTime: e.target.value})}
                    className="w-full bg-transparent p-3 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cost (Estimate INR)</label>
                <div className="flex items-center bg-gray-50 rounded-xl px-4">
                  <span className="font-bold text-gray-400">₹</span>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-transparent p-3 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Difficulty</label>
                <select 
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full bg-gray-50 rounded-xl p-3 outline-none font-bold focus:ring-2 focus:ring-red-600 transition-all appearance-none"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
           </div>

           <button 
             type="submit"
             disabled={isSaving}
             className="w-full bg-gray-900 hover:bg-black text-white text-xl font-black py-8 rounded-[40px] shadow-2xl shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
             {isSaving ? "Saving..." : "PUBLISH"}
           </button>
        </div>
      </form>
    </div>
  );
}
