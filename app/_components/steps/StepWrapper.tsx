import React from 'react';

interface StepWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: React.ReactElement;
  buttonText: string;
  onNext: () => void;
  isNextDisabled?: boolean;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  isSecondaryDisabled?: boolean;
}

export default function StepWrapper({
  children,
  title,
  description,
  icon,
  buttonText,
  onNext,
  isNextDisabled = false,
  secondaryButtonText,
  onSecondaryClick,
  isSecondaryDisabled = false,
}: StepWrapperProps) {
  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-bg rounded-full mb-4">
          {icon}
        </div>
        <h2 className="text-4xl text-primary mb-4">{title}</h2>
        <p className="text-gradient text-lg mb-2">{description}</p>
      </div>

      <div>{children}</div>

      <div className="fixed bottom-0 left-0 right-0 bg-primary-bg bg-opacity-90 backdrop-blur-sm p-4 border-t border-secondary-bg">
        <div className={`container mx-auto flex ${secondaryButtonText ? 'gap-4' : ''}`}>
          {secondaryButtonText && onSecondaryClick && (
            <button
              onClick={onSecondaryClick}
              disabled={isSecondaryDisabled}
              className="flex-1 py-4 bg-gradient-secondary-btn hover:opacity-90 text-primary rounded-md font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryButtonText}
            </button>
          )}
          <button
            onClick={onNext}
            disabled={isNextDisabled}
            className={`${
              secondaryButtonText ? 'flex-1' : 'w-full'
            } p-4 bg-gradient-secondary-btn hover:opacity-90 text-primary rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
