import Image from 'next/image';

export function ScriptVisionLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8">
        <Image
          src="/logo.png"
          alt="ScriptVision Logo"
          width={32}
          height={32}
          className="rounded-full"
        />
      </div>
      {showText && <span className="font-bold text-xl">ScriptVision</span>}
    </div>
  );
}
