import { ImageResponse } from "next/og";
import { join } from "path";
import { readFile } from "fs/promises";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const { title } = {
    ...{
      title: process.env.SITE_NAME,
    },
    ...props,
  };

  const [fontFile, logoSvg] = await Promise.all([
    readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "./public/logo-icon.svg"), "utf-8"),
  ]);

  const font = Uint8Array.from(fontFile).buffer;
  const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-[#0E1F14]">
        <div tw="flex flex-none items-center justify-center h-[160px] w-[160px]">
          <img src={logoDataUri} width="160" height="160" alt="Celjoe Store" />
        </div>
        <p tw="mt-12 text-5xl font-bold text-white tracking-wide">
          {title}
        </p>
        <p tw="mt-4 text-2xl text-[#9BB59C] tracking-wide">
          From our kitchen to your table
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
