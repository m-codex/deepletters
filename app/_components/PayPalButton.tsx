"use client";

import {
  PayPalButtons,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';

export interface PayPalOrder {
  id?: string;
  status?: string;
  [key: string]: unknown;
}

interface PayPalButtonProps {
  amount: string;
  onPaymentSuccess: (order: PayPalOrder) => void;
}

const PayPalButton = ({ amount, onPaymentSuccess }: PayPalButtonProps) => {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <>
      {isPending && <div className="spinner" />}
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(_data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: amount,
                },
              },
            ],
          });
        }}
        onApprove={async (_data, actions) => {
          if (actions.order) {
            const order = await actions.order.capture();
            onPaymentSuccess(order);
          }
        }}
      />
    </>
  );
};

export default PayPalButton;
