"use client";

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Image from 'next/image';

interface GlobalHeaderProps {
  onHomeClick: () => void;
}

export function GlobalHeader({ onHomeClick }: GlobalHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Transparent Partners Logo */}
          <div className="flex items-center">
            <Image
              src="/transparent-partners-logo.png"
              alt="Transparent Partners"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>
          
          {/* Home Navigation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onHomeClick}
            className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
