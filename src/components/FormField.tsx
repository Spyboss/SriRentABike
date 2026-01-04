import React from 'react';
import { Lock, LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name?: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  colSpan?: boolean;
  readOnly?: boolean;
  icon?: LucideIcon;
  suffix?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type,
  required = true,
  placeholder,
  value,
  onChange,
  colSpan = false,
  readOnly = false,
  icon: Icon,
  suffix
}) => (
  <div className={`space-y-2.5 ${colSpan ? 'md:col-span-2' : ''}`}>
    <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 ml-1 block">
      {label} {required && '*'}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-orange-500 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full ${Icon ? 'pl-12' : 'px-5'} ${suffix ? 'pr-14' : 'pr-5'} py-4 rounded-2xl border-stone-200 ${
          readOnly ? 'bg-stone-100 text-stone-500' : 'bg-stone-50 text-stone-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
        } transition-all placeholder-stone-300 font-medium min-h-[56px] shadow-sm hover:border-stone-300`}
      />
      {suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
          {suffix}
        </span>
      )}
      {readOnly && <Lock className="w-4 h-4 text-stone-300 absolute right-5 top-1/2 -translate-y-1/2" />}
    </div>
  </div>
);
