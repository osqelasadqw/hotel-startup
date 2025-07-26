import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  fullWidth,
  children,
  onClick,
  secondary,
  danger,
  disabled,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`
        flex 
        justify-center 
        rounded-md 
        px-3 
        py-2 
        text-sm 
        font-semibold 
        focus-visible:outline 
        focus-visible:outline-2 
        focus-visible:outline-offset-2 
        ${disabled && 'opacity-50 cursor-default'}
        ${fullWidth && 'w-full'}
        ${secondary ? 'bg-gray-100 text-gray-900' : 'text-white'}
        ${danger && 'bg-rose-500 hover:bg-rose-600 focus-visible:outline-rose-600'}
        ${!secondary && !danger && 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-700'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default Button; 