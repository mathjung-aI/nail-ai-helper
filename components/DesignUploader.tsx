"use client";

import type { DesignFeedback, Profile } from "@/lib/types";
import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";

export function DesignUploader({
  open,
  profile,
  accent,
  onClose,
  onResult,
}: {
  open: boolean;
  profile: Profile;
  accent: string;
  onClose: () => void;
  onResult: (feedback: DesignFeedback, previewUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function onFile(f: File | null) {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setError("이미지는 4MB 이하로 올려 주세요.");
      return;
    }
    setError(null);
    const resized = await resizeImage(f, 1024);
    setFile(resized);
    setPreview(URL.createObjectURL(resized));
  }

  async function submit() {
    if (!file) {
      setError("사진을 선택해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("note", note);
      fd.append("profile", JSON.stringify(profile));
      const res = await fetch("/api/design-feedback", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "fail");
      const dataUrl = await fileToDataUrl(file);
      onResult(data.feedback, dataUrl);
      onClose();
      setPreview(null);
      setFile(null);
      setNote("");
    } catch {
      setError(
        "지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도하거나 선생님께 알려 주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">내 디자인 피드백</h3>
          <button type="button" onClick={onClose} className="min-h-10 min-w-10 rounded-lg bg-[#F0EBE3]">
            <X className="mx-auto" size={18} />
          </button>
        </div>
        <p className="mt-1 text-[14px] text-[#555]">
          사진은 서버에 저장되지 않아요. 제작 가능성·두께·위치·색·통일감을 점검합니다.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D5CBBC] bg-[#FFFCFA]"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="미리보기" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <Upload size={28} className="text-[#888]" />
              <span className="text-sm font-semibold text-[#555]">
                촬영 또는 파일 선택 (jpg/png/webp)
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="메모 (선택) — 예: 약지 담당 팁"
          className="mt-3 w-full rounded-xl border border-[#DDD6CB] p-3 text-[15px]"
          rows={2}
        />

        {error && (
          <p className="mt-2 text-[14px] text-[#B33]">{error}</p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="mt-3 min-h-12 w-full rounded-xl font-bold text-white disabled:opacity-50"
          style={{ background: accent }}
        >
          {loading ? "교재를 기준으로 살펴보는 중…" : "피드백 받기"}
        </button>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function resizeImage(file: File, max: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return file;
  }
}
