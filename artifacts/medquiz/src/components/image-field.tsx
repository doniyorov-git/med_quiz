import { useState } from 'react';
import { fileToImage, rotateImage } from '@/lib/images';
import { Btn, Icon } from '@/components/chrome';

export function ImageField({
  value,
  onChange,
  round = false,
  label = 'Rasm',
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  round?: boolean;
  label?: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (task: () => Promise<string>) => {
    setBusy(true);
    setError('');
    try {
      onChange(await task());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Rasm saqlanmadi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="input-label">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#1f2937]">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Icon name="ri-image-line" className="text-2xl text-slate-500" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary cursor-pointer px-3 py-2 text-xs">
            <Icon name="ri-upload-2-line" />
            {value ? 'Almashtirish' : 'Rasm yuklash'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              data-testid="input-image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void apply(() => fileToImage(file));
              }}
            />
          </label>
          {value && (
            <>
              <Btn kind="line" className="px-3 py-2 text-xs" disabled={busy} onClick={() => void apply(() => rotateImage(value))}>
                <Icon name="ri-clockwise-line" /> Aylantirish
              </Btn>
              <Btn kind="danger" className="px-3 py-2 text-xs" onClick={() => onChange(null)}>
                <Icon name="ri-delete-bin-line" /> Olib tashlash
              </Btn>
            </>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
