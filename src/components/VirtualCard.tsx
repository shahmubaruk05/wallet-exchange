
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardApplication } from '@/lib/data';

const formatCardNumber = (number?: string) => {
  if (!number) return '•••• •••• •••• ••••';
  return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

const VirtualCard: React.FC<VirtualCardProps> = ({ application }) => {
  const [showDetails, setShowDetails] = useState(false);

  const cardHolderName = application.name || 'CARDHOLDER NAME';
  const cardNumber = application.cardNumber;
  const expiryDate = application.expiryDate || 'MM/YY';
  const cvc = application.cvc || '•••';

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative w-full h-56">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary via-blue-400 to-teal-300 shadow-lg p-6 flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <span className="font-bold text-lg">Wallet Exchange</span>
              <div className="w-12 h-8 bg-yellow-400 rounded-md flex items-center justify-center">
                 <div className="w-6 h-6 rounded-full bg-red-500 opacity-70 mix-blend-multiply"></div>
                 <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-70 mix-blend-multiply -ml-2"></div>
              </div>
            </div>
            <div className="space-y-2">
                <div className="font-mono text-xl tracking-widest text-center">
                    {showDetails ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                </div>
                 <div className="flex justify-between text-xs font-mono uppercase">
                    <span>{showDetails ? cardHolderName : 'CARDHOLDER NAME'}</span>
                    <div className="flex gap-4">
                        <span>{showDetails ? expiryDate : 'MM/YY'}</span>
                        <span>CVC: {showDetails ? cvc : '•••'}</span>
                    </div>
                </div>
            </div>
          </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button onClick={() => setShowDetails(!showDetails)} variant="secondary">
          {showDetails ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
    </div>
  );
};

export default VirtualCard;
