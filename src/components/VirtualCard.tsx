
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CardApplication } from '@/lib/data';

const formatCardNumber = (number?: string) => {
  if (!number) return '•••• •••• •••• ••••';
  return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

const VirtualCard: React.FC<{ application: CardApplication }> = ({ application }) => {
  const [showDetails, setShowDetails] = useState(false);

  const cardHolderName = application.name || 'CARDHOLDER NAME';
  const cardNumber = application.cardNumber;
  const expiryDate = application.expiryDate || 'MM/YY';
  const cvc = application.cvc || '•••';

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative w-full h-56 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-400 to-teal-300 rounded-xl shadow-lg transform transition-transform duration-500 group-hover:scale-105"></div>
        <div className="relative w-full h-full rounded-xl p-6 flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <span className="font-bold text-lg">Wallet Exchange</span>
               <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
                    <div className="w-8 h-8 rounded-full bg-yellow-400/80 -ml-4"></div>
               </div>
            </div>
            <div className="space-y-4">
                <div className="font-mono text-xl tracking-widest text-center">
                    {showDetails ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                </div>
                 <div className="flex justify-between text-xs font-mono uppercase items-end">
                    <span className="truncate max-w-[150px]">{showDetails ? cardHolderName : 'CARDHOLDER NAME'}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-gray-200 text-[10px]">VALID THRU</span>
                        <span>{showDetails ? expiryDate : 'MM/YY'}</span>
                    </div>
                     <div className="flex flex-col items-end">
                         <span className="text-gray-200 text-[10px]">CVC</span>
                         <span>{showDetails ? cvc : '•••'}</span>
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
