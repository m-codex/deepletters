"use client";

import { X } from "lucide-react";
import React from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary-bg rounded-lg shadow-2xl p-8 max-w-sm w-full relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-primary text-center mb-2">{title}</h2>
        {description && <p className="text-secondary text-center mb-6">{description}</p>}

        {children}

        <div className="flex justify-end gap-4 mt-8">
          {actions}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
