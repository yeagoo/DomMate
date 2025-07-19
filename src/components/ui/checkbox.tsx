import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked = false, onChange, disabled = false, className = "" }: CheckboxProps) {
  return (
    <div
      className={`
        h-4 w-4 rounded-sm border-2 border-gray-300 flex items-center justify-center cursor-pointer
        transition-colors duration-200
        ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-blue-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={() => !disabled && onChange?.(!checked)}
    >
      {checked && <Check className="h-3 w-3 text-white" />}
    </div>
  )
} 