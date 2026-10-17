// src/components/CleanInput.tsx
import { containsBadWords } from '../utils/contentFilter'

const MSG = "Inappropriate language isn't allowed."

export function CleanInput({
  value,
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { value: string }) {
  const bad = containsBadWords(value ?? '')
  return (
    <>
      <input value={value} {...rest} className={`${className} ${bad ? '!border-red-500' : ''}`} />
      {bad && <p className='text-red-500 text-[10px] font-inter mt-1'>{MSG}</p>}
    </>
  )
}

export function CleanTextarea({
  value,
  className = '',
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const bad = containsBadWords(value ?? '')
  return (
    <>
      <textarea value={value} {...rest} className={`${className} ${bad ? '!border-red-500' : ''}`} />
      {bad && <p className='text-red-500 text-[10px] font-inter mt-1'>{MSG}</p>}
    </>
  )
}