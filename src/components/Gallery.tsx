"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex gap-3 lg:sticky lg:top-32 lg:self-start">
      {images.length > 1 && (
        <div className="flex flex-col gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border ${i === active ? "border-[#e77600] shadow-[0_0_3px_2px_rgb(228_121_17_/_50%)]" : "border-gray-400"}`}
            >
              <Image src={src} alt="" width={48} height={48} className="max-h-11 w-auto object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="flex min-h-80 flex-1 items-center justify-center">
        <Image src={images[active]} alt={title} width={600} height={600} priority className="max-h-[520px] w-auto object-contain" />
      </div>
    </div>
  );
}
