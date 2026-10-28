interface FieldLabelProps {
  text: string
  optional?: boolean
}

// A form label, with a quiet "(optional)" marker for fields you can leave blank.
export function FieldLabel({ text, optional = false }: FieldLabelProps) {
  return (
    <span className="text-sm font-medium text-ink">
      {text}
      {optional && <span className="font-normal text-muted"> (optional)</span>}
    </span>
  )
}
