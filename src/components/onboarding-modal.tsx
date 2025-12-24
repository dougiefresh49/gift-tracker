'use client';

import { useState } from 'react';
import { User, Plus, DollarSign, Check } from 'lucide-react';
import { addProfile, addBudget } from '~/actions/gift-actions';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
      setIsAddingBudget(false);
    }
  };

  const handleFinishOnboarding = () => {
    onComplete(selectedUserId);
  };

  if (step === 'add-person') {
    return (
      <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Add New Person
            </CardTitle>
            <CardDescription>
              Add a new family member or recipient to the gift tracker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNewPerson} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Name
                </label>
                <Input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter name (e.g., Eli, Grandma)"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('select')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isAddingPerson || !newPersonName.trim()}
                >
                  {isAddingPerson ? 'Adding...' : 'Add Person'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showBudgetForm && selectedUserId) {
    const availableRecipients = profiles
      .filter((p) => p.id !== selectedUserId)
      .filter((p) => !addedBudgets.some((b) => b.recipientId === p.id));

    return (
      <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Set Your Budget?
            </CardTitle>
            <CardDescription>
              Would you like to set a spending budget? You can skip this and set it later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBudget} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Who are you buying for?
                </label>
                <Select
                  value={budgetForm.recipientId}
                  onValueChange={(value) =>
                    setBudgetForm({ ...budgetForm, recipientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {availableRecipients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Budget Limit ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetForm.limitAmount}
                  onChange={(e) =>
                    setBudgetForm({ ...budgetForm, limitAmount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              {addedBudgets.length > 0 && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                    Budgets Added
                  </p>
                  {addedBudgets.map((budget, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-background rounded px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-bold">{budget.recipientName}</span>
                        {' - '}
                        <span className="text-green-600 font-bold">
                          ${budget.limitAmount.toFixed(2)}
                        </span>
                      </span>
                      <Check className="text-green-600 h-4 w-4" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleSkipBudget}
                >
                  {addedBudgets.length > 0 ? 'Skip More' : 'Skip'}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={
                    isAddingBudget ||
                    !budgetForm.recipientId ||
                    !budgetForm.limitAmount
                  }
                >
                  {isAddingBudget ? 'Adding...' : 'Add Budget'}
                </Button>
              </div>

              {addedBudgets.length > 0 && (
                <Button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="w-full"
                >
                  Done - Continue to App
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Welcome to Gift Tracker!
          </CardTitle>
          <CardDescription>
            Let's get started. Who are you?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select your name
            </label>
            <Select
              value={selectedUserId}
              onValueChange={handleSelectUser}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose..." />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center text-sm text-muted-foreground">or</div>
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setStep('add-person')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Person
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
