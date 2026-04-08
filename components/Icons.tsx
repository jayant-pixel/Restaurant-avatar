export function LiveAvatarLogo() {
  return (
    <div className="flex items-center gap-2 text-white">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-slate-950">
        LA
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.28em]">
        LiveAvatar
      </span>
    </div>
  );
}

type IconSvgProps = {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
};

export function MicIcon({ size = 24, width, height, ...props }: IconSvgProps) {
  return (
    <svg
      fill="none"
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 0 1-3-3V5a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export function MicOffIcon({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) {
  return (
    <svg
      fill="none"
      height={size || height}
      viewBox="0 0 24 24"
      width={size || width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.586 15H4a1 1 0 0 1-.894-1.447l3.5-7A1 1 0 0 1 7.5 6h1.086l-1.293 1.293a1 1 0 0 0 1.414 1.414L12 5.414l4.293 4.293a1 1 0 0 0 1.414-1.414L15.414 6H16a1 1 0 0 1 .894.553l3.5 7A1 1 0 0 1 19.5 15h-1.586l-1.707 1.707a1 1 0 0 1-1.414-1.414L16.586 15H7.414l-1.707 1.707a1 1 0 0 1-1.414-1.414L5.586 15Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path
        d="M12 8v4l3 3m2-5h-5l-1 1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export function LoadingIcon({
  size = 24,
  width,
  height,
  className,
  ...props
}: IconSvgProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      height={size || height}
      viewBox="0 0 1024 1024"
      width={size || width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M512 170.667c-188.523 0-341.333 152.81-341.333 341.333S323.477 853.333 512 853.333a339.84 339.84 0 0 0 208.704-71.232c22.4-17.322 33.621-26.005 39.403-28.842 4.202-2.07 5.781-2.944 7.466-3.499 1.664-.576 3.435-.853 8.043-1.813 6.315-1.28 22.997-1.28 56.384-1.28 13.333 0 20.01 0 22.933 2.325a10.347 10.347 0 0 1 4.011 8.256c.043 3.733-3.627 8.384-10.923 17.707C769.941 874.624 648.448 938.667 512 938.667 276.352 938.667 85.333 747.648 85.333 512S276.352 85.333 512 85.333c136.448 0 257.92 64.043 336.021 163.712 7.318 9.323 10.966 13.974 10.923 17.707a10.347 10.347 0 0 1-4.01 8.256c-2.923 2.325-9.6 2.325-22.934 2.325-33.387 0-50.07 0-56.384-1.28-4.608-.938-6.379-1.237-8.043-1.813-1.685-.555-3.264-1.43-7.466-3.499-5.782-2.837-16.982-11.52-39.403-28.842A339.84 339.84 0 0 0 512 170.667z"
        data-follow-fill="#2c2c2c"
        fill="currentColor"
      />
      <path
        d="M832 682.667a170.667 170.667 0 1 0 0-341.334 170.667 170.667 0 0 0 0 341.334z"
        data-follow-fill="#2c2c2c"
        fill="currentColor"
      />
    </svg>
  );
}
