'use client';

import { useState } from 'react';
import { Users, X } from 'lucide-react';
import type { Profile } from '~/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(err);
      alert(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(message);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Manage People
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        <form onSubmit={handleAddPerson} className="flex gap-2">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Eli, Grandma)"
            className="flex-1 h-9"
            disabled={isAdding}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isAdding || !name.trim()}
          >
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {profiles.map((profile) => (
            <Badge
              key={profile.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{profile.name}</span>
              <button
                onClick={() => handleDeletePerson(profile.id)}
                className="hover:text-destructive transition-colors p-0.5 rounded-full"
                title="Delete person"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {profiles.length === 0 && (
            <p className="text-muted-foreground text-sm italic">No people added yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
