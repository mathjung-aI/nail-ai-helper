"use client";

export function ImageGenConfirmModal({
  open,
  accent,
  onConfirm,
  onTextOnly,
}: {
  open: boolean;
  accent: string;
  onConfirm: () => void;
  onTextOnly: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="img-gen-title"
      >
        <h3 id="img-gen-title" className="text-lg font-bold text-[#1A1A1A]">
          개선 예시 이미지도 만들까요?
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#444]">
          텍스트 피드백은 이미 준비됐어요. 학생 작품을 바탕으로{" "}
          <strong>부분 개선 예시 이미지 1장</strong>을 만들 수 있어요.
        </p>
        <p className="mt-2 rounded-xl bg-[#FFF6E8] px-3 py-2 text-[13px] text-[#7A5A00]">
          이미지 생성은 OpenAI API 키가 사용되며 비용이 발생할 수 있어요.
          보통 수십 초~1분 정도 걸립니다.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-xl font-bold text-white"
            style={{ background: accent }}
          >
            이미지 생성하기
          </button>
          <button
            type="button"
            onClick={onTextOnly}
            className="min-h-12 rounded-xl bg-[#F0EBE3] font-semibold text-[#333]"
          >
            텍스트 피드백만 받기
          </button>
        </div>
      </div>
    </div>
  );
}
