"use client";

import Image from "next/image";
import { useSupabase } from "@/components/SupabaseProvider";
import { useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";

interface Photo {
  file: File;
  preview: string;
  type: "before" | "after";
  uploaded: boolean;
  url?: string;
}

interface Props {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export function PhotoUpload({ photos, onChange }: Props) {
  const supabase = useSupabase();
  const [uploading, setUploading] = useState(false);

  function handleFileSelect(type: "before" | "after") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      const newPhotos: Photo[] = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type,
        uploaded: false,
      }));
      onChange([...photos, ...newPhotos]);
    };
    input.click();
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview);
    onChange(photos.filter((_, i) => i !== index));
  }

  async function uploadAll(): Promise<string[]> {
    setUploading(true);
    try {
      const urls = await Promise.all(
        photos
          .filter((p) => !p.uploaded)
          .map(async (photo) => {
            const ext = photo.file.name.split(".").pop() || "jpg";
            const fileName = `${crypto.randomUUID()}.${ext}`;
            const filePath = `${photo.type === "before" ? "antes" : "despues"}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("work-photos")
              .upload(filePath, photo.file, {
                contentType: photo.file.type,
              });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from("work-photos")
              .getPublicUrl(filePath);

            return urlData.publicUrl;
          })
      );
      onChange(photos.map((p) => ({ ...p, uploaded: true, url: p.url || "" })));
      return urls;
    } finally {
      setUploading(false);
    }
  }

  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Fotos — Antes
        </label>
        <div className="flex flex-wrap gap-2">
          {beforePhotos.map((photo, i) => {
            const idx = photos.indexOf(photo);
            return (
              <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                <Image
                  src={photo.preview}
                  alt="Vista previa foto antes"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => handleFileSelect("before")}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-blue-400 hover:text-blue-500"
          >
            <Camera size={24} />
            <span className="mt-1 text-xs">Agregar</span>
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Fotos — Después
        </label>
        <div className="flex flex-wrap gap-2">
          {afterPhotos.map((photo, i) => {
            const idx = photos.indexOf(photo);
            return (
              <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                <Image
                  src={photo.preview}
                  alt="Vista previa foto después"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => handleFileSelect("after")}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-blue-400 hover:text-blue-500"
          >
            <Camera size={24} />
            <span className="mt-1 text-xs">Agregar</span>
          </button>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="animate-spin" size={16} />
          Subiendo fotos...
        </div>
      )}
    </div>
  );
}
