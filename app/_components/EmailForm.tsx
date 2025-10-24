"use client";

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface EmailFormProps {
  shareLink: string;
}

export default function EmailForm({ shareLink }: EmailFormProps) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('A letter for you');
  const [body, setBody] = useState('I wrote this letter for you. I hope you enjoy it.');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (body.length > 200) {
      setError('The body can be a maximum of 200 characters.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: recipient, subject, body, shareLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setSuccess('Email sent successfully!');
      setRecipient('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 p-8 bg-secondary-bg rounded-lg shadow-inner text-center">
      <h3 className="text-2xl font-bold text-primary mb-3">Send This Letter Via Email</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Recipient's Email Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-3 bg-tertiary-bg rounded-md text-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-3 bg-tertiary-bg rounded-md text-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>
        <div>
          <textarea
            placeholder="Your message (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            className="w-full p-3 bg-tertiary-bg rounded-md text-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-accent h-24 resize-none"
          />
          <p className="text-right text-xs text-secondary mt-1">{body.length}/200</p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-primary-btn hover:opacity-90 text-primary py-3 px-8 rounded-lg text-lg hover:shadow-xl transition-all transform hover:scale-105 inline-flex items-center justify-center gap-2 disabled:bg-tertiary-bg disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" /> 'Send Email'
          )}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </form>
    </div>
  );
}
