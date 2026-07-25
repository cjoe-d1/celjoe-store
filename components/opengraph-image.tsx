import { ImageResponse } from "next/og";
import LogoIcon from "./icons/logo";
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

  const file = await readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf"));
  const font = Uint8Array.from(file).buffer;

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-[#0E1F14]">
        <div tw="flex flex-none items-center justify-center h-[160px] w-[160px]">
          <LogoIcon width="140" height="32" fill="white" />
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
