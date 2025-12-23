'use client';

import { useState } from 'react';
import { User, Plus, DollarSign, X, Check } from 'lucide-react';
import { addProfile, addBudget } from '~/actions/gift-actions';
import type { Profile, Budget } from '~/lib/types';

interface OnboardingModalProps {
  profiles: Profile[];
  budgets: Budget[];
  onComplete: (userId: string) => void;
}

interface AddedBudget {
  recipientId: string;
  recipientName: string;
  limitAmount: number;
}

export function OnboardingModal({
  profiles,
  budgets,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<'select' | 'add-person' | 'budget'>(
    'select'
  );
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState('');
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [addedBudgets, setAddedBudgets] = useState<AddedBudget[]>([]);
  const [budgetForm, setBudgetForm] = useState({
    recipientId: '',
    limitAmount: '',
  });
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  const handleSelectUser = (userId: string) => {
    if (!userId) return;

    setSelectedUserId(userId);

    // Check if user has any budgets
    const hasBudget = budgets.some((b) => b.gifter_id === userId);
    if (!hasBudget) {
      setShowBudgetForm(true);
    } else {
      // User has budget, complete onboarding
      onComplete(userId);
    }
  };

  const handleAddNewPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    setIsAddingPerson(true);
    try {
      await addProfile(newPersonName.trim());
      // Reload the page to get the new profile
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setIsAddingPerson(false);
    }
  };

  const handleSkipBudget = () => {
    onComplete(selectedUserId);
  };

  const handleSubmitBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.recipientId || !budgetForm.limitAmount) return;

    setIsAddingBudget(true);
    try {
      await addBudget({
        gifterId: selectedUserId,
        recipientId: budgetForm.recipientId,
        limitAmount: parseFloat(budgetForm.limitAmount),
      });

      // Add to the list of added budgets
      const recipient = profiles.find((p) => p.id === budgetForm.recipientId);
      setAddedBudgets([
        ...addedBudgets,
        {
          recipientId: budgetForm.recipientId,
          recipientName: recipient?.name ?? 'Unknown',
          limitAmount: parseFloat(budgetForm.limitAmount),
        },
      ]);

      // Clear form for next budget
      setBudgetForm({ recipientId: '', limitAmount: '' });
      setIsAddingBudget(false);
    } catch (err: any) {
      alert(err.message);
      setIsAddingBudget(false);
    }
  };

  const handleFinishOnboarding = () => {
    onComplete(selectedUserId);
  };

  if (step === 'add-person') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Person</h2>
              <button
                onClick={() => setStep('select')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Add a new family member or recipient to the gift tracker.
            </p>
          </div>
          <form onSubmit={handleAddNewPerson} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Enter name (e.g., Eli, Grandma)"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingPerson || !newPersonName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingPerson ? 'Adding...' : 'Add Person'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (showBudgetForm && selectedUserId) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={24} />
              <h2 className="text-xl font-bold">Set Your Budget?</h2>
            </div>
            <p className="text-sm text-slate-600">
              Would you like to set a spending budget? You can skip this and set
              it later.
            </p>
          </div>
          <form onSubmit={handleSubmitBudget} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Who are you buying for?
              </label>
              <select
                value={budgetForm.recipientId}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, recipientId: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required={budgetForm.limitAmount !== ''}
              >
                <option value="">Select recipient</option>
                {profiles
                  .filter((p) => p.id !== selectedUserId)
                  .filter(
                    (p) => !addedBudgets.some((b) => b.recipientId === p.id)
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Budget Limit ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetForm.limitAmount}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, limitAmount: e.target.value })
                }
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {addedBudgets.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Budgets Added
                </p>
                {addedBudgets.map((budget, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-bold">{budget.recipientName}</span>
                      {' - '}
                      <span className="text-green-600 font-bold">
                        ${budget.limitAmount.toFixed(2)}
                      </span>
                    </span>
                    <Check className="text-green-600" size={16} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSkipBudget}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-300"
              >
                {addedBudgets.length > 0 ? 'Skip More' : 'Skip'}
              </button>
              <button
                type="submit"
                disabled={
                  isAddingBudget ||
                  !budgetForm.recipientId ||
                  !budgetForm.limitAmount
                }
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingBudget ? 'Adding...' : 'Add Budget'}
              </button>
            </div>

            {addedBudgets.length > 0 && (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
              >
                Done - Continue to App
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Welcome to Gift Tracker!</h2>
          </div>
          <p className="text-sm text-slate-600">
            Let's get started. Who are you?
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Select your name
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center text-sm text-slate-500">or</div>
          <button
            onClick={() => setStep('add-person')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus size={20} />
            Add New Person
          </button>
        </div>
      </div>
    </div>
  );
}
