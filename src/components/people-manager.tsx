'use client';

import { useState } from 'react';
import { Users, X } from 'lucide-react';
import type { Profile } from '~/lib/types';

import { addProfile, deleteProfile } from "~/actions/gift-actions";

interface PeopleManagerProps {
  profiles: Profile[];
}

export function PeopleManager({ profiles }: PeopleManagerProps) {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsAdding(true);
    try {
      await addProfile(name.trim());
      setName('');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePerson = async (profileId: string) => {
    if (!confirm('Delete this person? This will also remove all their gifts and budgets.')) {
      return;
    }

    try {
      await deleteProfile(profileId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-slate-600" size={20} />
        <h3 className="font-bold text-lg">Manage Family & Recipients</h3>
      </div>

      <form onSubmit={handleAddPerson} className="flex gap-2 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Eli, Grandma)"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !name.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Adding...' : 'Add Person'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm"
          >
            <span>{profile.name}</span>
            <button
              onClick={() => handleDeletePerson(profile.id)}
              className="text-slate-500 hover:text-red-600 transition-colors"
              title="Delete person"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="text-slate-400 text-sm italic">No people added yet</p>
        )}
      </div>
    </div>
  );
}

