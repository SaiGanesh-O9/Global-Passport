import React from 'react';
import { Search } from 'lucide-react';
import Input from './Input.jsx';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) {
  return (
    <Input
      icon={Search}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}
