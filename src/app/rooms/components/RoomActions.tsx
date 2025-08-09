/*
 * RoomActions component
 *
 * This client component renders a delete button for a room. It submits
 * deletion via a server action to ensure database writes happen securely on
 * the server. Confirmation is requested from the user before submission.
 */

'use client';

import { useState, useTransition } from 'react';
import { deleteRoomAction } from '../actions';

interface RoomActionsProps {
  id: string;
}

export default function RoomActions({ id }: RoomActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      const result = await deleteRoomAction({}, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="inline-flex flex-col items-start space-y-1">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
