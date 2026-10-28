import { useState } from 'react'
import { emptyItem, formatDates, type KindConfig } from '../kinds'
import type { Item, ItemInput } from '../types'
import { ItemEditor } from './ItemEditor'

interface ItemSectionProps {
  config: KindConfig
  items: Item[]
  techSuggestions: string[]
  onCreate: (item: ItemInput) => Promise<void>
  onUpdate: (id: number, item: ItemInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

type Open = number | 'new' | null


export function ItemSection({ config, items, techSuggestions, onCreate, onUpdate, onDelete }: ItemSectionProps) {
  const [open, setOpen] = useState<Open>(null)

  return (
    <section aria-labelledby={`${config.kind}-heading`} className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id={`${config.kind}-heading`} className="font-display text-3xl font-semibold text-ink">
            {config.label}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {items.length === 0 ? config.empty : `${items.length} ${items.length === 1 ? 'entry' : 'entries'}, newest first.`}
          </p>
        </div>
        {open !== 'new' && (
          <button type="button" onClick={() => setOpen('new')} className="btn-primary">
            Add {config.singular}
          </button>
        )}
      </header>

      <ul className="flex flex-col gap-2.5">
        {open === 'new' && (
          <li className="strip" style={{ borderLeftColor: config.band }}>
            <ItemEditor
              config={config}
              initial={emptyItem(config)}
              techSuggestions={techSuggestions}
              isNew
              onSave={async (item) => {
                await onCreate(item)
                setOpen(null)
              }}
              onCancel={() => setOpen(null)}
            />
          </li>
        )}

        {items.map((item) => {
          const isOpen = open === item.id
          const dates = formatDates(item.start_date, item.end_date, item.is_current, config.dates)
          return (
            <li key={item.id} className="strip" style={{ borderLeftColor: config.band }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex w-full flex-col gap-2 px-5 py-3.5 text-left hover:bg-ground/50 focus-visible:bg-ground/50 sm:px-6"
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-display text-lg leading-tight font-semibold text-ink">{item.title}</span>
                  {dates && <span className="text-sm text-muted tabular-nums">{dates}</span>}
                </span>
                {(item.role || item.organization) && (
                  <span className="flex flex-wrap items-center gap-x-2.5 text-sm text-ink/80">
                    {item.role && <span>{item.role}</span>}
                    {item.role && item.organization && <span aria-hidden className="h-3.5 w-px bg-rule" />}
                    {item.organization && <span className="text-muted">{item.organization}</span>}
                  </span>
                )}
                {(item.tech.length > 0 || item.bullets.length > 0) && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {item.tech.slice(0, 6).map((t) => (
                      <span key={t} className="rounded bg-ground px-1.5 py-0.5 text-xs text-ink/80">
                        {t}
                      </span>
                    ))}
                    {item.tech.length > 6 && <span className="text-xs text-muted">+{item.tech.length - 6} more</span>}
                    {item.bullets.length > 0 && (
                      <span className="text-xs text-muted">
                        {item.bullets.length} {item.bullets.length === 1 ? 'bullet' : 'bullets'}
                      </span>
                    )}
                  </span>
                )}
              </button>
              {isOpen && (
                <ItemEditor
                  config={config}
                  initial={item}
                  techSuggestions={techSuggestions}
                  isNew={false}
                  onSave={async (changes) => {
                    await onUpdate(item.id, changes)
                    setOpen(null)
                  }}
                  onCancel={() => setOpen(null)}
                  onDelete={async () => {
                    await onDelete(item.id)
                    setOpen(null)
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>

      {items.length === 0 && open !== 'new' && (
        <button
          type="button"
          onClick={() => setOpen('new')}
          className="rounded-md border border-dashed border-rule px-6 py-10 text-center text-sm text-muted hover:border-ink/40 hover:text-ink"
        >
          Nothing here yet. Add your first {config.singular}.
        </button>
      )}
    </section>
  )
}
