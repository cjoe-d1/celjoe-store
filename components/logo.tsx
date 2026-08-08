import clsx from "clsx";

export default function LogoImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.ico"
      alt="Celjoe Store"
      className={clsx("h-6 w-auto", className)}
      {...props}
    />
  );
}
