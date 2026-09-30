import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption { value: string; label: string }

export function SelectField({ value, options, onChange, label }: { value: string; options: SelectOption[]; onChange: (value: string) => void; label: string }) {
  return <Select.Root value={value} onValueChange={onChange}><Select.Trigger className="select-trigger" aria-label={label}><Select.Value /><Select.Icon><ChevronDown size={16} /></Select.Icon></Select.Trigger><Select.Portal><Select.Content className="select-content" position="popper" sideOffset={5}><Select.Viewport>{options.map((option) => <Select.Item className="select-item" value={option.value} key={option.value}><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Check size={15} /></Select.ItemIndicator></Select.Item>)}</Select.Viewport></Select.Content></Select.Portal></Select.Root>
}
